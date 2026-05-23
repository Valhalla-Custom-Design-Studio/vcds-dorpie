import { Router, Response } from 'express';
import { pool } from '../db/pool';
import { authenticate, AuthRequest } from '../middleware/auth';
const r = Router();

r.get('/:id', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const { rows } = await pool.query('SELECT * FROM files WHERE id=$1', [req.params.id]);
    if (!rows.length) { res.status(404).json({ success: false, message: 'Not found' }); return; }
    const file = rows[0];
    if (!file.is_public && file.user_id !== req.user!.id) { res.status(403).json({ success: false, message: 'Forbidden' }); return; }
    res.json({ success: true, data: file });
  } catch { res.status(500).json({ success: false, message: 'Failed' }); }
});

r.delete('/:id', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    await pool.query('DELETE FROM files WHERE id=$1 AND user_id=$2', [req.params.id, req.user!.id]);
    res.json({ success: true });
  } catch { res.status(500).json({ success: false, message: 'Failed' }); }
});

export default r;
