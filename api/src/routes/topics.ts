import { Router, Response } from 'express';
import { pool } from '../db/pool';
import { authenticate, AuthRequest } from '../middleware/auth';
const r = Router();

r.get('/', authenticate, async (req: AuthRequest, res: Response) => {
  const { page = 1, category, limit = 20 } = req.query;
  const offset = (Number(page) - 1) * Number(limit);
  try {
    const u = await pool.query('SELECT town_id FROM users WHERE id=$1', [req.user!.id]);
    const townId = u.rows[0]?.town_id;
    let q = `SELECT t.*,u.name as author_name,f.cloud_storage_path as author_avatar,
             (SELECT COUNT(*) FROM topic_replies WHERE topic_id=t.id) as reply_count,
             (SELECT COUNT(*) FROM topic_reactions WHERE topic_id=t.id) as reaction_count,
             EXISTS(SELECT 1 FROM topic_reactions WHERE topic_id=t.id AND user_id=$1) as user_reacted
             FROM topics t JOIN users u ON u.id=t.author_id LEFT JOIN files f ON f.id=u.profile_photo_id
             WHERE t.town_id=$2`;
    const params: any[] = [req.user!.id, townId];
    if (category) { q += ` AND t.category=$${params.length+1}`; params.push(category); }
    q += ` ORDER BY t.is_pinned DESC, t.updated_at DESC LIMIT $${params.length+1} OFFSET $${params.length+2}`;
    params.push(Number(limit), offset);
    const { rows } = await pool.query(q, params);
    res.json({ success: true, data: rows });
  } catch(e) { console.error(e); res.status(500).json({ success: false, message: 'Failed' }); }
});

r.post('/', authenticate, async (req: AuthRequest, res: Response) => {
  const { title, body, category = 'General' } = req.body;
  if (!title || !body) { res.status(400).json({ success: false, message: 'Title and body required' }); return; }
  try {
    const u = await pool.query('SELECT town_id FROM users WHERE id=$1', [req.user!.id]);
    const { rows } = await pool.query(
      'INSERT INTO topics(title,body,category,author_id,town_id) VALUES($1,$2,$3,$4,$5) RETURNING *',
      [title, body, category, req.user!.id, u.rows[0].town_id]
    );
    res.status(201).json({ success: true, data: rows[0] });
  } catch { res.status(500).json({ success: false, message: 'Failed' }); }
});

r.get('/:id', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    await pool.query('UPDATE topics SET view_count=view_count+1 WHERE id=$1', [req.params.id]);
    const { rows } = await pool.query(
      `SELECT t.*,u.name as author_name,f.cloud_storage_path as author_avatar,
       (SELECT COUNT(*) FROM topic_replies WHERE topic_id=t.id) as reply_count,
       (SELECT COUNT(*) FROM topic_reactions WHERE topic_id=t.id) as reaction_count,
       EXISTS(SELECT 1 FROM topic_reactions WHERE topic_id=t.id AND user_id=$2) as user_reacted
       FROM topics t JOIN users u ON u.id=t.author_id LEFT JOIN files f ON f.id=u.profile_photo_id WHERE t.id=$1`,
      [req.params.id, req.user!.id]
    );
    if (!rows.length) { res.status(404).json({ success: false, message: 'Not found' }); return; }
    res.json({ success: true, data: rows[0] });
  } catch { res.status(500).json({ success: false, message: 'Failed' }); }
});

r.get('/:id/replies', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const { rows } = await pool.query(
      `SELECT tr.*,u.name as author_name,f.cloud_storage_path as author_avatar
       FROM topic_replies tr JOIN users u ON u.id=tr.author_id LEFT JOIN files f ON f.id=u.profile_photo_id
       WHERE tr.topic_id=$1 ORDER BY tr.created_at ASC`,
      [req.params.id]
    );
    res.json({ success: true, data: rows });
  } catch { res.status(500).json({ success: false, message: 'Failed' }); }
});

r.post('/:id/replies', authenticate, async (req: AuthRequest, res: Response) => {
  const { body } = req.body;
  if (!body) { res.status(400).json({ success: false, message: 'Body required' }); return; }
  try {
    const { rows } = await pool.query(
      'INSERT INTO topic_replies(topic_id,author_id,body) VALUES($1,$2,$3) RETURNING *',
      [req.params.id, req.user!.id, body]
    );
    await pool.query('UPDATE topics SET updated_at=NOW() WHERE id=$1', [req.params.id]);
    res.status(201).json({ success: true, data: rows[0] });
  } catch { res.status(500).json({ success: false, message: 'Failed' }); }
});

r.post('/:id/react', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const ex = await pool.query('SELECT id FROM topic_reactions WHERE topic_id=$1 AND user_id=$2', [req.params.id, req.user!.id]);
    if (ex.rows.length) {
      await pool.query('DELETE FROM topic_reactions WHERE topic_id=$1 AND user_id=$2', [req.params.id, req.user!.id]);
      res.json({ success: true, reacted: false });
    } else {
      await pool.query('INSERT INTO topic_reactions(topic_id,user_id) VALUES($1,$2)', [req.params.id, req.user!.id]);
      res.json({ success: true, reacted: true });
    }
  } catch { res.status(500).json({ success: false, message: 'Failed' }); }
});

export default r;
