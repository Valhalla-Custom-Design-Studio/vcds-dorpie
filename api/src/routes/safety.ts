// KAN-22 — Safety Router (Ouma fall detection pattern + Dorpwag community safety checks)
import { Router, Request, Response } from 'express';
import { pool } from '../db/pool';
import { authenticate, AuthRequest } from '../middleware/auth';
const r = Router();

r.get('/health', (_req: Request, res: Response) => {
  res.json({ success: true, service: 'Dorpwag\u2122 Safety Module', status: 'operational', ts: new Date().toISOString() });
});

r.get('/stats', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const u = await pool.query('SELECT town_id FROM users WHERE id=$1', [req.user!.id]);
    const tId = u.rows[0]?.town_id;
    const [activeSOS, activeGuardians, recentAlerts] = await Promise.all([
      pool.query("SELECT COUNT(*) FROM sos_events WHERE status='active' AND created_at > NOW()-INTERVAL '24 hours'"),
      pool.query("SELECT COUNT(*) FROM guardian_sessions gs JOIN users u ON u.id=gs.user_id WHERE gs.is_active=true AND u.town_id=$1", [tId]),
      pool.query("SELECT COUNT(*) FROM emergency_alerts WHERE town_id=$1 AND created_at > NOW()-INTERVAL '24 hours'", [tId]),
    ]);
    res.json({ success: true, data: {
      activeSOS: Number(activeSOS.rows[0].count),
      activeGuardians: Number(activeGuardians.rows[0].count),
      recentAlerts: Number(recentAlerts.rows[0].count),
      ts: new Date().toISOString(),
    }});
  } catch(e) { res.status(500).json({ success: false, message: 'Failed' }); }
});

r.post('/escalate', authenticate, async (req: AuthRequest, res: Response) => {
  const { sosEventId, reason } = req.body;
  if (!sosEventId) { res.status(400).json({ success: false, message: 'sosEventId required' }); return; }
  try {
    const { rows } = await pool.query(
      "UPDATE sos_events SET alert_level='red',escalation_attempts=escalation_attempts+1,last_escalation_at=NOW(),notes=CONCAT(notes,' ',COALESCE($1,'')) WHERE id=$2 AND user_id=$3 RETURNING *",
      [reason, sosEventId, req.user!.id]
    );
    if (!rows.length) { res.status(404).json({ success: false, message: 'SOS event not found' }); return; }
    res.json({ success: true, data: rows[0] });
  } catch { res.status(500).json({ success: false, message: 'Failed' }); }
});

export default r;
