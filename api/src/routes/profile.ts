import { Router, Response } from 'express';
import { pool } from '../db/pool';
import { authenticate, AuthRequest } from '../middleware/auth';
const r = Router();

r.get('/', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const { rows } = await pool.query(
      `SELECT u.id,u.email,u.name,u.phone,u.role,u.subscription_tier,u.subscription_expires_at,
              u.town_id,t.name as town_name,f.cloud_storage_path as avatar_url,u.created_at,u.last_seen_at
       FROM users u LEFT JOIN towns t ON t.id=u.town_id LEFT JOIN files f ON f.id=u.profile_photo_id
       WHERE u.id=$1`,
      [req.user!.id]
    );
    if (!rows.length) { res.status(404).json({ success: false, message: 'Not found' }); return; }
    res.json({ success: true, data: rows[0] });
  } catch { res.status(500).json({ success: false, message: 'Failed' }); }
});

r.put('/', authenticate, async (req: AuthRequest, res: Response) => {
  const { name, phone, townId } = req.body;
  try {
    const { rows } = await pool.query(
      'UPDATE users SET name=COALESCE($1,name),phone=COALESCE($2,phone),town_id=COALESCE($3,town_id),updated_at=NOW() WHERE id=$4 RETURNING id,name,phone,town_id',
      [name, phone, townId, req.user!.id]
    );
    res.json({ success: true, data: rows[0] });
  } catch { res.status(500).json({ success: false, message: 'Failed' }); }
});

r.get('/notifications', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const { rows } = await pool.query(
      'SELECT * FROM notification_preferences WHERE user_id=$1',
      [req.user!.id]
    );
    if (!rows.length) {
      await pool.query('INSERT INTO notification_preferences(user_id) VALUES($1)', [req.user!.id]);
      const { rows: newRows } = await pool.query('SELECT * FROM notification_preferences WHERE user_id=$1', [req.user!.id]);
      res.json({ success: true, data: newRows[0] });
    } else {
      res.json({ success: true, data: rows[0] });
    }
  } catch { res.status(500).json({ success: false, message: 'Failed' }); }
});

r.put('/notifications', authenticate, async (req: AuthRequest, res: Response) => {
  const { notices, emergencies, events, messages, sos_alerts, patrol_updates } = req.body;
  try {
    const { rows } = await pool.query(
      `INSERT INTO notification_preferences(user_id,notices,emergencies,events,messages,sos_alerts,patrol_updates)
       VALUES($1,$2,$3,$4,$5,$6,$7)
       ON CONFLICT(user_id) DO UPDATE SET
         notices=COALESCE($2,notification_preferences.notices),
         emergencies=COALESCE($3,notification_preferences.emergencies),
         events=COALESCE($4,notification_preferences.events),
         messages=COALESCE($5,notification_preferences.messages),
         sos_alerts=COALESCE($6,notification_preferences.sos_alerts),
         patrol_updates=COALESCE($7,notification_preferences.patrol_updates),
         updated_at=NOW()
       RETURNING *`,
      [req.user!.id, notices, emergencies, events, messages, sos_alerts, patrol_updates]
    );
    res.json({ success: true, data: rows[0] });
  } catch { res.status(500).json({ success: false, message: 'Failed' }); }
});

r.get('/trusted-contacts', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const { rows } = await pool.query('SELECT * FROM sos_trusted_contacts WHERE user_id=$1 AND is_active=true ORDER BY created_at', [req.user!.id]);
    res.json({ success: true, data: rows });
  } catch { res.status(500).json({ success: false, message: 'Failed' }); }
});

r.post('/trusted-contacts', authenticate, async (req: AuthRequest, res: Response) => {
  const { name, phone, email } = req.body;
  if (!name || !phone) { res.status(400).json({ success: false, message: 'Name and phone required' }); return; }
  try {
    const { rows } = await pool.query(
      'INSERT INTO sos_trusted_contacts(user_id,name,phone,email) VALUES($1,$2,$3,$4) RETURNING *',
      [req.user!.id, name, phone, email]
    );
    res.status(201).json({ success: true, data: rows[0] });
  } catch { res.status(500).json({ success: false, message: 'Failed' }); }
});

r.delete('/trusted-contacts/:id', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    await pool.query('UPDATE sos_trusted_contacts SET is_active=false WHERE id=$1 AND user_id=$2', [req.params.id, req.user!.id]);
    res.json({ success: true });
  } catch { res.status(500).json({ success: false, message: 'Failed' }); }
});

export default r;
