import { Router, Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { pool } from '../db/pool';
import { authenticate, AuthRequest } from '../middleware/auth';
const r = Router();

const VALID_APPS = ['dorpwag', 'ouma_en_oppas', 'oppas', 'plaasboek', 'veekos', 'fitness_fuel', 'vleiskraft'];

r.post('/signup', async (req: Request, res: Response) => {
  const { email, password, name, townId, phone, appName = 'dorpwag' } = req.body;
  if (!email || !password || !name) { res.status(400).json({ success: false, message: 'Email, password and name required' }); return; }
  if (password.length < 8) { res.status(400).json({ success: false, message: 'Password must be at least 8 characters' }); return; }
  const app = VALID_APPS.includes(appName) ? appName : 'dorpwag';
  try {
    const ex = await pool.query('SELECT id,email,name,role,subscription_tier,town_id,registered_apps FROM users WHERE email=$1', [email.toLowerCase()]);
    if (ex.rows.length) {
      // User exists — add this app to registeredApps and return JWT
      const user = ex.rows[0];
      if (!user.registered_apps.includes(app)) {
        await pool.query(
          'UPDATE users SET registered_apps = array_append(registered_apps, $2) WHERE id=$1',
          [user.id, app]
        );
        user.registered_apps = [...user.registered_apps, app];
      }
      const token = jwt.sign({ id: user.id, email: user.email, role: user.role, tier: user.subscription_tier, app }, process.env.JWT_SECRET!, { expiresIn: '7d' });
      res.status(200).json({ success: true, existing: true, data: { user, access_token: token } });
      return;
    }
    const hash = await bcrypt.hash(password, 12);
    const { rows } = await pool.query(
      'INSERT INTO users (email,password,name,town_id,phone,registered_apps) VALUES($1,$2,$3,$4,$5,$6) RETURNING id,email,name,role,subscription_tier,town_id,registered_apps',
      [email.toLowerCase(), hash, name, townId || null, phone || null, [app]]
    );
    const user = rows[0];
    await pool.query('INSERT INTO notification_preferences (user_id) VALUES($1) ON CONFLICT DO NOTHING', [user.id]);
    const token = jwt.sign({ id: user.id, email: user.email, role: user.role, tier: user.subscription_tier, app }, process.env.JWT_SECRET!, { expiresIn: '7d' });
    res.status(201).json({ success: true, existing: false, data: { user, access_token: token } });
  } catch(e) { console.error(e); res.status(500).json({ success: false, message: 'Registration failed' }); }
});

r.post('/login', async (req: Request, res: Response) => {
  const { email, password, appName = 'dorpwag' } = req.body;
  if (!email || !password) { res.status(400).json({ success: false, message: 'Email and password required' }); return; }
  const app = VALID_APPS.includes(appName) ? appName : 'dorpwag';
  try {
    const { rows } = await pool.query(
      `SELECT u.id,u.email,u.password,u.name,u.role,u.subscription_tier,u.town_id,u.registered_apps,t.name as town_name
       FROM users u LEFT JOIN towns t ON t.id=u.town_id WHERE u.email=$1 AND u.is_active=true`,
      [email.toLowerCase()]
    );
    if (!rows.length) { res.status(401).json({ success: false, message: 'Invalid credentials' }); return; }
    const user = rows[0];
    const valid = await bcrypt.compare(password, user.password);
    if (!valid) { res.status(401).json({ success: false, message: 'Invalid credentials' }); return; }
    // Auto-register app on login if not already registered
    if (!user.registered_apps.includes(app)) {
      await pool.query('UPDATE users SET registered_apps = array_append(registered_apps, $2) WHERE id=$1', [user.id, app]);
      user.registered_apps = [...user.registered_apps, app];
    }
    await pool.query('UPDATE users SET last_seen_at=NOW() WHERE id=$1', [user.id]);
    const token = jwt.sign({ id: user.id, email: user.email, role: user.role, tier: user.subscription_tier, app }, process.env.JWT_SECRET!, { expiresIn: '7d' });
    const { password: _p, ...safeUser } = user;
    res.json({ success: true, data: { user: safeUser, access_token: token } });
  } catch(e) { console.error(e); res.status(500).json({ success: false, message: 'Login failed' }); }
});

r.get('/me', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const { rows } = await pool.query(
      `SELECT u.id,u.email,u.name,u.role,u.phone,u.subscription_tier,u.subscription_expires_at,
              u.town_id,u.registered_apps,t.name as town_name,f.cloud_storage_path as avatar_url
       FROM users u
       LEFT JOIN towns t ON t.id=u.town_id
       LEFT JOIN files f ON f.id=u.profile_photo_id
       WHERE u.id=$1`,
      [req.user!.id]
    );
    if (!rows.length) { res.status(404).json({ success: false, message: 'User not found' }); return; }
    res.json({ success: true, data: rows[0] });
  } catch(e) { res.status(500).json({ success: false, message: 'Failed' }); }
});

r.post('/forgot-password', async (req: Request, res: Response) => {
  const { email } = req.body;
  if (!email) { res.status(400).json({ success: false, message: 'Email required' }); return; }
  try {
    const { rows } = await pool.query('SELECT id FROM users WHERE email=$1', [email.toLowerCase()]);
    if (!rows.length) { res.json({ success: true, message: 'If that email exists, a reset link was sent' }); return; }
    const resetToken = crypto.randomBytes(32).toString('hex');
    const expires = new Date(Date.now() + 3600000);
    await pool.query('UPDATE users SET reset_token=$1,reset_token_expires=$2 WHERE id=$3', [resetToken, expires, rows[0].id]);
    res.json({ success: true, message: 'If that email exists, a reset link was sent', debug_token: process.env.NODE_ENV === 'development' ? resetToken : undefined });
  } catch(e) { res.status(500).json({ success: false, message: 'Failed' }); }
});

r.post('/reset-password', async (req: Request, res: Response) => {
  const { token, password } = req.body;
  if (!token || !password) { res.status(400).json({ success: false, message: 'Token and password required' }); return; }
  if (password.length < 8) { res.status(400).json({ success: false, message: 'Password must be at least 8 characters' }); return; }
  try {
    const { rows } = await pool.query('SELECT id FROM users WHERE reset_token=$1 AND reset_token_expires>NOW()', [token]);
    if (!rows.length) { res.status(400).json({ success: false, message: 'Invalid or expired token' }); return; }
    const hash = await bcrypt.hash(password, 12);
    await pool.query('UPDATE users SET password=$1,reset_token=NULL,reset_token_expires=NULL WHERE id=$2', [hash, rows[0].id]);
    res.json({ success: true, message: 'Password reset successful' });
  } catch(e) { res.status(500).json({ success: false, message: 'Failed' }); }
});

export default r;
