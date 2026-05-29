import { Router, Response } from 'express';
import { pool } from '../db/pool';
import { authenticate, AuthRequest } from '../middleware/auth';
const r = Router();

const PLANS = [
  { id: 'free', name: 'Gratis', price: 0, currency: 'ZAR', interval: 'month', features: ['Notices', 'Community', 'Directory', 'Basic Profile'] },
  { id: 'community', name: 'Gemeenskap', price: 49, currency: 'ZAR', interval: 'month', features: ['All Free features', 'Post Listings', 'Business Profile', 'Messages', 'Priority Support'] },
  { id: 'guardian', name: 'Bewaker™', price: 99, currency: 'ZAR', interval: 'month', features: ['All Community features', 'SOS Emergency Alert', 'Dead Man Timer', 'Movement Tracking', 'Safety Heatmap', 'Guardian Mode™', 'Patrol Participation'] },
];

r.get('/plans', (_req, res: Response) => {
  res.json({ success: true, data: PLANS });
});

r.get('/current', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const { rows } = await pool.query(
      'SELECT subscription_tier, payfast_subscription_token, subscription_start, subscription_end FROM users WHERE id=$1',
      [req.user!.id]
    );
    const user = rows[0];
    const plan = PLANS.find(p => p.id === (user?.subscription_tier || 'free')) || PLANS[0];
    res.json({ success: true, data: { plan, tier: user?.subscription_tier || 'free', token: user?.payfast_subscription_token, start: user?.subscription_start, end: user?.subscription_end } });
  } catch { res.status(500).json({ success: false, message: 'Failed' }); }
});

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
      "UPDATE users SET subscription_tier='free', payfast_subscription_token=NULL WHERE id=$1",
      [req.user!.id]
    );
    res.json({ success: true, message: 'Subscription cancelled' });
  } catch { res.status(500).json({ success: false, message: 'Failed' }); }
});

export default r;
