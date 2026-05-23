import { Router, Request, Response } from 'express';
import { pool } from '../db/pool';
const r = Router();
r.get('/', async (_req: Request, res: Response) => {
  try {
    const { rows } = await pool.query('SELECT id,name,province FROM towns ORDER BY province,name');
    res.json({ success: true, data: rows });
  } catch { res.status(500).json({ success: false, message: 'Failed' }); }
});
export default r;
