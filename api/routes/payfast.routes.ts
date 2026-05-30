import { Router, Request, Response } from 'express';
import crypto from 'crypto';
import { pool } from '../src/db/pool';

const router = Router();

// NOTE: This is the LEGACY webhook route kept for backward compatibility.
// The canonical ITN handler is at /api/payments/itn (api/src/routes/payments.ts).
// Both handlers are valid — this one handles direct PayFast webhook POSTs.
router.post('/payfast/webhook', async (req: Request, res: Response) => {
  try {
    const data = { ...req.body };
    // Validate PayFast signature
    const received = data.signature;
    delete data.signature;
    const str = Object.keys(data)
      .sort()
      .map((k: string) => `${k}=${encodeURIComponent(data[k]).replace(/%20/g, '+')}`)
      .join('&');
    const expected = crypto.createHash('md5').update(str).digest('hex');
    if (received !== expected) {
      return res.status(400).send('Invalid signature');
    }
    // Update subscription on payment_status=COMPLETE
    if (data.payment_status === 'COMPLETE') {
      const { m_payment_id, custom_str1: userId, custom_str2: tier } = data;
      const expiresAt = new Date(Date.now() + 31 * 24 * 60 * 60 * 1000);
      await pool.query(
        `UPDATE users
         SET subscription_tier = $1,
             subscription_expires_at = $2,
             payfast_subscription_token = $3,
             updated_at = NOW()
         WHERE id = $4`,
        [tier, expiresAt, m_payment_id, userId]
      );
    }
    return res.status(200).send('OK');
  } catch (err: any) {
    console.error('[PayFast webhook error]', err.message);
    return res.status(500).json({ error: err.message });
  }
});

export default router;
