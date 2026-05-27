import { Router, Request, Response } from 'express';
import { authenticate } from '../middleware/auth';
import { pool } from '../db/pool';

const router = Router();

// GET /api/lpr/feed — live plate scan feed
router.get('/feed', authenticate, async (req: Request, res: Response) => {
  try {
    const limit = parseInt(req.query.limit as string) || 50;
    const result = await pool.query(
      `SELECT id, plate, timestamp, camera_id, camera_name, location, flagged, flag_reason, confidence
       FROM lpr_scans
       ORDER BY timestamp DESC
       LIMIT $1`,
      [limit]
    );
    const watchlistResult = await pool.query('SELECT plate FROM lpr_watchlist');
    const watchlistPlates = new Set(watchlistResult.rows.map((r: any) => r.plate));
    const entries = result.rows.map((row: any) => ({
      ...row,
      flagged: row.flagged || watchlistPlates.has(row.plate),
      flagReason: watchlistPlates.has(row.plate) ? 'On community watchlist' : row.flag_reason,
    }));
    res.json({ entries });
  } catch (err) {
    console.error('LPR feed error:', err);
    res.status(500).json({ error: 'Failed to fetch LPR feed' });
  }
});

// GET /api/lpr/watchlist — community watchlist
router.get('/watchlist', authenticate, async (req: Request, res: Response) => {
  try {
    const result = await pool.query(
      `SELECT plate, reason, added_at, added_by FROM lpr_watchlist ORDER BY added_at DESC`
    );
    res.json({ plates: result.rows });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch watchlist' });
  }
});

// POST /api/lpr/watchlist — add plate to watchlist
router.post('/watchlist', authenticate, async (req: Request, res: Response) => {
  const { plate, reason } = req.body;
  const userId = (req as any).user?.id;
  if (!plate || !reason) return res.status(400).json({ error: 'plate and reason required' });
  try {
    await pool.query(
      `INSERT INTO lpr_watchlist (plate, reason, added_by, added_at)
       VALUES ($1, $2, $3, NOW())
       ON CONFLICT (plate) DO UPDATE SET reason = $2, added_by = $3, added_at = NOW()`,
      [plate.toUpperCase(), reason, userId]
    );
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Failed to add to watchlist' });
  }
});

// POST /api/lpr/report — report a plate sighting
router.post('/report', authenticate, async (req: Request, res: Response) => {
  const { plate, reportedBy } = req.body;
  if (!plate) return res.status(400).json({ error: 'plate required' });
  try {
    await pool.query(
      `INSERT INTO lpr_community_reports (plate, reported_by, created_at) VALUES ($1, $2, NOW())`,
      [plate.toUpperCase(), reportedBy]
    );
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Failed to report plate' });
  }
});

export default router;
