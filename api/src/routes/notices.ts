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
    let q = `SELECT n.*,u.name as author_name,f.cloud_storage_path as author_avatar,
             (SELECT COUNT(*) FROM notice_reactions WHERE notice_id=n.id) as reaction_count,
             (SELECT COUNT(*) FROM notice_comments WHERE notice_id=n.id) as comment_count,
             EXISTS(SELECT 1 FROM notice_reactions WHERE notice_id=n.id AND user_id=$1) as user_reacted
             FROM notices n JOIN users u ON u.id=n.author_id LEFT JOIN files f ON f.id=u.profile_photo_id
             WHERE n.town_id=$2`;
    const params: any[] = [req.user!.id, townId];
    if (category) { q += ` AND n.category=$${params.length+1}`; params.push(category); }
    q += ` ORDER BY n.is_pinned DESC, n.created_at DESC LIMIT $${params.length+1} OFFSET $${params.length+2}`;
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
      'INSERT INTO notices(title,body,category,author_id,town_id) VALUES($1,$2,$3,$4,$5) RETURNING *',
      [title, body, category, req.user!.id, u.rows[0].town_id]
    );
    res.status(201).json({ success: true, data: rows[0] });
  } catch { res.status(500).json({ success: false, message: 'Failed' }); }
});

r.get('/:id', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    await pool.query('UPDATE notices SET view_count=view_count+1 WHERE id=$1', [req.params.id]);
    const { rows } = await pool.query(
      `SELECT n.*,u.name as author_name,f.cloud_storage_path as author_avatar,
       (SELECT COUNT(*) FROM notice_reactions WHERE notice_id=n.id) as reaction_count,
       (SELECT COUNT(*) FROM notice_comments WHERE notice_id=n.id) as comment_count,
       EXISTS(SELECT 1 FROM notice_reactions WHERE notice_id=n.id AND user_id=$2) as user_reacted
       FROM notices n JOIN users u ON u.id=n.author_id LEFT JOIN files f ON f.id=u.profile_photo_id
       WHERE n.id=$1`,
      [req.params.id, req.user!.id]
    );
    if (!rows.length) { res.status(404).json({ success: false, message: 'Not found' }); return; }
    res.json({ success: true, data: rows[0] });
  } catch { res.status(500).json({ success: false, message: 'Failed' }); }
});

r.put('/:id', authenticate, async (req: AuthRequest, res: Response) => {
  const { title, body, category } = req.body;
  try {
    const { rows } = await pool.query(
      'UPDATE notices SET title=COALESCE($1,title),body=COALESCE($2,body),category=COALESCE($3,category),updated_at=NOW() WHERE id=$4 AND author_id=$5 RETURNING *',
      [title, body, category, req.params.id, req.user!.id]
    );
    if (!rows.length) { res.status(404).json({ success: false, message: 'Not found or not authorized' }); return; }
    res.json({ success: true, data: rows[0] });
  } catch { res.status(500).json({ success: false, message: 'Failed' }); }
});

r.delete('/:id', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const { rows } = await pool.query('DELETE FROM notices WHERE id=$1 AND author_id=$2 RETURNING id', [req.params.id, req.user!.id]);
    if (!rows.length) { res.status(404).json({ success: false, message: 'Not found or not authorized' }); return; }
    res.json({ success: true });
  } catch { res.status(500).json({ success: false, message: 'Failed' }); }
});

r.post('/:id/react', authenticate, async (req: AuthRequest, res: Response) => {
  const { type = 'like' } = req.body;
  try {
    const ex = await pool.query('SELECT id FROM notice_reactions WHERE notice_id=$1 AND user_id=$2', [req.params.id, req.user!.id]);
    if (ex.rows.length) {
      await pool.query('DELETE FROM notice_reactions WHERE notice_id=$1 AND user_id=$2', [req.params.id, req.user!.id]);
      res.json({ success: true, reacted: false });
    } else {
      await pool.query('INSERT INTO notice_reactions(notice_id,user_id,type) VALUES($1,$2,$3)', [req.params.id, req.user!.id, type]);
      res.json({ success: true, reacted: true });
    }
  } catch { res.status(500).json({ success: false, message: 'Failed' }); }
});

r.get('/:id/comments', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const { rows } = await pool.query(
      `SELECT nc.*,u.name as author_name,f.cloud_storage_path as author_avatar
       FROM notice_comments nc JOIN users u ON u.id=nc.author_id LEFT JOIN files f ON f.id=u.profile_photo_id
       WHERE nc.notice_id=$1 ORDER BY nc.created_at ASC`,
      [req.params.id]
    );
    res.json({ success: true, data: rows });
  } catch { res.status(500).json({ success: false, message: 'Failed' }); }
});

r.post('/:id/comments', authenticate, async (req: AuthRequest, res: Response) => {
  const { body } = req.body;
  if (!body) { res.status(400).json({ success: false, message: 'Body required' }); return; }
  try {
    const { rows } = await pool.query(
      'INSERT INTO notice_comments(notice_id,author_id,body) VALUES($1,$2,$3) RETURNING *',
      [req.params.id, req.user!.id, body]
    );
    res.status(201).json({ success: true, data: rows[0] });
  } catch { res.status(500).json({ success: false, message: 'Failed' }); }
});

export default r;
