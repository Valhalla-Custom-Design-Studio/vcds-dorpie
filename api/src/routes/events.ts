import { Router, Response } from 'express';
import { pool } from '../db/pool';
import { authenticate, AuthRequest } from '../middleware/auth';
const r = Router();

r.get('/', authenticate, async (req: AuthRequest, res: Response) => {
  const { page = 1, category, upcoming = 'true', limit = 20 } = req.query;
  const offset = (Number(page) - 1) * Number(limit);
  try {
    const u = await pool.query('SELECT town_id FROM users WHERE id=$1', [req.user!.id]);
    const townId = u.rows[0]?.town_id;
    let q = `SELECT e.*,u.name as organizer_name,f.cloud_storage_path as cover_url,
             (SELECT COUNT(*) FROM event_rsvps WHERE event_id=e.id AND status='going') as attendee_count,
             EXISTS(SELECT 1 FROM event_rsvps WHERE event_id=e.id AND user_id=$1) as user_rsvped
             FROM events e JOIN users u ON u.id=e.organizer_id LEFT JOIN files f ON f.id=e.cover_file_id
             WHERE e.town_id=$2`;
    const params: any[] = [req.user!.id, townId];
    if (upcoming === 'true') { q += ` AND e.start_at >= NOW()`; }
    if (category) { q += ` AND e.category=$${params.length+1}`; params.push(category); }
    q += ` ORDER BY e.start_at ASC LIMIT $${params.length+1} OFFSET $${params.length+2}`;
    params.push(Number(limit), offset);
    const { rows } = await pool.query(q, params);
    res.json({ success: true, data: rows });
  } catch(e) { console.error(e); res.status(500).json({ success: false, message: 'Failed' }); }
});

r.post('/', authenticate, async (req: AuthRequest, res: Response) => {
  const { title, description, category = 'General', startAt, endAt, location, lat, lng, maxAttendees, isFree = true, ticketPrice } = req.body;
  if (!title || !startAt) { res.status(400).json({ success: false, message: 'Title and start date required' }); return; }
  try {
    const u = await pool.query('SELECT town_id FROM users WHERE id=$1', [req.user!.id]);
    const { rows } = await pool.query(
      `INSERT INTO events(title,description,category,start_at,end_at,location,lat,lng,organizer_id,town_id,max_attendees,is_free,ticket_price)
       VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13) RETURNING *`,
      [title, description, category, startAt, endAt, location, lat, lng, req.user!.id, u.rows[0].town_id, maxAttendees, isFree, ticketPrice]
    );
    res.status(201).json({ success: true, data: rows[0] });
  } catch { res.status(500).json({ success: false, message: 'Failed' }); }
});

r.get('/:id', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const { rows } = await pool.query(
      `SELECT e.*,u.name as organizer_name,u.phone as organizer_phone,f.cloud_storage_path as cover_url,
       (SELECT COUNT(*) FROM event_rsvps WHERE event_id=e.id AND status='going') as attendee_count,
       EXISTS(SELECT 1 FROM event_rsvps WHERE event_id=e.id AND user_id=$2) as user_rsvped
       FROM events e JOIN users u ON u.id=e.organizer_id LEFT JOIN files f ON f.id=e.cover_file_id WHERE e.id=$1`,
      [req.params.id, req.user!.id]
    );
    if (!rows.length) { res.status(404).json({ success: false, message: 'Not found' }); return; }
    res.json({ success: true, data: rows[0] });
  } catch { res.status(500).json({ success: false, message: 'Failed' }); }
});

r.post('/:id/rsvp', authenticate, async (req: AuthRequest, res: Response) => {
  const { status = 'going' } = req.body;
  try {
    await pool.query(
      'INSERT INTO event_rsvps(event_id,user_id,status) VALUES($1,$2,$3) ON CONFLICT(event_id,user_id) DO UPDATE SET status=$3',
      [req.params.id, req.user!.id, status]
    );
    res.json({ success: true, status });
  } catch { res.status(500).json({ success: false, message: 'Failed' }); }
});

r.delete('/:id/rsvp', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    await pool.query('DELETE FROM event_rsvps WHERE event_id=$1 AND user_id=$2', [req.params.id, req.user!.id]);
    res.json({ success: true });
  } catch { res.status(500).json({ success: false, message: 'Failed' }); }
});

r.delete('/:id', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const { rows } = await pool.query('DELETE FROM events WHERE id=$1 AND organizer_id=$2 RETURNING id', [req.params.id, req.user!.id]);
    if (!rows.length) { res.status(404).json({ success: false, message: 'Not found or not authorized' }); return; }
    res.json({ success: true });
  } catch { res.status(500).json({ success: false, message: 'Failed' }); }
});

export default r;
