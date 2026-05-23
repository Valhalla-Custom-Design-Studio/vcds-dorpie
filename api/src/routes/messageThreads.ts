import { Router, Response } from 'express';
import { pool } from '../db/pool';
import { authenticate, AuthRequest } from '../middleware/auth';
const r = Router();

r.get('/', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const { rows } = await pool.query(
      `SELECT mt.*,
       CASE WHEN mt.participant_a=$1 THEN ub.name ELSE ua.name END as other_name,
       CASE WHEN mt.participant_a=$1 THEN fb.cloud_storage_path ELSE fa.cloud_storage_path END as other_avatar,
       CASE WHEN mt.participant_a=$1 THEN mt.participant_b ELSE mt.participant_a END as other_id,
       (SELECT m.body FROM messages m WHERE m.thread_id=mt.id ORDER BY m.created_at DESC LIMIT 1) as last_message,
       (SELECT COUNT(*) FROM messages m WHERE m.thread_id=mt.id AND m.sender_id!=$1 AND m.is_read=false) as unread_count
       FROM message_threads mt
       JOIN users ua ON ua.id=mt.participant_a LEFT JOIN files fa ON fa.id=ua.profile_photo_id
       JOIN users ub ON ub.id=mt.participant_b LEFT JOIN files fb ON fb.id=ub.profile_photo_id
       WHERE mt.participant_a=$1 OR mt.participant_b=$1
       ORDER BY mt.last_message_at DESC`,
      [req.user!.id]
    );
    res.json({ success: true, data: rows });
  } catch(e) { console.error(e); res.status(500).json({ success: false, message: 'Failed' }); }
});

r.post('/start', authenticate, async (req: AuthRequest, res: Response) => {
  const { recipientId } = req.body;
  if (!recipientId) { res.status(400).json({ success: false, message: 'recipientId required' }); return; }
  try {
    const a = req.user!.id < recipientId ? req.user!.id : recipientId;
    const b = req.user!.id < recipientId ? recipientId : req.user!.id;
    const { rows } = await pool.query(
      'INSERT INTO message_threads(participant_a,participant_b) VALUES($1,$2) ON CONFLICT(participant_a,participant_b) DO UPDATE SET last_message_at=NOW() RETURNING *',
      [a, b]
    );
    res.json({ success: true, data: rows[0] });
  } catch { res.status(500).json({ success: false, message: 'Failed' }); }
});

r.get('/:threadId/messages', authenticate, async (req: AuthRequest, res: Response) => {
  const { page = 1, limit = 50 } = req.query;
  const offset = (Number(page) - 1) * Number(limit);
  try {
    await pool.query('UPDATE messages SET is_read=true WHERE thread_id=$1 AND sender_id!=$2', [req.params.threadId, req.user!.id]);
    const { rows } = await pool.query(
      `SELECT m.*,u.name as sender_name,f.cloud_storage_path as sender_avatar
       FROM messages m JOIN users u ON u.id=m.sender_id LEFT JOIN files f ON f.id=u.profile_photo_id
       WHERE m.thread_id=$1 ORDER BY m.created_at DESC LIMIT $2 OFFSET $3`,
      [req.params.threadId, Number(limit), offset]
    );
    res.json({ success: true, data: rows.reverse() });
  } catch { res.status(500).json({ success: false, message: 'Failed' }); }
});

r.post('/:threadId/messages', authenticate, async (req: AuthRequest, res: Response) => {
  const { body } = req.body;
  if (!body) { res.status(400).json({ success: false, message: 'Message body required' }); return; }
  try {
    const { rows } = await pool.query(
      'INSERT INTO messages(thread_id,sender_id,body) VALUES($1,$2,$3) RETURNING *',
      [req.params.threadId, req.user!.id, body]
    );
    await pool.query('UPDATE message_threads SET last_message_at=NOW() WHERE id=$1', [req.params.threadId]);
    res.status(201).json({ success: true, data: rows[0] });
  } catch { res.status(500).json({ success: false, message: 'Failed' }); }
});

export default r;
