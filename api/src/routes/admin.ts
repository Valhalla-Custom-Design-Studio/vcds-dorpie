import { Router, Response } from 'express';
import { pool } from '../db/pool';
import { authenticate, requireAdmin, AuthRequest } from '../middleware/auth';
const r = Router();
r.use(authenticate, requireAdmin);

r.get('/stats', async (req: AuthRequest, res: Response) => {
  try {
    const [users, incidents, sos, subs] = await Promise.all([
      pool.query('SELECT COUNT(*) FROM users'),
      pool.query("SELECT COUNT(*) FROM incidents WHERE status='open'"),
      pool.query("SELECT COUNT(*) FROM sos_events WHERE status='active'"),
      pool.query("SELECT COUNT(*) FROM users WHERE subscription_tier='paid'"),
    ]);
    res.json({ success: true, data: {
      totalUsers: Number(users.rows[0].count),
      openIncidents: Number(incidents.rows[0].count),
      activeSOS: Number(sos.rows[0].count),
      paidSubscribers: Number(subs.rows[0].count),
    }});
  } catch { res.status(500).json({ success: false, message: 'Failed' }); }
});

r.get('/users', async (req: AuthRequest, res: Response) => {
  const { page = 1, limit = 50 } = req.query;
  const offset = (Number(page) - 1) * Number(limit);
  try {
    const { rows } = await pool.query(
      `SELECT u.id,u.email,u.name,u.role,u.subscription_tier,u.is_active,u.created_at,t.name as town_name
       FROM users u LEFT JOIN towns t ON t.id=u.town_id ORDER BY u.created_at DESC LIMIT $1 OFFSET $2`,
      [Number(limit), offset]
    );
    res.json({ success: true, data: rows });
  } catch { res.status(500).json({ success: false, message: 'Failed' }); }
});

r.put('/users/:id/role', async (req: AuthRequest, res: Response) => {
  const { role } = req.body;
  try {
    await pool.query('UPDATE users SET role=$1 WHERE id=$2', [role, req.params.id]);
    res.json({ success: true });
  } catch { res.status(500).json({ success: false, message: 'Failed' }); }
});

r.put('/users/:id/ban', async (req: AuthRequest, res: Response) => {
  try {
    await pool.query('UPDATE users SET is_active=false WHERE id=$1', [req.params.id]);
    res.json({ success: true });
  } catch { res.status(500).json({ success: false, message: 'Failed' }); }
});

r.get('/reports', async (req: AuthRequest, res: Response) => {
  try {
    const { rows } = await pool.query(
      `SELECT rp.*,u.name as reporter_name FROM reports rp JOIN users u ON u.id=rp.reporter_id
       WHERE rp.status='pending' ORDER BY rp.created_at DESC LIMIT 50`
    );
    res.json({ success: true, data: rows });
  } catch { res.status(500).json({ success: false, message: 'Failed' }); }
});

export default r;
