import { Router, Response } from 'express';
import { pool } from '../db/pool';
import { authenticate, AuthRequest } from '../middleware/auth';
import { sendTownPush } from '../services/NotificationService';
const r = Router();

r.get('/', authenticate, async (req: AuthRequest, res: Response) => {
  const { page = 1, category, severity, status = 'open', limit = 20 } = req.query;
  const offset = (Number(page) - 1) * Number(limit);
  try {
    const u = await pool.query('SELECT town_id FROM users WHERE id=$1', [req.user!.id]);
    const townId = u.rows[0]?.town_id;
    let q = `SELECT i.*,u.name as reporter_name,
             ARRAY(SELECT fi.cloud_storage_path FROM incident_media im JOIN files fi ON fi.id=im.file_id WHERE im.incident_id=i.id) as media
             FROM incidents i JOIN users u ON u.id=i.reporter_id
             WHERE i.town_id=$1`;
    const params: any[] = [townId];
    if (status !== 'all') { q += ` AND i.status=$${params.length+1}`; params.push(status); }
    if (category) { q += ` AND i.category=$${params.length+1}`; params.push(category); }
    if (severity) { q += ` AND i.severity=$${params.length+1}`; params.push(severity); }
    q += ` ORDER BY i.created_at DESC LIMIT $${params.length+1} OFFSET $${params.length+2}`;
    params.push(Number(limit), offset);
    const { rows } = await pool.query(q, params);
    res.json({ success: true, data: rows });
  } catch(e) { console.error(e); res.status(500).json({ success: false, message: 'Failed' }); }
});

r.post('/', authenticate, async (req: AuthRequest, res: Response) => {
  const { title, description, category = 'Other', severity = 'medium', lat, lng } = req.body;
  if (!title) { res.status(400).json({ success: false, message: 'Title required' }); return; }
  try {
    const u = await pool.query('SELECT town_id FROM users WHERE id=$1', [req.user!.id]);
    const townId = u.rows[0]?.town_id;
    const { rows } = await pool.query(
      'INSERT INTO incidents(title,description,category,severity,reporter_id,town_id,lat,lng) VALUES($1,$2,$3,$4,$5,$6,$7,$8) RETURNING *',
      [title, description, category, severity, req.user!.id, townId, lat, lng]
    );
    if (severity === 'high' || severity === 'critical') {
      await sendTownPush(pool, townId, '⚠️ Nuwe Voorval', `${title} — ${category}`, { incidentId: rows[0].id }, 'dorpie-safety');
    }
    res.status(201).json({ success: true, data: rows[0] });
  } catch { res.status(500).json({ success: false, message: 'Failed' }); }
});

r.get('/:id', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const { rows } = await pool.query(
      `SELECT i.*,u.name as reporter_name,
       ARRAY(SELECT fi.cloud_storage_path FROM incident_media im JOIN files fi ON fi.id=im.file_id WHERE im.incident_id=i.id) as media
       FROM incidents i JOIN users u ON u.id=i.reporter_id WHERE i.id=$1`,
      [req.params.id]
    );
    if (!rows.length) { res.status(404).json({ success: false, message: 'Not found' }); return; }
    res.json({ success: true, data: rows[0] });
  } catch { res.status(500).json({ success: false, message: 'Failed' }); }
});

r.put('/:id/resolve', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    await pool.query('UPDATE incidents SET status=$1,resolved_at=NOW(),updated_at=NOW() WHERE id=$2', ['resolved', req.params.id]);
    res.json({ success: true });
  } catch { res.status(500).json({ success: false, message: 'Failed' }); }
});

export default r;
