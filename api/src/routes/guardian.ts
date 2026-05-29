import { Router, Response } from 'express';
import { pool } from '../db/pool';
import { authenticate, AuthRequest } from '../middleware/auth';
import { sendBulkSMS, sendExpoPush } from '../services/NotificationService';
const r = Router();
r.use(authenticate);

r.get('/contacts', async (req: AuthRequest, res: Response) => {
  try {
    const { rows } = await pool.query('SELECT * FROM guardian_contacts WHERE user_id=$1 ORDER BY is_primary DESC,created_at', [req.user!.id]);
    res.json({ success: true, data: rows });
  } catch { res.status(500).json({ success: false, message: 'Failed' }); }
});

r.post('/contacts', async (req: AuthRequest, res: Response) => {
  const { name, phone, pushToken, isPrimary = false } = req.body;
  if (!name) { res.status(400).json({ success: false, message: 'Name required' }); return; }
  try {
    const { rows } = await pool.query(
      'INSERT INTO guardian_contacts(user_id,name,phone,push_token,is_primary) VALUES($1,$2,$3,$4,$5) RETURNING *',
      [req.user!.id, name, phone, pushToken, isPrimary]
    );
    res.status(201).json({ success: true, data: rows[0] });
  } catch { res.status(500).json({ success: false, message: 'Failed' }); }
});

r.delete('/contacts/:id', async (req: AuthRequest, res: Response) => {
  try {
    await pool.query('DELETE FROM guardian_contacts WHERE id=$1 AND user_id=$2', [req.params.id, req.user!.id]);
    res.json({ success: true });
  } catch { res.status(500).json({ success: false, message: 'Failed' }); }
});

r.post('/session/start', async (req: AuthRequest, res: Response) => {
  try {
    await pool.query('UPDATE guardian_sessions SET is_active=false,ended_at=NOW() WHERE user_id=$1 AND is_active=true', [req.user!.id]);
    const { rows } = await pool.query(
      'INSERT INTO guardian_sessions(user_id) VALUES($1) RETURNING *',
      [req.user!.id]
    );
    res.status(201).json({ success: true, data: rows[0] });
  } catch { res.status(500).json({ success: false, message: 'Failed' }); }
});

r.post('/session/ping', async (req: AuthRequest, res: Response) => {
  try {
    await pool.query('UPDATE guardian_sessions SET last_ping_at=NOW() WHERE user_id=$1 AND is_active=true', [req.user!.id]);
    res.json({ success: true });
  } catch { res.status(500).json({ success: false, message: 'Failed' }); }
});

r.post('/session/end', async (req: AuthRequest, res: Response) => {
  try {
    await pool.query('UPDATE guardian_sessions SET is_active=false,ended_at=NOW() WHERE user_id=$1 AND is_active=true', [req.user!.id]);
    res.json({ success: true });
  } catch { res.status(500).json({ success: false, message: 'Failed' }); }
});

r.get('/session/status', async (req: AuthRequest, res: Response) => {
  try {
    const { rows } = await pool.query('SELECT * FROM guardian_sessions WHERE user_id=$1 AND is_active=true ORDER BY started_at DESC LIMIT 1', [req.user!.id]);
    res.json({ success: true, data: rows[0] || null });
  } catch { res.status(500).json({ success: false, message: 'Failed' }); }
});

export default r;
