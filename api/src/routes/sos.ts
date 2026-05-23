import { Router, Response } from 'express';
import { pool } from '../db/pool';
import { authenticate, AuthRequest } from '../middleware/auth';
import { sendBulkSMS, sendExpoPush } from '../services/NotificationService';
const r = Router();
r.use(authenticate);

// Cross-app push dispatch: sends to ALL tokens for this user regardless of which app registered them
async function triggerSOSAlarm(sosId: string, userId: string, userName: string, lat: number|null, lng: number|null, triggerMethod: string, sourceApp: string = 'dorpwag') {
  const coords = lat && lng ? `GPS: https://maps.google.com?q=${lat},${lng}` : 'GPS nie beskikbaar nie';
  const smsText = `🚨 DORPWAG™ NOODALARM — ${userName} het 'n SOS geaktiveer (${triggerMethod}). ${coords}. Reageer onmiddellik!`;

  // Get guardian contacts + trusted contacts
  const contacts = await pool.query(
    `SELECT gc.phone, gc.push_token FROM guardian_contacts gc WHERE gc.user_id=$1 AND gc.is_primary=false
     UNION
     SELECT st.phone, NULL FROM sos_trusted_contacts st WHERE st.user_id=$1 AND st.is_active=true`,
    [userId]
  );
  const contactList = contacts.rows.map((c: any) => ({ name: 'Contact', phone: c.phone, pushToken: c.push_token }));

  // Cross-app: get ALL push tokens for this user across ALL registered apps
  const allTokens = await pool.query(
    'SELECT token, app_name FROM push_tokens WHERE user_id=$1',
    [userId]
  );

  // Also get push tokens from guardian contacts who may be on any app
  const contactPushTokens = contactList.filter((c: any) => c.pushToken).map((c: any) => c.pushToken!);

  // Merge all tokens, deduplicate
  const allPushTokens = [...new Set([
    ...allTokens.rows.map((t: any) => t.token),
    ...contactPushTokens
  ])];

  // Channel ID per app for proper notification routing
  const channelId = sourceApp === 'ouma_en_oppas' ? 'ouma-emergency' : 'dorpie-emergency';

  await Promise.all([
    sendBulkSMS(contactList, smsText),
    sendExpoPush(allPushTokens, '🚨 NOODALARM', `${userName} het hulp nodig!`, { sosId, sourceApp }, channelId),
  ]);

  // Log to notification_log
  await pool.query(
    `INSERT INTO notification_log (user_id, title, body, type, target_app, status)
     VALUES ($1, $2, $3, $4, $5, $6)`,
    [userId, '🚨 NOODALARM', `${userName} het hulp nodig!`, 'sos', sourceApp, 'sent']
  );

  await pool.query('UPDATE sos_events SET escalation_attempts=escalation_attempts+1,last_escalation_at=NOW() WHERE id=$1', [sosId]);
}

r.post('/trigger', async (req: AuthRequest, res: Response) => {
  const { lat, lng, message, source = 'manual', triggerMethod = 'button', appName = 'dorpwag' } = req.body;
  try {
    const u = await pool.query('SELECT name FROM users WHERE id=$1', [req.user!.id]);
    const { rows } = await pool.query(
      'INSERT INTO sos_events(user_id,lat,lng,message,source,trigger_method,source_app) VALUES($1,$2,$3,$4,$5,$6,$7) RETURNING *',
      [req.user!.id, lat, lng, message, source, triggerMethod, appName]
    );
    const sos = rows[0];
    await triggerSOSAlarm(sos.id, req.user!.id, u.rows[0].name, lat, lng, triggerMethod, appName);
    res.status(201).json({ success: true, data: sos });
  } catch(e) { console.error(e); res.status(500).json({ success: false, message: 'Failed' }); }
});

r.post('/silent', async (req: AuthRequest, res: Response) => {
  const { lat, lng, triggerMethod = 'shake', appName = 'dorpwag' } = req.body;
  try {
    const u = await pool.query('SELECT name FROM users WHERE id=$1', [req.user!.id]);
    const { rows } = await pool.query(
      'INSERT INTO sos_events(user_id,lat,lng,source,trigger_method,source_app) VALUES($1,$2,$3,$4,$5,$6) RETURNING *',
      [req.user!.id, lat || null, lng || null, 'silent', triggerMethod, appName]
    );
    const sos = rows[0];
    await triggerSOSAlarm(sos.id, req.user!.id, u.rows[0].name, lat, lng, triggerMethod, appName);
    res.status(201).json({ success: true, data: sos });
  } catch(e) { res.status(500).json({ success: false, message: 'Failed' }); }
});

r.post('/:sosId/gps-update', async (req: AuthRequest, res: Response) => {
  const { lat, lng, speed, heading } = req.body;
  try {
    await pool.query('INSERT INTO sos_gps_trail(sos_event_id,lat,lng,speed,heading) VALUES($1,$2,$3,$4,$5)', [req.params.sosId, lat, lng, speed, heading]);
    res.json({ success: true });
  } catch { res.status(500).json({ success: false, message: 'Failed' }); }
});

r.get('/:sosId/trail', async (req: AuthRequest, res: Response) => {
  try {
    const { rows } = await pool.query('SELECT * FROM sos_gps_trail WHERE sos_event_id=$1 ORDER BY created_at', [req.params.sosId]);
    res.json({ success: true, data: rows });
  } catch { res.status(500).json({ success: false, message: 'Failed' }); }
});

r.post('/:sosId/resolve', async (req: AuthRequest, res: Response) => {
  try {
    await pool.query("UPDATE sos_events SET status='resolved',resolved_at=NOW(),resolved_by=$1 WHERE id=$2", [req.user!.id, req.params.sosId]);
    res.json({ success: true });
  } catch { res.status(500).json({ success: false, message: 'Failed' }); }
});

r.post('/:sosId/acknowledge', async (req: AuthRequest, res: Response) => {
  try {
    await pool.query("UPDATE sos_events SET acknowledged_by=$1,acknowledged_at=NOW(),status='acknowledged' WHERE id=$2", [req.user!.id, req.params.sosId]);
    res.json({ success: true });
  } catch { res.status(500).json({ success: false, message: 'Failed' }); }
});

r.get('/:sosId/evidence', async (req: AuthRequest, res: Response) => {
  try {
    const { rows } = await pool.query('SELECT * FROM sos_evidence WHERE sos_event_id=$1 ORDER BY captured_at', [req.params.sosId]);
    res.json({ success: true, data: rows });
  } catch { res.status(500).json({ success: false, message: 'Failed' }); }
});

r.post('/:sosId/evidence/upload-url', async (req: AuthRequest, res: Response) => {
  res.json({ success: true, data: { uploadUrl: 'CONFIGURE_S3_PRESIGNED_URL', note: 'Configure AWS_S3_BUCKET in env' } });
});

r.post('/:sosId/evidence/complete', async (req: AuthRequest, res: Response) => {
  const { type, cloudStoragePath, duration, fileSize } = req.body;
  try {
    const { rows } = await pool.query(
      'INSERT INTO sos_evidence(sos_event_id,user_id,type,cloud_storage_path,duration,file_size,uploaded_at) VALUES($1,$2,$3,$4,$5,$6,NOW()) RETURNING *',
      [req.params.sosId, req.user!.id, type, cloudStoragePath, duration, fileSize]
    );
    res.json({ success: true, data: rows[0] });
  } catch { res.status(500).json({ success: false, message: 'Failed' }); }
});

export default r;
