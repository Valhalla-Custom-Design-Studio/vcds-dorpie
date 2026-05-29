import { Router, Response } from 'express';
import { pool } from '../db/pool';
import { authenticate, AuthRequest } from '../middleware/auth';
const r = Router();

r.get('/', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const u = await pool.query('SELECT town_id FROM users WHERE id=$1', [req.user!.id]);
    const { rows } = await pool.query(
      `SELECT p.*,u.name as leader_name,
       (SELECT COUNT(*) FROM patrol_members WHERE patrol_id=p.id) as member_count,
       EXISTS(SELECT 1 FROM patrol_members WHERE patrol_id=p.id AND user_id=$1) as is_member
       FROM patrols p JOIN users u ON u.id=p.leader_id
       WHERE p.town_id=$2 AND p.status='active' ORDER BY p.created_at DESC`,
      [req.user!.id, u.rows[0]?.town_id]
    );
    res.json({ success: true, data: rows });
  } catch(e) { console.error(e); res.status(500).json({ success: false, message: 'Failed' }); }
});

r.post('/', authenticate, async (req: AuthRequest, res: Response) => {
  const { name, description, schedule } = req.body;
  if (!name) { res.status(400).json({ success: false, message: 'Name required' }); return; }
  try {
    const u = await pool.query('SELECT town_id FROM users WHERE id=$1', [req.user!.id]);
    const { rows } = await pool.query(
      'INSERT INTO patrols(name,description,schedule,leader_id,town_id) VALUES($1,$2,$3,$4,$5) RETURNING *',
      [name, description, schedule, req.user!.id, u.rows[0].town_id]
    );
    await pool.query('INSERT INTO patrol_members(patrol_id,user_id,role) VALUES($1,$2,$3)', [rows[0].id, req.user!.id, 'leader']);
    res.status(201).json({ success: true, data: rows[0] });
  } catch { res.status(500).json({ success: false, message: 'Failed' }); }
});

r.post('/:id/join', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    await pool.query('INSERT INTO patrol_members(patrol_id,user_id) VALUES($1,$2) ON CONFLICT DO NOTHING', [req.params.id, req.user!.id]);
    res.json({ success: true });
  } catch { res.status(500).json({ success: false, message: 'Failed' }); }
});

r.delete('/:id/leave', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    await pool.query('DELETE FROM patrol_members WHERE patrol_id=$1 AND user_id=$2', [req.params.id, req.user!.id]);
    res.json({ success: true });
  } catch { res.status(500).json({ success: false, message: 'Failed' }); }
});

r.get('/:id/members', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const { rows } = await pool.query(
      `SELECT pm.*,u.name,u.phone,f.cloud_storage_path as avatar
       FROM patrol_members pm JOIN users u ON u.id=pm.user_id LEFT JOIN files f ON f.id=u.profile_photo_id
       WHERE pm.patrol_id=$1`,
      [req.params.id]
    );
    res.json({ success: true, data: rows });
  } catch { res.status(500).json({ success: false, message: 'Failed' }); }
});

export default r;
