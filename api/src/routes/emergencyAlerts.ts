import { Router, Response } from 'express';
import { pool } from '../db/pool';
import { authenticate, requireAdmin, AuthRequest } from '../middleware/auth';
import { sendTownPush } from '../services/NotificationService';
const r = Router();

r.get('/', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const u = await pool.query('SELECT town_id FROM users WHERE id=$1', [req.user!.id]);
    const { rows } = await pool.query(
      `SELECT ea.*,u.name as author_name FROM emergency_alerts ea JOIN users u ON u.id=ea.author_id
       WHERE ea.town_id=$1 AND ea.is_active=true AND (ea.expires_at IS NULL OR ea.expires_at > NOW())
       ORDER BY ea.created_at DESC LIMIT 20`,
      [u.rows[0]?.town_id]
    );
    res.json({ success: true, data: rows });
  } catch(e) { console.error(e); res.status(500).json({ success: false, message: 'Failed' }); }
});

r.post('/', authenticate, async (req: AuthRequest, res: Response) => {
  const { title, body, severity = 'high', category = 'General', lat, lng, expiresAt } = req.body;
  if (!title || !body) { res.status(400).json({ success: false, message: 'Title and body required' }); return; }
  try {
    const u = await pool.query('SELECT town_id,role FROM users WHERE id=$1', [req.user!.id]);
    const { town_id: townId, role } = u.rows[0];
    if (role !== 'admin') { res.status(403).json({ success: false, message: 'Admin access required' }); return; }
    const { rows } = await pool.query(
      'INSERT INTO emergency_alerts(title,body,severity,category,author_id,town_id,lat,lng,expires_at) VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9) RETURNING *',
      [title, body, severity, category, req.user!.id, townId, lat, lng, expiresAt]
    );
    await sendTownPush(pool, townId, `🚨 ${title}`, body, { alertId: rows[0].id }, 'dorpwag-emergency');
    res.status(201).json({ success: true, data: rows[0] });
  } catch { res.status(500).json({ success: false, message: 'Failed' }); }
});

r.delete('/:id', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    await pool.query('UPDATE emergency_alerts SET is_active=false WHERE id=$1', [req.params.id]);
    res.json({ success: true });
  } catch { res.status(500).json({ success: false, message: 'Failed' }); }
});

export default r;
