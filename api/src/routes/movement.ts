import { Router, Response } from 'express';
import { pool } from '../db/pool';
import { authenticate, AuthRequest } from '../middleware/auth';
const r = Router();
r.use(authenticate);

r.post('/checkin', async (req: AuthRequest, res: Response) => {
  const { lat, lng, note, isSafe = true } = req.body;
  try {
    const { rows } = await pool.query(
      'INSERT INTO movement_checkins(user_id,lat,lng,note,is_safe) VALUES($1,$2,$3,$4,$5) RETURNING *',
      [req.user!.id, lat, lng, note, isSafe]
    );
    res.status(201).json({ success: true, data: rows[0] });
  } catch { res.status(500).json({ success: false, message: 'Failed' }); }
});

r.get('/history', async (req: AuthRequest, res: Response) => {
  try {
    const { rows } = await pool.query(
      'SELECT * FROM movement_checkins WHERE user_id=$1 ORDER BY created_at DESC LIMIT 50',
      [req.user!.id]
    );
    res.json({ success: true, data: rows });
  } catch { res.status(500).json({ success: false, message: 'Failed' }); }
});

export default r;
