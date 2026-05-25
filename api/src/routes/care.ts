import { Router, Response } from 'express';
import { pool } from '../db/pool';
import { authenticate, AuthRequest } from '../middleware/auth';
const r = Router();
r.use(authenticate);

// ─── CARE SCHEDULE ───────────────────────────────────────────────────────────

r.post('/schedule', async (req: AuthRequest, res: Response) => {
  const { elderUserId, title, description, scheduledAt, recurrence, caregiverId } = req.body;
  if (!elderUserId || !title || !scheduledAt) {
    res.status(400).json({ success: false, message: 'elderUserId, title, and scheduledAt required' });
    return;
  }
  try {
    const { rows } = await pool.query(
      `INSERT INTO care_schedules (elder_user_id, caregiver_user_id, title, description, scheduled_at, recurrence, created_by)
       VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
      [elderUserId, caregiverId || req.user!.id, title, description || null, scheduledAt, recurrence || null, req.user!.id]
    );
    res.status(201).json({ success: true, data: rows[0] });
  } catch(e) { console.error(e); res.status(500).json({ success: false, message: 'Failed to create schedule' }); }
});

r.get('/schedule', async (req: AuthRequest, res: Response) => {
  const { elderUserId } = req.query;
  try {
    const { rows } = await pool.query(
      `SELECT cs.*, u.name as elder_name, c.name as caregiver_name
       FROM care_schedules cs
       LEFT JOIN users u ON u.id = cs.elder_user_id
       LEFT JOIN users c ON c.id = cs.caregiver_user_id
       WHERE cs.elder_user_id = $1 OR cs.caregiver_user_id = $1
       ORDER BY cs.scheduled_at ASC`,
      [elderUserId || req.user!.id]
    );
    res.json({ success: true, data: rows });
  } catch(e) { res.status(500).json({ success: false, message: 'Failed' }); }
});

// ─── MEDICATIONS ─────────────────────────────────────────────────────────────

r.post('/medications', async (req: AuthRequest, res: Response) => {
  const { elderUserId, name, dosage, frequency, times, notes, startDate, endDate } = req.body;
  if (!elderUserId || !name || !dosage || !frequency) {
    res.status(400).json({ success: false, message: 'elderUserId, name, dosage, and frequency required' });
    return;
  }
  try {
    const { rows } = await pool.query(
      `INSERT INTO medications (elder_user_id, name, dosage, frequency, times, notes, start_date, end_date, created_by)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING *`,
      [elderUserId, name, dosage, frequency, times || [], notes || null, startDate || null, endDate || null, req.user!.id]
    );
    res.status(201).json({ success: true, data: rows[0] });
  } catch(e) { console.error(e); res.status(500).json({ success: false, message: 'Failed to add medication' }); }
});

r.get('/medications', async (req: AuthRequest, res: Response) => {
  const { elderUserId } = req.query;
  try {
    const { rows } = await pool.query(
      `SELECT m.*, u.name as elder_name
       FROM medications m
       LEFT JOIN users u ON u.id = m.elder_user_id
       WHERE m.elder_user_id = $1 AND m.is_active = true
       ORDER BY m.name ASC`,
      [elderUserId || req.user!.id]
    );
    res.json({ success: true, data: rows });
  } catch(e) { res.status(500).json({ success: false, message: 'Failed' }); }
});

// ─── FALL DETECTION ──────────────────────────────────────────────────────────

r.post('/fall-detected', async (req: AuthRequest, res: Response) => {
  const { lat, lng, confidence, deviceData } = req.body;
  try {
    // Insert as SOS event with fall source
    const { rows } = await pool.query(
      `INSERT INTO sos_events (user_id, lat, lng, source, trigger_method, source_app, message)
       VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
      [req.user!.id, lat || null, lng || null, 'fall_detection', 'accelerometer', 'ouma_en_oppas',
       `Val bespeur — vertroue: ${confidence || 'onbekend'}%`]
    );
    const sos = rows[0];

    // Log fall event separately
    await pool.query(
      `INSERT INTO fall_events (user_id, sos_event_id, lat, lng, confidence, device_data)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [req.user!.id, sos.id, lat || null, lng || null, confidence || null, JSON.stringify(deviceData || {})]
    );

    res.status(201).json({ success: true, data: sos, message: 'Val-alarm gestuur na bewakers' });
  } catch(e) { console.error(e); res.status(500).json({ success: false, message: 'Failed' }); }
});

// ─── DAILY CHECK-IN ──────────────────────────────────────────────────────────

r.get('/daily-checkin', async (req: AuthRequest, res: Response) => {
  try {
    const { rows } = await pool.query(
      `SELECT * FROM daily_checkins WHERE user_id = $1 AND DATE(created_at) = CURRENT_DATE`,
      [req.user!.id]
    );
    const checkedIn = rows.length > 0;
    res.json({ success: true, data: { checkedIn, lastCheckin: rows[0] || null } });
  } catch(e) { res.status(500).json({ success: false, message: 'Failed' }); }
});

r.post('/daily-checkin', async (req: AuthRequest, res: Response) => {
  const { mood, notes } = req.body;
  try {
    const { rows } = await pool.query(
      `INSERT INTO daily_checkins (user_id, mood, notes) VALUES ($1, $2, $3)
       ON CONFLICT (user_id, DATE(created_at)) DO UPDATE SET mood=$2, notes=$3, updated_at=NOW()
       RETURNING *`,
      [req.user!.id, mood || 'good', notes || null]
    );
    res.json({ success: true, data: rows[0] });
  } catch(e) { res.status(500).json({ success: false, message: 'Failed' }); }
});

export default r;
