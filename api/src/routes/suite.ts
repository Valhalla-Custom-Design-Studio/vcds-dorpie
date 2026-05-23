import { Router, Request, Response } from 'express';
import { pool } from '../db/pool';
import { authenticate, AuthRequest } from '../middleware/auth';
import { EmergencyHubService } from '../services/EmergencyHubService';

const suiteRouter = Router();
const hub = new EmergencyHubService(pool);

// ─── EMERGENCY ────────────────────────────────────────────────────────────────

// POST /suite/emergency/publish — publish SOS from any app
suiteRouter.post('/emergency/publish', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const { suiteUserId, sourceApp, category, severity, triggerMethod, location, message, metadata } = req.body;
    if (!suiteUserId || !sourceApp || !category || !severity) {
      res.status(400).json({ error: 'suiteUserId, sourceApp, category, severity required' });
      return;
    }
    const result = await hub.publishSOS({ suiteUserId, sourceApp, category, severity, triggerMethod, location, message, metadata });
    res.json(result);
  } catch (err) {
    console.error('SOS publish error:', err);
    res.status(500).json({ error: 'Failed to publish SOS' });
  }
});

// GET /suite/emergency/:suiteAlertId — get alert status
suiteRouter.get('/emergency/:suiteAlertId', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const { suiteAlertId } = req.params;
    const alert = await pool.query(
      `SELECT sa.*, su.name as sender_name,
              json_agg(DISTINCT jsonb_build_object(
                'responderId', sar.responder_id, 'response', sar.response,
                'responseApp', sar.response_app, 'at', sar.created_at
              )) FILTER (WHERE sar.id IS NOT NULL) as responses,
              COUNT(DISTINCT sad.id) FILTER (WHERE sad.status = 'sent') as dispatched_count
       FROM suite_alerts sa
       JOIN suite_users su ON su.id = sa.suite_user_id
       LEFT JOIN suite_alert_responses sar ON sar.suite_alert_id = sa.id
       LEFT JOIN suite_alert_dispatches sad ON sad.suite_alert_id = sa.id
       WHERE sa.id = $1
       GROUP BY sa.id, su.name`,
      [suiteAlertId]
    );
    if (!alert.rows.length) { res.status(404).json({ error: 'Alert not found' }); return; }
    res.json(alert.rows[0]);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch alert' });
  }
});

// POST /suite/emergency/:suiteAlertId/respond
suiteRouter.post('/emergency/:suiteAlertId/respond', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const { suiteAlertId } = req.params;
    const { response, responseApp } = req.body;
    const suiteUserId = req.user?.suiteUserId || req.user?.id;
    if (!response || !responseApp || !suiteUserId) {
      res.status(400).json({ error: 'response, responseApp, suiteUserId required' });
      return;
    }
    await hub.respondToAlert(suiteAlertId, suiteUserId, responseApp, response);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Failed to record response' });
  }
});

// POST /suite/emergency/:suiteAlertId/resolve
suiteRouter.post('/emergency/:suiteAlertId/resolve', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const { suiteAlertId } = req.params;
    const suiteUserId = req.user?.suiteUserId || req.user?.id;
    await hub.resolveAlert(suiteAlertId, suiteUserId!);
    res.json({ success: true, message: 'Alert resolved. All clear sent to all notified users.' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to resolve alert' });
  }
});

// GET /suite/emergency/feed — recent alerts for authenticated user
suiteRouter.get('/emergency/feed', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const suiteUserId = req.user?.suiteUserId || req.user?.id;
    const feed = await hub.getAlertFeed(suiteUserId!, 20);
    res.json(feed);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch feed' });
  }
});

// ─── LINKS ────────────────────────────────────────────────────────────────────

// POST /suite/links/request
suiteRouter.post('/links/request', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const { toEmail, relationship, bidirectional } = req.body;
    const fromUserId = req.user?.suiteUserId || req.user?.id;
    if (!toEmail || !relationship || !fromUserId) {
      res.status(400).json({ error: 'toEmail and relationship required' });
      return;
    }
    const requestId = await hub.requestLink(fromUserId, toEmail, relationship, bidirectional ?? true);
    res.json({ requestId, message: 'Link request sent. Awaiting approval.' });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Failed to send link request';
    res.status(400).json({ error: msg });
  }
});

// POST /suite/links/approve
suiteRouter.post('/links/approve', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const { requestId } = req.body;
    const approverId = req.user?.suiteUserId || req.user?.id;
    await hub.approveLink(requestId, approverId!);
    res.json({ success: true, message: 'Link approved. Emergency notifications now active.' });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Failed to approve link';
    res.status(400).json({ error: msg });
  }
});

// GET /suite/links — list all active links
suiteRouter.get('/links', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const suiteUserId = req.user?.suiteUserId || req.user?.id;
    const links = await pool.query(
      `SELECT sel.*, su.name as linked_name, su.email as linked_email,
              array_agg(DISTINCT sam.app_name) as linked_apps
       FROM suite_emergency_links sel
       JOIN suite_users su ON su.id = sel.to_user_id
       LEFT JOIN suite_app_memberships sam ON sam.suite_user_id = sel.to_user_id
       WHERE sel.from_user_id = $1 AND sel.is_active = true
       GROUP BY sel.id, su.name, su.email
       ORDER BY sel.priority ASC`,
      [suiteUserId]
    );
    res.json(links.rows);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch links' });
  }
});

// DELETE /suite/links/:linkId
suiteRouter.delete('/links/:linkId', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const { linkId } = req.params;
    const suiteUserId = req.user?.suiteUserId || req.user?.id;
    await pool.query(
      'UPDATE suite_emergency_links SET is_active = false WHERE id = $1 AND from_user_id = $2',
      [linkId, suiteUserId]
    );
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Failed to remove link' });
  }
});

// ─── PUSH TOKEN REGISTRATION ──────────────────────────────────────────────────
suiteRouter.post('/push-token', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const { token, appName, deviceType } = req.body;
    const suiteUserId = req.user?.suiteUserId || req.user?.id;
    if (!token || !appName) { res.status(400).json({ error: 'token and appName required' }); return; }
    await pool.query(
      `INSERT INTO suite_push_tokens (suite_user_id, app_name, token, device_type, last_used_at)
       VALUES ($1,$2,$3,$4,NOW())
       ON CONFLICT (token) DO UPDATE SET last_used_at = NOW(), is_active = true`,
      [suiteUserId, appName, token, deviceType || 'android']
    );
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Failed to register push token' });
  }
});

export default suiteRouter;
