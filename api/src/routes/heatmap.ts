import { Router, Response } from 'express';
import { pool } from '../db/pool';
import { authenticate, AuthRequest } from '../middleware/auth';
const r = Router();

r.get('/', authenticate, async (req: AuthRequest, res: Response) => {
  const { days = 30, category } = req.query;
  try {
    const u = await pool.query('SELECT town_id FROM users WHERE id=$1', [req.user!.id]);
    const townId = u.rows[0]?.town_id;
    let q = `SELECT lat,lng,intensity,category FROM heatmap_points WHERE town_id=$1 AND created_at > NOW()-INTERVAL '${Number(days)} days'`;
    const params: any[] = [townId];
    if (category) { q += ` AND category=$${params.length+1}`; params.push(category); }
    q += ' ORDER BY created_at DESC LIMIT 500';
    const { rows } = await pool.query(q, params);
    res.json({ success: true, data: rows });
  } catch(e) { console.error(e); res.status(500).json({ success: false, message: 'Failed' }); }
});

export default r;
