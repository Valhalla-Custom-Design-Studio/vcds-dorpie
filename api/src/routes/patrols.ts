import { Router, Request, Response } from 'express';
import { pool } from '../db/pool';
import { authenticate, AuthRequest } from '../middleware/auth';
import Joi from 'joi';

export const patrolsRouter = Router();

// Get active patrols (public)
patrolsRouter.get('/', async (_req: Request, res: Response) => {
  try {
    const result = await pool.query(
      `SELECT p.*, a.name as area_name, a.name_af as area_name_af,
        u.first_name || ' ' || u.last_name AS leader_name
       FROM patrols p
       LEFT JOIN areas a ON p.area_id = a.id
       JOIN users u ON p.leader_id = u.id
       WHERE p.status = 'active'
       ORDER BY p.start_time DESC`
    );
    res.json({ success: true, patrols: result.rows });
  } catch { res.status(500).json({ success: false, message: 'Failed' }); }
});

// Start patrol
patrolsRouter.post('/', authenticate, async (req: AuthRequest, res: Response) => {
  const schema = Joi.object({ areaId: Joi.string().uuid().optional(), name: Joi.string().max(100).optional() });
  const { error, value } = schema.validate(req.body);
  if (error) { res.status(400).json({ success: false, message: error.details[0].message }); return; }
  try {
    const result = await pool.query(
      'INSERT INTO patrols (leader_id, area_id, name) VALUES ($1,$2,$3) RETURNING *',
      [req.user!.id, value.areaId, value.name || 'Community Patrol']
    );
    await pool.query('INSERT INTO patrol_members (patrol_id, user_id) VALUES ($1,$2)', [result.rows[0].id, req.user!.id]);
    res.status(201).json({ success: true, patrol: result.rows[0] });
  } catch { res.status(500).json({ success: false, message: 'Failed to start patrol' }); }
});

// Join patrol
patrolsRouter.post('/:id/join', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    await pool.query('INSERT INTO patrol_members (patrol_id, user_id) VALUES ($1,$2) ON CONFLICT DO NOTHING', [req.params.id, req.user!.id]);
    await pool.query('UPDATE patrols SET member_count = (SELECT COUNT(*) FROM patrol_members WHERE patrol_id=$1) WHERE id=$1', [req.params.id]);
    res.json({ success: true, message: 'Joined patrol' });
  } catch { res.status(500).json({ success: false, message: 'Join failed' }); }
});

// End patrol
patrolsRouter.patch('/:id/end', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const result = await pool.query(
      "UPDATE patrols SET status='ended', end_time=NOW() WHERE id=$1 AND leader_id=$2 RETURNING *",
      [req.params.id, req.user!.id]
    );
    if (!result.rows.length) { res.status(404).json({ success: false, message: 'Not found' }); return; }
    res.json({ success: true, patrol: result.rows[0] });
  } catch { res.status(500).json({ success: false, message: 'Failed' }); }
});
