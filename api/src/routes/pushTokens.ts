import { Router, Response } from 'express';
import { pool } from '../db/pool';
import { authenticate, AuthRequest } from '../middleware/auth';
const r = Router();

r.post('/', authenticate, async (req: AuthRequest, res: Response) => {
  const { token, deviceType, appName = 'dorpwag' } = req.body;
  if (!token) { res.status(400).json({ success: false, message: 'Token required' }); return; }
  try {
    await pool.query(
      `INSERT INTO push_tokens(user_id, token, device_type, app_name)
       VALUES($1, $2, $3, $4)
       ON CONFLICT(token) DO UPDATE SET user_id=$1, device_type=$3, app_name=$4`,
      [req.user!.id, token, deviceType, appName]
    );
    // Also update registered_apps on user
    await pool.query(
      `UPDATE users SET registered_apps = array_append(
        CASE WHEN $2 = ANY(registered_apps) THEN registered_apps ELSE registered_apps END,
        CASE WHEN NOT ($2 = ANY(registered_apps)) THEN $2 ELSE NULL END
      ) WHERE id=$1 AND NOT ($2 = ANY(registered_apps))`,
      [req.user!.id, appName]
    );
    res.json({ success: true });
  } catch (e) { console.error(e); res.status(500).json({ success: false, message: 'Failed' }); }
});

r.delete('/', authenticate, async (req: AuthRequest, res: Response) => {
  const { token } = req.body;
  try {
    await pool.query('DELETE FROM push_tokens WHERE user_id=$1 AND token=$2', [req.user!.id, token]);
    res.json({ success: true });
  } catch { res.status(500).json({ success: false, message: 'Failed' }); }
});

export default r;
