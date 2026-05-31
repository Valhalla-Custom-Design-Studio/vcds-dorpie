import { Router, Request, Response } from 'express';
import { pool } from '../db/pool';
import { authenticate, AuthRequest } from '../middleware/auth';

const r = Router();

// ── POST /promo/redeem ─────────────────────────────────────────────────────────
// Validates and redeems a town promo code.
// Jordaanpark: code #JPF2026, valid 1 Jun 2026 – 30 Jun 2026 (once per member).
// On success: grants free tier. After 30 Jun 2026: migrates member to Heidelberg.
r.post('/redeem', authenticate, async (req: AuthRequest, res: Response) => {
  const userId = req.user!.id;
  const { code, townId } = req.body;

  if (!code || !townId) {
    res.status(400).json({ success: false, message: 'Code and townId required' });
    return;
  }

  try {
    // Load town
    const townRes = await pool.query('SELECT * FROM towns WHERE id = $1', [townId]);
    if (!townRes.rows.length) {
      res.status(404).json({ success: false, message: 'Town not found' });
      return;
    }
    const town = townRes.rows[0];

    // Only Jordaanpark has a promo code
    if (town.name.toLowerCase() !== 'jordaanpark') {
      res.status(400).json({ success: false, message: 'No promo code for this town' });
      return;
    }

    const PROMO_CODE = '#JPF2026';
    const CODE_START = new Date('2026-06-01T00:00:00+02:00');
    const CODE_END   = new Date('2026-06-30T23:59:59+02:00');
    const now = new Date();

    // Validate code
    if (code.trim().toUpperCase() !== PROMO_CODE.toUpperCase()) {
      res.status(400).json({ success: false, message: 'Ongeldige kode / Invalid code' });
      return;
    }

    // Validate date window
    if (now < CODE_START || now > CODE_END) {
      res.status(400).json({ success: false, message: 'Hierdie kode het verval / This code has expired' });
      return;
    }

    // Check if user already used this code (by user id)
    const usedRes = await pool.query(
      'SELECT id FROM promo_code_redemptions WHERE user_id = $1 AND code = $2',
      [userId, PROMO_CODE]
    );
    if (usedRes.rows.length > 0) {
      res.status(409).json({ success: false, message: 'Jy het hierdie kode reeds gebruik / Code already used' });
      return;
    }

    // Also check by name+email+phone to prevent duplicate registrations
    const userRes = await pool.query('SELECT name, email, phone FROM users WHERE id = $1', [userId]);
    const user = userRes.rows[0];
    const dupRes = await pool.query(
      `SELECT pcr.id FROM promo_code_redemptions pcr
       JOIN users u ON pcr.user_id = u.id
       WHERE pcr.code = $1
         AND (u.email = $2 OR u.phone = $3 OR u.name = $4)`,
      [PROMO_CODE, user.email, user.phone, user.name]
    );
    if (dupRes.rows.length > 0) {
      res.status(409).json({ success: false, message: 'Hierdie kode is reeds gebruik vir hierdie rekening / Code already used for this account' });
      return;
    }

    // All good — grant free access + assign to Jordaanpark
    await pool.query(
      'UPDATE users SET town_id = $1, subscription_tier = $2 WHERE id = $3',
      [townId, 'platinum', userId]
    );

    // Record redemption
    await pool.query(
      'INSERT INTO promo_code_redemptions (user_id, code, town_id, redeemed_at) VALUES ($1,$2,$3,NOW())',
      [userId, PROMO_CODE, townId]
    );

    res.json({
      success: true,
      message: 'Welkom by Jordaanpark! Jy het volle toegang tot alle funksies.',
      tier: 'platinum',
      townId,
    });
  } catch (e: any) {
    console.error('[PromoCode] Error:', e);
    res.status(500).json({ success: false, message: 'Failed to redeem code' });
  }
});

export default r;
