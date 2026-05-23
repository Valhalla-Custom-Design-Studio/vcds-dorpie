import { Router, Response } from 'express';
import { pool } from '../db/pool';
import { authenticate, AuthRequest } from '../middleware/auth';
const r = Router();

r.get('/', authenticate, async (req: AuthRequest, res: Response) => {
  const { page = 1, category, condition, minPrice, maxPrice, limit = 20 } = req.query;
  const offset = (Number(page) - 1) * Number(limit);
  try {
    const u = await pool.query('SELECT town_id FROM users WHERE id=$1', [req.user!.id]);
    const townId = u.rows[0]?.town_id;
    let q = `SELECT l.*,u.name as seller_name,f.cloud_storage_path as seller_avatar,
             ARRAY(SELECT fi.cloud_storage_path FROM listing_images li JOIN files fi ON fi.id=li.file_id WHERE li.listing_id=l.id ORDER BY li.sort_order) as images
             FROM listings l JOIN users u ON u.id=l.seller_id LEFT JOIN files f ON f.id=u.profile_photo_id
             WHERE l.town_id=$1 AND l.status='active'`;
    const params: any[] = [townId];
    if (category) { q += ` AND l.category=$${params.length+1}`; params.push(category); }
    if (condition) { q += ` AND l.condition=$${params.length+1}`; params.push(condition); }
    if (minPrice) { q += ` AND l.price>=$${params.length+1}`; params.push(Number(minPrice)); }
    if (maxPrice) { q += ` AND l.price<=$${params.length+1}`; params.push(Number(maxPrice)); }
    q += ` ORDER BY l.created_at DESC LIMIT $${params.length+1} OFFSET $${params.length+2}`;
    params.push(Number(limit), offset);
    const { rows } = await pool.query(q, params);
    res.json({ success: true, data: rows });
  } catch(e) { console.error(e); res.status(500).json({ success: false, message: 'Failed' }); }
});

r.post('/', authenticate, async (req: AuthRequest, res: Response) => {
  const { title, price, description, category = 'Other', condition = 'Good' } = req.body;
  if (!title || price === undefined) { res.status(400).json({ success: false, message: 'Title and price required' }); return; }
  try {
    const u = await pool.query('SELECT town_id FROM users WHERE id=$1', [req.user!.id]);
    const { rows } = await pool.query(
      'INSERT INTO listings(title,price,description,category,condition,seller_id,town_id) VALUES($1,$2,$3,$4,$5,$6,$7) RETURNING *',
      [title, price, description, category, condition, req.user!.id, u.rows[0].town_id]
    );
    res.status(201).json({ success: true, data: rows[0] });
  } catch { res.status(500).json({ success: false, message: 'Failed' }); }
});

r.get('/my', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const { rows } = await pool.query(
      `SELECT l.*,ARRAY(SELECT fi.cloud_storage_path FROM listing_images li JOIN files fi ON fi.id=li.file_id WHERE li.listing_id=l.id ORDER BY li.sort_order) as images
       FROM listings l WHERE l.seller_id=$1 ORDER BY l.created_at DESC`,
      [req.user!.id]
    );
    res.json({ success: true, data: rows });
  } catch { res.status(500).json({ success: false, message: 'Failed' }); }
});

r.get('/:id', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    await pool.query('UPDATE listings SET view_count=view_count+1 WHERE id=$1', [req.params.id]);
    const { rows } = await pool.query(
      `SELECT l.*,u.name as seller_name,u.phone as seller_phone,f.cloud_storage_path as seller_avatar,
       ARRAY(SELECT fi.cloud_storage_path FROM listing_images li JOIN files fi ON fi.id=li.file_id WHERE li.listing_id=l.id ORDER BY li.sort_order) as images
       FROM listings l JOIN users u ON u.id=l.seller_id LEFT JOIN files f ON f.id=u.profile_photo_id WHERE l.id=$1`,
      [req.params.id]
    );
    if (!rows.length) { res.status(404).json({ success: false, message: 'Not found' }); return; }
    res.json({ success: true, data: rows[0] });
  } catch { res.status(500).json({ success: false, message: 'Failed' }); }
});

r.put('/:id', authenticate, async (req: AuthRequest, res: Response) => {
  const { title, price, description, category, condition, status } = req.body;
  try {
    const { rows } = await pool.query(
      `UPDATE listings SET title=COALESCE($1,title),price=COALESCE($2,price),description=COALESCE($3,description),
       category=COALESCE($4,category),condition=COALESCE($5,condition),status=COALESCE($6,status),updated_at=NOW()
       WHERE id=$7 AND seller_id=$8 RETURNING *`,
      [title, price, description, category, condition, status, req.params.id, req.user!.id]
    );
    if (!rows.length) { res.status(404).json({ success: false, message: 'Not found or not authorized' }); return; }
    res.json({ success: true, data: rows[0] });
  } catch { res.status(500).json({ success: false, message: 'Failed' }); }
});

r.delete('/:id', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const { rows } = await pool.query('DELETE FROM listings WHERE id=$1 AND seller_id=$2 RETURNING id', [req.params.id, req.user!.id]);
    if (!rows.length) { res.status(404).json({ success: false, message: 'Not found or not authorized' }); return; }
    res.json({ success: true });
  } catch { res.status(500).json({ success: false, message: 'Failed' }); }
});

export default r;
