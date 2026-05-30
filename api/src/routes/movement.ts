import { Router, Response } from 'express';
import { pool } from '../db/pool';
import { authenticate, AuthRequest } from '../middleware/auth';
import { MovementBrainService } from '../services/movement/MovementBrainService';

const r = Router();
r.use(authenticate);

r.post('/checkin', async (req: AuthRequest, res: Response) => {
  const { lat, lng, status = 'Safe', note } = req.body;
  try {
    const checkin = await MovementBrainService.recordCheckin(req.user!.id, lat, lng, status);
    const anomaly = await MovementBrainService.checkAnomaly(req.user!.id, status);
    res.status(201).json({ success: true, data: checkin, anomaly });
  } catch (e) {
    console.error(e);
    res.status(500).json({ success: false, message: 'Failed' });
  }
});

r.get('/history', async (req: AuthRequest, res: Response) => {
  try {
    const data = await MovementBrainService.getHistory(req.user!.id);
    res.json({ success: true, data });
  } catch { res.status(500).json({ success: false, message: 'Failed' }); }
});

r.get('/patterns', async (req: AuthRequest, res: Response) => {
  try {
    const data = await MovementBrainService.getPatterns(req.user!.id);
    res.json({ success: true, data });
  } catch { res.status(500).json({ success: false, message: 'Failed' }); }
});

r.get('/weekly-summary', async (req: AuthRequest, res: Response) => {
  try {
    const data = await MovementBrainService.getWeeklySummary(req.user!.id);
    res.json({ success: true, data });
  } catch { res.status(500).json({ success: false, message: 'Failed' }); }
});

// Dead man switch ping
r.post('/deadman', async (req: AuthRequest, res: Response) => {
  try {
    await pool.query(
      'UPDATE guardian_sessions SET last_ping_at = NOW(), escalation_level = 0 WHERE user_id = $1 AND is_active = true',
      [req.user!.id]
    );
    res.json({ success: true, message: 'Ping recorded — timer reset' });
  } catch { res.status(500).json({ success: false, message: 'Failed' }); }
});

// Get dead man status
r.get('/deadman/status', async (req: AuthRequest, res: Response) => {
  try {
    const { rows } = await pool.query(
      'SELECT * FROM guardian_sessions WHERE user_id = $1 AND is_active = true ORDER BY created_at DESC LIMIT 1',
      [req.user!.id]
    );
    res.json({ success: true, data: rows[0] || null });
  } catch { res.status(500).json({ success: false, message: 'Failed' }); }
});

// Start dead man session
r.post('/deadman/start', async (req: AuthRequest, res: Response) => {
  const { intervalMinutes = 30 } = req.body;
  try {
    // End any existing active sessions
    await pool.query(
      'UPDATE guardian_sessions SET is_active = false, ended_at = NOW() WHERE user_id = $1 AND is_active = true',
      [req.user!.id]
    );
    const { rows } = await pool.query(
      `INSERT INTO guardian_sessions(user_id, ping_interval_minutes, last_ping_at, escalation_level, escalation_count)
       VALUES($1, $2, NOW(), 0, 0) RETURNING *`,
      [req.user!.id, intervalMinutes]
    );
    res.status(201).json({ success: true, data: rows[0] });
  } catch { res.status(500).json({ success: false, message: 'Failed' }); }
});

// End dead man session
r.post('/deadman/end', async (req: AuthRequest, res: Response) => {
  try {
    await pool.query(
      'UPDATE guardian_sessions SET is_active = false, ended_at = NOW() WHERE user_id = $1 AND is_active = true',
      [req.user!.id]
    );
    res.json({ success: true });
  } catch { res.status(500).json({ success: false, message: 'Failed' }); }
});

export default r;
