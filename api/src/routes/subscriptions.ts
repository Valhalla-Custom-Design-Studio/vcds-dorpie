import { Router, Response } from 'express';
import { pool } from '../db/pool';
import { authenticate, AuthRequest } from '../middleware/auth';
const r = Router();

r.get('/history', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const { rows } = await pool.query(
      'SELECT * FROM subscription_payments WHERE user_id=$1 ORDER BY created_at DESC',
      [req.user!.id]
    );
    res.json({ success: true, data: rows });
  } catch { res.status(500).json({ success: false, message: 'Failed' }); }
});

r.post('/cancel', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    await pool.query(
      "UPDATE users SET subscription_tier='free',payfast_subscription_token=NULL WHERE id=$1",
      [req.user!.id]
    );
    res.json({ success: true, message: 'Subscription cancelled' });
  } catch { res.status(500).json({ success: false, message: 'Failed' }); }
});

export default r;
