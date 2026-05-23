import { Router, Response } from 'express';
import { pool } from '../db/pool';
import { authenticate, AuthRequest } from '../middleware/auth';
const r = Router();

r.post('/', authenticate, async (req: AuthRequest, res: Response) => {
  const { targetType, targetId, reason, body } = req.body;
  if (!targetType || !targetId || !reason) { res.status(400).json({ success: false, message: 'targetType, targetId and reason required' }); return; }
  try {
    const { rows } = await pool.query(
      'INSERT INTO reports(reporter_id,target_type,target_id,reason,body) VALUES($1,$2,$3,$4,$5) RETURNING *',
      [req.user!.id, targetType, targetId, reason, body]
    );
    res.status(201).json({ success: true, data: rows[0] });
  } catch { res.status(500).json({ success: false, message: 'Failed' }); }
});

export default r;
