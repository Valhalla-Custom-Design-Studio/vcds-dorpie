import { Router, Request, Response } from 'express';
import { pool } from '../db/pool';

export const areasRouter = Router();

areasRouter.get('/', async (_req: Request, res: Response) => {
  try {
    const result = await pool.query(
      `SELECT a.*, 
        COUNT(DISTINCT i.id) FILTER (WHERE i.status='active') AS active_incidents,
        COUNT(DISTINCT p.id) FILTER (WHERE p.status='active') AS active_patrols
       FROM areas a
       LEFT JOIN incidents i ON i.area_id = a.id
       LEFT JOIN patrols p ON p.area_id = a.id
       GROUP BY a.id ORDER BY a.name`
    );
    res.json({ success: true, areas: result.rows });
  } catch { res.status(500).json({ success: false, message: 'Failed' }); }
});
