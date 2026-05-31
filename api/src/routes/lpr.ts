/**
 * Dorpwag™ Hikvision ISAPI + Snipr LPR Routes
 * Platinum-only — HOA Admin access required
 */
import { Router, Request, Response } from 'express';
import { authenticate as requireAuth } from '../middleware/auth';
import { requireTier } from '../middleware/requireTier';
import { db } from '../db';

const router = Router();

// All LPR routes require platinum + admin role
router.use(requireAuth);
router.use(requireTier('platinum'));

// ── Hikvision Cameras ────────────────────────────────────
router.get('/hikvision/cameras', async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;
    const cameras = await db.query(
      'SELECT * FROM lpr_cameras WHERE community_id = (SELECT community_id FROM users WHERE id = $1) ORDER BY created_at DESC',
      [userId]
    );
    res.json(cameras.rows);
  } catch (e) {
    res.status(500).json({ error: 'Failed to fetch cameras' });
  }
});

router.post('/hikvision/cameras', async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;
    const { name, ip, port, username, password, location } = req.body;
    const result = await db.query(
      `INSERT INTO lpr_cameras (community_id, name, ip, port, username, password, location, source)
       VALUES ((SELECT community_id FROM users WHERE id = $1), $2, $3, $4, $5, $6, $7, 'hikvision')
       RETURNING *`,
      [userId, name, ip, port || 80, username, password, location]
    );
    res.json(result.rows[0]);
  } catch (e) {
    res.status(500).json({ error: 'Failed to add camera' });
  }
});

router.get('/hikvision/events', async (req: Request, res: Response) => {
  try {
    const { cameraId, limit = 50 } = req.query;
    const events = await db.query(
      'SELECT * FROM lpr_events WHERE camera_id = $1 ORDER BY timestamp DESC LIMIT $2',
      [cameraId, limit]
    );
    res.json(events.rows);
  } catch (e) {
    res.status(500).json({ error: 'Failed to fetch events' });
  }
});

// ── Snipr Mobile Scan ────────────────────────────────────
router.post('/snipr/scan', async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;
    const { plate, imageBase64, location } = req.body;

    // Check watchlist
    const watchlistCheck = await db.query(
      'SELECT * FROM lpr_watchlist WHERE plate = $1 AND community_id = (SELECT community_id FROM users WHERE id = $2)',
      [plate.toUpperCase(), userId]
    );
    const isWatchlisted = watchlistCheck.rows.length > 0;

    // Log scan
    const scan = await db.query(
      `INSERT INTO lpr_events (community_id, plate, source, location, is_watchlisted, watchlist_reason, scanned_by)
       VALUES ((SELECT community_id FROM users WHERE id = $1), $2, 'snipr', $3, $4, $5, $1)
       RETURNING *`,
      [userId, plate.toUpperCase(), location, isWatchlisted, watchlistCheck.rows[0]?.reason || null]
    );

    // If watchlisted — trigger alert
    if (isWatchlisted) {
      await db.query(
        `INSERT INTO alerts (community_id, type, message, severity, metadata)
         VALUES ((SELECT community_id FROM users WHERE id = $1), 'lpr_hit', $2, 'high', $3)`,
        [userId, `Waglys voertuig bespeur: ${plate}`, JSON.stringify({ plate, location, source: 'snipr' })]
      );
    }

    res.json({ ...scan.rows[0], isWatchlisted, watchlistReason: watchlistCheck.rows[0]?.reason });
  } catch (e) {
    res.status(500).json({ error: 'Scan failed' });
  }
});

// ── Watchlist ────────────────────────────────────────────
router.get('/watchlist', async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;
    const list = await db.query(
      'SELECT * FROM lpr_watchlist WHERE community_id = (SELECT community_id FROM users WHERE id = $1) ORDER BY created_at DESC',
      [userId]
    );
    res.json(list.rows);
  } catch (e) {
    res.status(500).json({ error: 'Failed to fetch watchlist' });
  }
});

