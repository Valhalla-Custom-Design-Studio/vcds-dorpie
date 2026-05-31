import { Router, Response } from 'express';
import { pool } from '../db/pool';
import { authenticate, AuthRequest } from '../middleware/auth';
import { requireTier } from '../middleware/requireTier';

const r = Router();

// ─── LIST BUSINESSES ────────────────────────────────────────────────────────
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

// ─── GET SINGLE BUSINESS ────────────────────────────────────────────────────
r.get('/:id', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const { rows } = await pool.query(
      `SELECT b.*,u.name as owner_name,f.cloud_storage_path as logo_url,
       COALESCE(AVG(br.rating),0) as avg_rating,COUNT(br.id) as review_count
       FROM businesses b JOIN users u ON u.id=b.owner_id
       LEFT JOIN files f ON f.id=b.logo_file_id
       LEFT JOIN business_reviews br ON br.business_id=b.id
       WHERE b.id=$1 GROUP BY b.id,u.name,f.cloud_storage_path`,
      [req.params.id]
    );
    if (!rows[0]) { res.status(404).json({ success: false, message: 'Not found' }); return; }
    res.json({ success: true, data: rows[0] });
  } catch(e) { res.status(500).json({ success: false, message: 'Failed' }); }
});

// ─── CREATE BUSINESS ────────────────────────────────────────────────────────
r.post('/', authenticate, async (req: AuthRequest, res: Response) => {
  const { name, category, description, phone, email, website, address, lat, lng, operating_hours, social_links } = req.body;
  if (!name) { res.status(400).json({ success: false, message: 'Business name required' }); return; }
  try {
    const u = await pool.query('SELECT town_id FROM users WHERE id=$1', [req.user!.id]);
    const { rows } = await pool.query(
      `INSERT INTO businesses(name,category,description,phone,email,website,address,lat,lng,owner_id,town_id,operating_hours,social_links)
       VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13) RETURNING *`,
      [name,category,description,phone,email,website,address,lat,lng,req.user!.id,u.rows[0]?.town_id,
       JSON.stringify(operating_hours||{}), JSON.stringify(social_links||{})]
    );
    res.status(201).json({ success: true, data: rows[0] });
  } catch(e) { console.error(e); res.status(500).json({ success: false, message: 'Failed' }); }
});

// ─── UPDATE BUSINESS (owner only) ───────────────────────────────────────────
r.put('/:id', authenticate, async (req: AuthRequest, res: Response) => {
  const { name, description, phone, email, website, address, operating_hours, social_links, photos } = req.body;
  try {
    const { rows: biz } = await pool.query('SELECT owner_id FROM businesses WHERE id=$1', [req.params.id]);
    if (!biz[0]) { res.status(404).json({ success: false, message: 'Not found' }); return; }
    if (biz[0].owner_id !== req.user!.id) { res.status(403).json({ success: false, message: 'Not your business' }); return; }
    const { rows } = await pool.query(
      `UPDATE businesses SET name=COALESCE($1,name),description=COALESCE($2,description),
       phone=COALESCE($3,phone),email=COALESCE($4,email),website=COALESCE($5,website),
       address=COALESCE($6,address),operating_hours=COALESCE($7,operating_hours),
       social_links=COALESCE($8,social_links),photos=COALESCE($9,photos),updated_at=NOW()
       WHERE id=$10 RETURNING *`,
      [name,description,phone,email,website,address,
       operating_hours ? JSON.stringify(operating_hours) : null,
       social_links ? JSON.stringify(social_links) : null,
       photos || null, req.params.id]
    );
    res.json({ success: true, data: rows[0] });
  } catch(e) { res.status(500).json({ success: false, message: 'Failed' }); }
});

// ─── SUBMIT OWNER CLAIM ─────────────────────────────────────────────────────
r.post('/:id/claim', authenticate, async (req: AuthRequest, res: Response) => {
  const { proof_document_url, proof_type } = req.body;
  if (!proof_document_url || !proof_type) {
    res.status(400).json({ success: false, message: 'Proof document and type required' }); return;
  }
  try {
    // Check business exists and is unclaimed
    const { rows: biz } = await pool.query(
      'SELECT id, claim_status, owner_id FROM businesses WHERE id=$1', [req.params.id]
    );
    if (!biz[0]) { res.status(404).json({ success: false, message: 'Business not found' }); return; }
    if (biz[0].claim_status === 'approved') {
      res.status(409).json({ success: false, message: 'Business already claimed' }); return;
    }
    if (biz[0].owner_id === req.user!.id) {
      res.status(409).json({ success: false, message: 'You already own this business' }); return;
    }
    // Upsert claim request
    const { rows } = await pool.query(
      `INSERT INTO business_claim_requests(business_id,user_id,proof_document_url,proof_type)
       VALUES($1,$2,$3,$4)
       ON CONFLICT(business_id,user_id) DO UPDATE SET
         proof_document_url=$3,proof_type=$4,status='pending',submitted_at=NOW()
       RETURNING *`,
      [req.params.id, req.user!.id, proof_document_url, proof_type]
    );
    // Update business claim_status to pending
    await pool.query("UPDATE businesses SET claim_status='pending' WHERE id=$1", [req.params.id]);
    res.status(201).json({ success: true, data: rows[0], message: 'Claim submitted — review within 48 hours' });
  } catch(e) { console.error(e); res.status(500).json({ success: false, message: 'Failed' }); }
});

// ─── GET MY CLAIM STATUS ────────────────────────────────────────────────────
r.get('/:id/claim', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const { rows } = await pool.query(
      'SELECT * FROM business_claim_requests WHERE business_id=$1 AND user_id=$2',
      [req.params.id, req.user!.id]
    );
    res.json({ success: true, data: rows[0] || null });
  } catch(e) { res.status(500).json({ success: false, message: 'Failed' }); }
});

// ─── ADD REVIEW ─────────────────────────────────────────────────────────────
r.post('/:id/reviews', authenticate, async (req: AuthRequest, res: Response) => {
  const { rating, comment } = req.body;
  if (!rating || rating < 1 || rating > 5) { res.status(400).json({ success: false, message: 'Rating 1-5 required' }); return; }
  try {
    await pool.query(
      `INSERT INTO business_reviews(business_id,user_id,rating,comment)
       VALUES($1,$2,$3,$4) ON CONFLICT(business_id,user_id) DO UPDATE SET rating=$3,comment=$4,updated_at=NOW()`,
      [req.params.id, req.user!.id, rating, comment]
    );
    res.status(201).json({ success: true });
  } catch(e) { res.status(500).json({ success: false, message: 'Failed' }); }
});

export default r;
