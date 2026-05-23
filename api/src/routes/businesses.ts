import { Router, Response } from 'express';
import { pool } from '../db/pool';
import { authenticate, AuthRequest } from '../middleware/auth';
const r = Router();

r.get('/', authenticate, async (req: AuthRequest, res: Response) => {
  const { category, search, limit = 30 } = req.query;
  try {
    const u = await pool.query('SELECT town_id FROM users WHERE id=$1', [req.user!.id]);
    const townId = u.rows[0]?.town_id;
    let q = `SELECT b.*,u.name as owner_name,f.cloud_storage_path as logo_url,
             COALESCE(AVG(br.rating),0) as avg_rating,COUNT(br.id) as review_count
             FROM businesses b JOIN users u ON u.id=b.owner_id
             LEFT JOIN files f ON f.id=b.logo_file_id
             LEFT JOIN business_reviews br ON br.business_id=b.id
             WHERE b.town_id=$1 AND b.is_active=true`;
    const params: any[] = [townId];
    if (category) { q += ` AND b.category=$${params.length+1}`; params.push(category); }
    if (search) { q += ` AND (b.name ILIKE $${params.length+1} OR b.description ILIKE $${params.length+1})`; params.push(`%${search}%`); }
    q += ` GROUP BY b.id,u.name,f.cloud_storage_path ORDER BY b.is_verified DESC, avg_rating DESC LIMIT $${params.length+1}`;
    params.push(Number(limit));
    const { rows } = await pool.query(q, params);
    res.json({ success: true, data: rows });
  } catch(e) { console.error(e); res.status(500).json({ success: false, message: 'Failed' }); }
});

r.post('/', authenticate, async (req: AuthRequest, res: Response) => {
  const { name, category, description, phone, email, website, address, lat, lng } = req.body;
  if (!name) { res.status(400).json({ success: false, message: 'Business name required' }); return; }
  try {
    const u = await pool.query('SELECT town_id FROM users WHERE id=$1', [req.user!.id]);
    const { rows } = await pool.query(
      `INSERT INTO businesses(name,category,description,phone,email,website,address,lat,lng,owner_id,town_id)
       VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11) RETURNING *`,
      [name, category, description, phone, email, website, address, lat, lng, req.user!.id, u.rows[0].town_id]
    );
    res.status(201).json({ success: true, data: rows[0] });
  } catch { res.status(500).json({ success: false, message: 'Failed' }); }
});

r.get('/:id', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const { rows } = await pool.query(
      `SELECT b.*,u.name as owner_name,u.phone as owner_phone,f.cloud_storage_path as logo_url,
       COALESCE(AVG(br.rating),0) as avg_rating,COUNT(br.id) as review_count
       FROM businesses b JOIN users u ON u.id=b.owner_id
       LEFT JOIN files f ON f.id=b.logo_file_id
       LEFT JOIN business_reviews br ON br.business_id=b.id
       WHERE b.id=$1 GROUP BY b.id,u.name,u.phone,f.cloud_storage_path`,
      [req.params.id]
    );
    if (!rows.length) { res.status(404).json({ success: false, message: 'Not found' }); return; }
    res.json({ success: true, data: rows[0] });
  } catch { res.status(500).json({ success: false, message: 'Failed' }); }
});

r.get('/:id/reviews', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const { rows } = await pool.query(
      `SELECT br.*,u.name as reviewer_name,f.cloud_storage_path as reviewer_avatar
       FROM business_reviews br JOIN users u ON u.id=br.user_id LEFT JOIN files f ON f.id=u.profile_photo_id
       WHERE br.business_id=$1 ORDER BY br.created_at DESC`,
      [req.params.id]
    );
    res.json({ success: true, data: rows });
  } catch { res.status(500).json({ success: false, message: 'Failed' }); }
});

r.post('/:id/reviews', authenticate, async (req: AuthRequest, res: Response) => {
  const { rating, body } = req.body;
  if (!rating) { res.status(400).json({ success: false, message: 'Rating required' }); return; }
  try {
    const { rows } = await pool.query(
      'INSERT INTO business_reviews(business_id,user_id,rating,body) VALUES($1,$2,$3,$4) ON CONFLICT(business_id,user_id) DO UPDATE SET rating=$3,body=$4 RETURNING *',
      [req.params.id, req.user!.id, rating, body]
    );
    res.status(201).json({ success: true, data: rows[0] });
  } catch { res.status(500).json({ success: false, message: 'Failed' }); }
});

export default r;
