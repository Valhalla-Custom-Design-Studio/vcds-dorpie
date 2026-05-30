import { Router, Response } from 'express';
import { pool } from '../db/pool';
import { authenticate, AuthRequest } from '../middleware/auth';

const r = Router();
r.use(authenticate);

// GET /api/sos/contacts — list trusted contacts
r.get('/contacts', async (req: AuthRequest, res: Response) => {
  try {
    const { rows } = await pool.query(
      `SELECT * FROM sos_trusted_contacts WHERE user_id = $1 ORDER BY is_primary DESC, created_at`,
      [req.user!.id]
    );
    res.json({ success: true, data: rows });
  } catch { res.status(500).json({ success: false, message: 'Failed' }); }
});

// POST /api/sos/contacts — add trusted contact
r.post('/contacts', async (req: AuthRequest, res: Response) => {
  const { name, phone, email, isPrimary = false } = req.body;
  if (!name || !phone) return res.status(400).json({ success: false, message: 'Name and phone required' });
  try {
    const { rows } = await pool.query(
      `INSERT INTO sos_trusted_contacts(user_id, name, phone, email, is_primary)
       VALUES($1, $2, $3, $4, $5) RETURNING *`,
      [req.user!.id, name, phone, email || null, isPrimary]
    );
    res.status(201).json({ success: true, data: rows[0] });
  } catch { res.status(500).json({ success: false, message: 'Failed' }); }
});

// PUT /api/sos/contacts/:id — update contact
r.put('/contacts/:id', async (req: AuthRequest, res: Response) => {
  const { name, phone, email, isPrimary } = req.body;
  try {
    const { rows } = await pool.query(
      `UPDATE sos_trusted_contacts SET name=$1, phone=$2, email=$3, is_primary=$4
       WHERE id=$5 AND user_id=$6 RETURNING *`,
      [name, phone, email, isPrimary, req.params.id, req.user!.id]
    );
    if (!rows.length) return res.status(404).json({ success: false, message: 'Not found' });
    res.json({ success: true, data: rows[0] });
  } catch { res.status(500).json({ success: false, message: 'Failed' }); }
});

// DELETE /api/sos/contacts/:id — remove contact
r.delete('/contacts/:id', async (req: AuthRequest, res: Response) => {
  try {
    await pool.query(
      'DELETE FROM sos_trusted_contacts WHERE id=$1 AND user_id=$2',
      [req.params.id, req.user!.id]
    );
    res.json({ success: true });
  } catch { res.status(500).json({ success: false, message: 'Failed' }); }
});

export default r;
