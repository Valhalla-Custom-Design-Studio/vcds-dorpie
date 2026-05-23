import { Router, Request, Response } from 'express';
import { pool } from '../db/pool';
import { authenticate, AuthRequest } from '../middleware/auth';
const r = Router();

r.get('/', async (_req: Request, res: Response) => {
  try {
    const { rows } = await pool.query('SELECT id,name,province,lat,lng FROM towns ORDER BY province,name');
    res.json({ success: true, data: rows });
  } catch { res.status(500).json({ success: false, message: 'Failed' }); }
});

r.get('/provinces', async (_req: Request, res: Response) => {
  try {
    const { rows } = await pool.query('SELECT DISTINCT province FROM towns ORDER BY province');
    res.json({ success: true, data: rows.map((r: any) => r.province) });
  } catch { res.status(500).json({ success: false, message: 'Failed' }); }
});

r.get('/:id', async (req: Request, res: Response) => {
  try {
    const { rows } = await pool.query('SELECT * FROM towns WHERE id=$1', [req.params.id]);
    if (!rows.length) { res.status(404).json({ success: false, message: 'Not found' }); return; }
    res.json({ success: true, data: rows[0] });
  } catch { res.status(500).json({ success: false, message: 'Failed' }); }
});

r.get('/:id/stats', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const [users, incidents, businesses, events] = await Promise.all([
      pool.query('SELECT COUNT(*) FROM users WHERE town_id=$1', [req.params.id]),
      pool.query("SELECT COUNT(*) FROM incidents WHERE town_id=$1 AND status='open'", [req.params.id]),
      pool.query('SELECT COUNT(*) FROM businesses WHERE town_id=$1 AND is_active=true', [req.params.id]),
      pool.query('SELECT COUNT(*) FROM events WHERE town_id=$1 AND start_at >= NOW()', [req.params.id]),
    ]);
    res.json({ success: true, data: {
      residents: Number(users.rows[0].count),
      openIncidents: Number(incidents.rows[0].count),
      businesses: Number(businesses.rows[0].count),
      upcomingEvents: Number(events.rows[0].count),
    }});
  } catch { res.status(500).json({ success: false, message: 'Failed' }); }
});

export default r;