router.post('/watchlist', async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;
    const { plate, reason } = req.body;
    await db.query(
      `INSERT INTO lpr_watchlist (community_id, plate, reason, added_by)
       VALUES ((SELECT community_id FROM users WHERE id = $1), $2, $3, $1)
       ON CONFLICT (community_id, plate) DO UPDATE SET reason = $3`,
      [userId, plate.toUpperCase(), reason]
    );
    res.json({ success: true });
  } catch (e) {
    res.status(500).json({ error: 'Failed to add to watchlist' });
  }
});

router.delete('/watchlist/:plate', async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;
    await db.query(
      'DELETE FROM lpr_watchlist WHERE plate = $1 AND community_id = (SELECT community_id FROM users WHERE id = $2)',
      [req.params.plate.toUpperCase(), userId]
    );
    res.json({ success: true });
  } catch (e) {
    res.status(500).json({ error: 'Failed to remove from watchlist' });
  }
});

// ── Check plate ──────────────────────────────────────────
router.get('/check/:plate', async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;
    const plate = req.params.plate.toUpperCase();
    const [watchlist, residents] = await Promise.all([
      db.query(
        'SELECT * FROM lpr_watchlist WHERE plate = $1 AND community_id = (SELECT community_id FROM users WHERE id = $2)',
        [plate, userId]
      ),
      db.query(
        'SELECT * FROM resident_vehicles WHERE plate = $1 AND community_id = (SELECT community_id FROM users WHERE id = $2)',
        [plate, userId]
      ),
    ]);
    res.json({
      isWatchlisted: watchlist.rows.length > 0,
      reason: watchlist.rows[0]?.reason,
      isResident: residents.rows.length > 0,
    });
  } catch (e) {
    res.status(500).json({ error: 'Check failed' });
  }
});

// ── Recent scans ─────────────────────────────────────────
router.get('/scans', async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;
    const { limit = 100 } = req.query;
    const scans = await db.query(
      'SELECT * FROM lpr_events WHERE community_id = (SELECT community_id FROM users WHERE id = $1) ORDER BY timestamp DESC LIMIT $2',
      [userId, limit]
    );
    res.json(scans.rows);
  } catch (e) {
    res.status(500).json({ error: 'Failed to fetch scans' });
  }
});

// ── HOA Admin Stats ──────────────────────────────────────
router.get('/hoa/stats', async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;
    const [residents, alerts, scansToday, watchlistHits, patrols] = await Promise.all([
      db.query('SELECT COUNT(*) FROM users WHERE community_id = (SELECT community_id FROM users WHERE id = $1)', [userId]),
      db.query('SELECT COUNT(*) FROM alerts WHERE community_id = (SELECT community_id FROM users WHERE id = $1) AND resolved = false', [userId]),
      db.query("SELECT COUNT(*) FROM lpr_events WHERE community_id = (SELECT community_id FROM users WHERE id = $1) AND timestamp > NOW() - INTERVAL '24 hours'", [userId]),
      db.query("SELECT COUNT(*) FROM lpr_events WHERE community_id = (SELECT community_id FROM users WHERE id = $1) AND is_watchlisted = true AND timestamp > NOW() - INTERVAL '24 hours'", [userId]),
      db.query("SELECT COUNT(*) FROM patrols WHERE community_id = (SELECT community_id FROM users WHERE id = $1) AND status = 'active'", [userId]),
    ]);
    res.json({
      totalResidents: parseInt(residents.rows[0].count),
      activeAlerts: parseInt(alerts.rows[0].count),
      lprScansToday: parseInt(scansToday.rows[0].count),
      watchlistHits: parseInt(watchlistHits.rows[0].count),
      patrolsActive: parseInt(patrols.rows[0].count),
    });
  } catch (e) {
    res.status(500).json({ error: 'Failed to fetch stats' });
  }
});

router.get('/hoa/alerts', async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;
    const { limit = 20 } = req.query;
    const alerts = await db.query(
      'SELECT * FROM alerts WHERE community_id = (SELECT community_id FROM users WHERE id = $1) ORDER BY created_at DESC LIMIT $2',
      [userId, limit]
    );
    res.json({ alerts: alerts.rows });
  } catch (e) {
    res.status(500).json({ error: 'Failed to fetch alerts' });
  }
});

export default router;
