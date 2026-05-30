import { Router, Response } from 'express';
import { pool } from '../db/pool';
import { authenticate, AuthRequest } from '../middleware/auth';

const router = Router();
router.use(authenticate);

const SUPER_ADMIN_EMAIL = 'stephan@vcds.co.za';

function requireSuperAdmin(req: AuthRequest, res: Response, next: Function) {
  if (req.user?.email !== SUPER_ADMIN_EMAIL && req.user?.role !== 'superadmin') {
    return res.status(403).json({ error: 'Super admin access required' });
  }
  next();
}

function requireAdmin(req: AuthRequest, res: Response, next: Function) {
  const allowed = ['admin', 'superadmin', 'hoa'];
  if (!allowed.includes(req.user?.role || '') && req.user?.email !== SUPER_ADMIN_EMAIL) {
    return res.status(403).json({ error: 'Admin access required' });
  }
  next();
}

// GET /api/admin/stats
router.get('/stats', requireAdmin, async (req: AuthRequest, res: Response) => {
  try {
    const [users, incidents, sos, subs, revenue, newToday, activePatrols, lprScans] = await Promise.all([
      pool.query('SELECT COUNT(*) FROM users WHERE is_active = true'),
      pool.query("SELECT COUNT(*) FROM incidents WHERE status = 'open'"),
      pool.query("SELECT COUNT(*) FROM sos_events WHERE status = 'active'"),
      pool.query("SELECT COUNT(*) FROM subscriptions WHERE status = 'active'"),
      pool.query("SELECT COALESCE(SUM(amount), 0) as total FROM payments WHERE status = 'completed' AND created_at > NOW() - INTERVAL '30 days'"),
      pool.query("SELECT COUNT(*) FROM users WHERE created_at > NOW() - INTERVAL '24 hours'"),
      pool.query("SELECT COUNT(*) FROM patrols WHERE status = 'active'"),
      pool.query("SELECT COUNT(*) FROM lpr_scans WHERE timestamp > NOW() - INTERVAL '24 hours'"),
    ]);
    res.json({
      success: true,
      data: {
        totalUsers: parseInt(users.rows[0].count),
        openIncidents: parseInt(incidents.rows[0].count),
        activeSOS: parseInt(sos.rows[0].count),
        paidSubscribers: parseInt(subs.rows[0].count),
        totalRevenue: parseFloat(revenue.rows[0].total),
        newUsersToday: parseInt(newToday.rows[0].count),
        activePatrols: parseInt(activePatrols.rows[0].count),
        lprScansToday: parseInt(lprScans.rows[0].count),
      }
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch stats' });
  }
});

// GET /api/admin/users
router.get('/users', requireAdmin, async (req: AuthRequest, res: Response) => {
  const limit = parseInt(req.query.limit as string) || 100;
  const offset = parseInt(req.query.offset as string) || 0;
  const search = req.query.search as string || '';
  try {
    const { rows } = await pool.query(`
      SELECT u.id, u.name, u.email, u.role, u.is_active, u.created_at,
             t.name as town_name,
             s.tier as subscription_tier, s.status as subscription_status
      FROM users u
      LEFT JOIN towns t ON t.id = u.town_id
      LEFT JOIN subscriptions s ON s.user_id = u.id AND s.status = 'active'
      WHERE ($3 = '' OR u.name ILIKE $3 OR u.email ILIKE $3)
      ORDER BY u.created_at DESC
      LIMIT $1 OFFSET $2
    `, [limit, offset, search ? `%${search}%` : '']);
    const { rows: countRows } = await pool.query(
      `SELECT COUNT(*) FROM users WHERE ($1 = '' OR name ILIKE $1 OR email ILIKE $1)`,
      [search ? `%${search}%` : '']
    );
    res.json({ success: true, data: rows, total: parseInt(countRows[0].count) });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch users' });
  }
});

// PUT /api/admin/users/:id/role
router.put('/users/:id/role', requireAdmin, async (req: AuthRequest, res: Response) => {
  const { role } = req.body;
  const validRoles = ['resident', 'hoa', 'admin', 'superadmin'];
  if (!validRoles.includes(role)) return res.status(400).json({ error: 'Invalid role' });
  // Only superadmin can assign superadmin
  if (role === 'superadmin' && req.user?.email !== SUPER_ADMIN_EMAIL) {
    return res.status(403).json({ error: 'Only super admin can assign superadmin role' });
  }
  try {
    await pool.query('UPDATE users SET role = $1 WHERE id = $2', [role, req.params.id]);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Failed to update role' });
  }
});

// PUT /api/admin/users/:id/ban
router.put('/users/:id/ban', requireAdmin, async (req: AuthRequest, res: Response) => {
  try {
    await pool.query('UPDATE users SET is_active = false WHERE id = $1', [req.params.id]);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Failed to ban user' });
  }
});

// PUT /api/admin/users/:id/unban
router.put('/users/:id/unban', requireAdmin, async (req: AuthRequest, res: Response) => {
  try {
    await pool.query('UPDATE users SET is_active = true WHERE id = $1', [req.params.id]);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Failed to unban user' });
  }
});

// GET /api/admin/incidents — all incidents
router.get('/incidents', requireAdmin, async (req: AuthRequest, res: Response) => {
  try {
    const { rows } = await pool.query(`
      SELECT i.*, u.name as reporter_name, u.email as reporter_email
      FROM incidents i
      LEFT JOIN users u ON u.id = i.user_id
      ORDER BY i.created_at DESC
      LIMIT 200
    `);
    res.json({ success: true, data: rows });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch incidents' });
  }
});

// GET /api/admin/sos — all SOS events
router.get('/sos', requireAdmin, async (req: AuthRequest, res: Response) => {
  try {
    const { rows } = await pool.query(`
      SELECT s.*, u.name as user_name, u.email, u.phone
      FROM sos_events s
      LEFT JOIN users u ON u.id = s.user_id
      ORDER BY s.created_at DESC
      LIMIT 100
    `);
    res.json({ success: true, data: rows });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch SOS events' });
  }
});

// GET /api/admin/hoa — HOA members
router.get('/hoa', requireAdmin, async (req: AuthRequest, res: Response) => {
  try {
    const { rows } = await pool.query(`
      SELECT u.id, u.name, u.email, u.phone, u.role, u.created_at, t.name as town_name
      FROM users u
      LEFT JOIN towns t ON t.id = u.town_id
      WHERE u.role IN ('hoa', 'admin', 'superadmin')
      ORDER BY u.role, u.name
    `);
    res.json({ success: true, data: rows });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch HOA members' });
  }
});

// POST /api/admin/broadcast — send broadcast notification
router.post('/broadcast', requireAdmin, async (req: AuthRequest, res: Response) => {
  const { title, body, townId, targetRole } = req.body;
  if (!title || !body) return res.status(400).json({ error: 'title and body required' });
  try {
    let query = 'SELECT token FROM push_tokens pt JOIN users u ON u.id = pt.user_id WHERE u.is_active = true';
    const params: any[] = [];
    if (townId) { query += ` AND u.town_id = $${params.length + 1}`; params.push(townId); }
    if (targetRole) { query += ` AND u.role = $${params.length + 1}`; params.push(targetRole); }

    const { rows } = await pool.query(query, params);
    const tokens = rows.map((r: any) => r.token);

    // Log broadcast
    await pool.query(
      `INSERT INTO notification_log(user_id, title, body, type, target_app, status)
       VALUES($1, $2, $3, 'broadcast', 'dorpwag', 'sent')`,
      [req.user!.id, title, body]
    );

    res.json({ success: true, recipientCount: tokens.length });
  } catch (err) {
    res.status(500).json({ error: 'Failed to send broadcast' });
  }
});

// GET /api/admin/system — system health
router.get('/system', requireSuperAdmin, async (req: AuthRequest, res: Response) => {
  try {
    const [dbCheck, guardianSessions, deadmanActive] = await Promise.all([
      pool.query('SELECT NOW() as db_time'),
      pool.query('SELECT COUNT(*) FROM guardian_sessions WHERE is_active = true'),
      pool.query("SELECT COUNT(*) FROM guardian_sessions WHERE is_active = true AND last_ping_at < NOW() - INTERVAL '30 minutes'"),
    ]);
    res.json({
      success: true,
      data: {
        dbStatus: 'healthy',
        dbTime: dbCheck.rows[0].db_time,
        activeGuardianSessions: parseInt(guardianSessions.rows[0].count),
        overdueDeadmanSessions: parseInt(deadmanActive.rows[0].count),
        serverTime: new Date().toISOString(),
        environment: process.env.NODE_ENV || 'production',
      }
    });
  } catch (err) {
    res.status(500).json({ error: 'System check failed' });
  }
});

export default router;
