import { Router, Response } from 'express';
import { pool } from '../db/pool';
import { authenticate, AuthRequest } from '../middleware/auth';
const r = Router();

r.post('/', authenticate, async (req: AuthRequest, res: Response) => {
  const { token, deviceType } = req.body;
  if (!token) { res.status(400).json({ success: false, message: 'Token required' }); return; }
  try {
    await pool.query(
      'INSERT INTO push_tokens(user_id,token,device_type) VALUES($1,$2,$3) ON CONFLICT(token) DO UPDATE SET user_id=$1,device_type=$3',
      [req.user!.id, token, deviceType]
    );
    res.json({ success: true });
  } catch { res.status(500).json({ success: false, message: 'Failed' }); }
});

r.delete('/', authenticate, async (req: AuthRequest, res: Response) => {
  const { token } = req.body;
  try {
    await pool.query('DELETE FROM push_tokens WHERE user_id=$1 AND token=$2', [req.user!.id, token]);
    res.json({ success: true });
  } catch { res.status(500).json({ success: false, message: 'Failed' }); }
});

export default r;
