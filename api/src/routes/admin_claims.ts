import { Router, Response } from 'express';
import { pool } from '../db/pool';
import { authenticate, AuthRequest } from '../middleware/auth';

const r = Router();

// Middleware: admin only
const requireAdmin = async (req: AuthRequest, res: Response, next: Function) => {
  const { rows } = await pool.query('SELECT role FROM users WHERE id=$1', [req.user!.id]);
  if (rows[0]?.role !== 'admin') { res.status(403).json({ success: false, message: 'Admin only' }); return; }
  next();
};

// ─── LIST PENDING CLAIMS ────────────────────────────────────────────────────
r.get('/claims', authenticate, requireAdmin, async (req: AuthRequest, res: Response) => {
  try {
    const { rows } = await pool.query(
      `SELECT cr.*,b.name as business_name,b.category,u.name as claimant_name,u.email as claimant_email
       FROM business_claim_requests cr
       JOIN businesses b ON b.id=cr.business_id
       JOIN users u ON u.id=cr.user_id
       WHERE cr.status='pending'
       ORDER BY cr.submitted_at ASC`
    );
    res.json({ success: true, data: rows });
  } catch(e) { res.status(500).json({ success: false, message: 'Failed' }); }
});

// ─── APPROVE CLAIM ──────────────────────────────────────────────────────────
r.post('/claims/:claimId/approve', authenticate, requireAdmin, async (req: AuthRequest, res: Response) => {
  const { badge = 'verified', admin_notes } = req.body;
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    // Get claim
    const { rows: claim } = await client.query(
      'SELECT * FROM business_claim_requests WHERE id=$1', [req.params.claimId]
    );
    if (!claim[0]) { await client.query('ROLLBACK'); res.status(404).json({ success: false, message: 'Claim not found' }); return; }
    // Update claim
    await client.query(
      `UPDATE business_claim_requests SET status='approved',reviewed_at=NOW(),reviewed_by=$1,admin_notes=$2 WHERE id=$3`,
      [req.user!.id, admin_notes, req.params.claimId]
    );
    // Transfer business ownership + verify
    await client.query(
      `UPDATE businesses SET
         owner_id=$1,
         is_verified=TRUE,
         verified_at=NOW(),
         verified_by=$2,
         verification_badge=$3,
         claim_status='approved'
       WHERE id=$4`,
      [claim[0].user_id, req.user!.id, badge, claim[0].business_id]
    );
    // Reject all other pending claims for same business
    await client.query(
      `UPDATE business_claim_requests SET status='rejected',reviewed_at=NOW(),reviewed_by=$1
       WHERE business_id=$2 AND id!=$3 AND status='pending'`,
      [req.user!.id, claim[0].business_id, req.params.claimId]
    );
    await client.query('COMMIT');
    res.json({ success: true, message: 'Claim approved — business verified and ownership transferred' });
  } catch(e) {
    await client.query('ROLLBACK');
    console.error(e);
    res.status(500).json({ success: false, message: 'Failed' });
  } finally { client.release(); }
});

// ─── REJECT CLAIM ───────────────────────────────────────────────────────────
r.post('/claims/:claimId/reject', authenticate, requireAdmin, async (req: AuthRequest, res: Response) => {
  const { admin_notes } = req.body;
  try {
    const { rows } = await pool.query(
      `UPDATE business_claim_requests SET status='rejected',reviewed_at=NOW(),reviewed_by=$1,admin_notes=$2
       WHERE id=$3 RETURNING business_id`,
      [req.user!.id, admin_notes, req.params.claimId]
    );
    if (!rows[0]) { res.status(404).json({ success: false, message: 'Claim not found' }); return; }
    // Reset business claim_status if no other pending claims
    const { rows: pending } = await pool.query(
      "SELECT id FROM business_claim_requests WHERE business_id=$1 AND status='pending'",
      [rows[0].business_id]
    );
    if (pending.length === 0) {
      await pool.query("UPDATE businesses SET claim_status='unclaimed' WHERE id=$1", [rows[0].business_id]);
    }
    res.json({ success: true, message: 'Claim rejected' });
  } catch(e) { res.status(500).json({ success: false, message: 'Failed' }); }
});

// ─── MANUALLY VERIFY BUSINESS (admin grant) ─────────────────────────────────
r.post('/businesses/:id/verify', authenticate, requireAdmin, async (req: AuthRequest, res: Response) => {
  const { badge = 'verified' } = req.body;
  try {
    await pool.query(
      `UPDATE businesses SET is_verified=TRUE,verified_at=NOW(),verified_by=$1,verification_badge=$2,claim_status='approved'
       WHERE id=$3`,
      [req.user!.id, badge, req.params.id]
    );
    res.json({ success: true, message: `Business verified with badge: ${badge}` });
  } catch(e) { res.status(500).json({ success: false, message: 'Failed' }); }
});

// ─── REVOKE VERIFICATION ────────────────────────────────────────────────────
r.post('/businesses/:id/revoke', authenticate, requireAdmin, async (req: AuthRequest, res: Response) => {
  try {
    await pool.query(
      `UPDATE businesses SET is_verified=FALSE,verified_at=NULL,verified_by=NULL,
       verification_badge='none',claim_status='unclaimed' WHERE id=$1`,
      [req.params.id]
    );
    res.json({ success: true, message: 'Verification revoked' });
  } catch(e) { res.status(500).json({ success: false, message: 'Failed' }); }
});

export default r;
