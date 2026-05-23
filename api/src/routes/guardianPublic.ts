import { Router, Request, Response } from 'express';
import { pool } from '../db/pool';
const r = Router();
r.get('/ping/:sessionId', async (req: Request, res: Response) => {
  try {
    const { rows } = await pool.query('SELECT is_active,last_ping_at FROM guardian_sessions WHERE id=$1', [req.params.sessionId]);
    res.json({ success: true, data: rows[0] || null });
  } catch { res.status(500).json({ success: false, message: 'Failed' }); }
});
export default r;
