import { Router, Request, Response } from 'express';
import { pool } from '../db/pool';
import { authenticate, AuthRequest } from '../middleware/auth';
import { buildPaymentURL, verifyITN } from '../services/PayFastService';
const r = Router();

const TIERS = {
  paid: { price: 49, name: 'Dorpwag™ Pro', description: 'Dorpwag™ Pro — Maandelikse intekening' }
};

r.post('/subscribe', authenticate, async (req: AuthRequest, res: Response) => {
  const { tier = 'paid', returnUrl, cancelUrl } = req.body;
  try {
    const { rows } = await pool.query('SELECT name,email FROM users WHERE id=$1', [req.user!.id]);
    const user = rows[0];
    const [firstName, ...rest] = user.name.split(' ');
    const lastName = rest.join(' ') || 'User';
    const notifyUrl = `${process.env.API_BASE_URL}/api/payments/itn`;
    const url = buildPaymentURL({
      amount: TIERS.paid.price,
      itemName: TIERS.paid.name,
      itemDescription: TIERS.paid.description,
      email: user.email,
      firstName, lastName,
      returnUrl: returnUrl || `${process.env.APP_URL}/subscribe/success`,
      cancelUrl: cancelUrl || `${process.env.APP_URL}/subscribe/cancel`,
      notifyUrl,
      subscriptionType: 1,
      frequency: 3,
      cycles: 0,
      customStr1: req.user!.id,
    });
    res.json({ success: true, data: { url, amount: TIERS.paid.price } });
  } catch(e) { console.error(e); res.status(500).json({ success: false, message: 'Failed' }); }
});

r.post('/itn', async (req: Request, res: Response) => {
  try {
    const params = req.body as Record<string, string>;
    if (!verifyITN(params)) { res.status(400).send('Invalid signature'); return; }
    if (params.payment_status === 'COMPLETE') {
      const userId = params.custom_str1;
      const expiresAt = new Date(Date.now() + 31 * 24 * 60 * 60 * 1000);
      await pool.query(
        'UPDATE users SET subscription_tier=$1,subscription_expires_at=$2,payfast_subscription_token=$3 WHERE id=$4',
        ['paid', expiresAt, params.token || null, userId]
      );
      await pool.query(
        'INSERT INTO subscription_payments(user_id,amount,status,payfast_payment_id,payfast_token,tier) VALUES($1,$2,$3,$4,$5,$6)',
        [userId, params.amount_gross, 'complete', params.pf_payment_id, params.token, 'paid']
      );
    }
    res.send('OK');
  } catch(e) { console.error(e); res.status(500).send('Error'); }
});

r.get('/status', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const { rows } = await pool.query('SELECT subscription_tier,subscription_expires_at FROM users WHERE id=$1', [req.user!.id]);
    res.json({ success: true, data: rows[0] });
  } catch { res.status(500).json({ success: false, message: 'Failed' }); }
});

export default r;
