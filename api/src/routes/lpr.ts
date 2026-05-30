import { Router, Request, Response } from 'express';
import { authenticate } from '../middleware/auth';
import { pool } from '../db/pool';

const router = Router();

// GET /api/lpr/feed — live plate scan feed
router.get('/feed', authenticate, async (req: Request, res: Response) => {
  try {
    const limit = parseInt(req.query.limit as string) || 50;
    const result = await pool.query(
      `SELECT id, plate, timestamp, camera_id, camera_name, location, flagged, flag_reason, confidence, image_url
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
      flagReason: watchlistPlates.has(row.plate) ? 'Op gemeenskap waglyslys' : row.flag_reason,
    }));
    res.json({ entries });
  } catch (err) {
    console.error('LPR feed error:', err);
    res.status(500).json({ error: 'Failed to fetch LPR feed' });
  }
});

// GET /api/lpr/watchlist
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

// POST /api/lpr/watchlist — add plate
router.post('/watchlist', authenticate, async (req: Request, res: Response) => {
  const { plate, reason } = req.body;
  const userId = (req as any).user?.id;
  if (!plate || !reason) return res.status(400).json({ error: 'plate and reason required' });
  try {
    await pool.query(
      `INSERT INTO lpr_watchlist (plate, reason, added_by, added_at)
       VALUES ($1, $2, $3, NOW())
       ON CONFLICT (plate) DO UPDATE SET reason = $2, added_by = $3, added_at = NOW()`,
      [plate.toUpperCase().replace(/\s/g, ''), reason, userId]
    );
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Failed to add to watchlist' });
  }
});

// DELETE /api/lpr/watchlist/:plate
router.delete('/watchlist/:plate', authenticate, async (req: Request, res: Response) => {
  try {
    await pool.query('DELETE FROM lpr_watchlist WHERE plate = $1', [req.params.plate.toUpperCase()]);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Failed to remove from watchlist' });
  }
});

// POST /api/lpr/report — community report
router.post('/report', authenticate, async (req: Request, res: Response) => {
  const { plate, reportedBy, location, note } = req.body;
  if (!plate) return res.status(400).json({ error: 'plate required' });
  try {
    await pool.query(
      `INSERT INTO lpr_community_reports (plate, reported_by, location, note, created_at) 
       VALUES ($1, $2, $3, $4, NOW())`,
      [plate.toUpperCase().replace(/\s/g, ''), reportedBy, location || null, note || null]
    );
    // Check if on watchlist and alert
    const { rows: watchlistMatch } = await pool.query(
      'SELECT reason FROM lpr_watchlist WHERE plate = $1',
      [plate.toUpperCase().replace(/\s/g, '')]
    );
    res.json({ success: true, watchlistMatch: watchlistMatch.length > 0 ? watchlistMatch[0] : null });
  } catch (err) {
    res.status(500).json({ error: 'Failed to report plate' });
  }
});

// POST /api/lpr/scan-image — OCR plate from image using Google Vision API
router.post('/scan-image', authenticate, async (req: Request, res: Response) => {
  const { imageBase64 } = req.body;
  if (!imageBase64) return res.status(400).json({ error: 'imageBase64 required' });

  try {
    const apiKey = process.env.GOOGLE_VISION_API_KEY;
    if (!apiKey) return res.status(500).json({ error: 'Vision API not configured' });

    const visionRes = await fetch(
      `https://vision.googleapis.com/v1/images:annotate?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          requests: [{
            image: { content: imageBase64 },
            features: [
              { type: 'TEXT_DETECTION', maxResults: 10 },
              { type: 'OBJECT_LOCALIZATION', maxResults: 5 }
            ]
          }]
        })
      }
    );

    const visionData = await visionRes.json();
    const textAnnotations = visionData.responses?.[0]?.textAnnotations || [];

    if (!textAnnotations.length) {
      return res.json({ plate: null, confidence: 0, rawText: '' });
    }

    const rawText = textAnnotations[0]?.description || '';

    // SA plate pattern: ABC 123 GP / ABC 123 WP / etc.
    // Also handle: ABC123GP, ABC 123 GP, ABC-123-GP
    const saPlatePattern = /\b([A-Z]{2,3}[\s-]?\d{2,3}[\s-]?[A-Z]{2})\b/gi;
    const matches = rawText.replace(/\n/g, ' ').match(saPlatePattern);

    let plate = null;
    let confidence = 0;

    if (matches && matches.length > 0) {
      // Clean the plate — remove spaces and dashes, uppercase
      plate = matches[0].replace(/[\s-]/g, '').toUpperCase();
      confidence = textAnnotations[0]?.confidence || 0.85;
    } else {
      // Fallback: return cleaned raw text for manual verification
      const cleaned = rawText.replace(/\n/g, ' ').trim().toUpperCase();
      plate = cleaned.length <= 10 ? cleaned : null;
      confidence = 0.3;
    }

    // Check watchlist immediately
    let watchlistMatch = null;
    if (plate) {
      const { rows } = await pool.query(
        'SELECT reason FROM lpr_watchlist WHERE plate = $1',
        [plate]
      );
      if (rows.length > 0) watchlistMatch = rows[0];

      // Auto-save scan
      await pool.query(
        `INSERT INTO lpr_scans(plate, confidence, flagged, flag_reason, timestamp, camera_name)
         VALUES($1, $2, $3, $4, NOW(), 'Mobile Scan')`,
        [plate, confidence, !!watchlistMatch, watchlistMatch?.reason || null]
      );
    }

    res.json({ plate, confidence, rawText, watchlistMatch });
  } catch (err) {
    console.error('Vision API error:', err);
    res.status(500).json({ error: 'OCR failed' });
  }
});

// GET /api/lpr/stats — admin stats
router.get('/stats', authenticate, async (req: Request, res: Response) => {
  try {
    const [total, flagged, watchlistCount, todayScans] = await Promise.all([
      pool.query('SELECT COUNT(*) FROM lpr_scans'),
      pool.query('SELECT COUNT(*) FROM lpr_scans WHERE flagged = true'),
      pool.query('SELECT COUNT(*) FROM lpr_watchlist'),
      pool.query("SELECT COUNT(*) FROM lpr_scans WHERE timestamp > NOW() - INTERVAL '24 hours'"),
    ]);
    res.json({
      totalScans: parseInt(total.rows[0].count),
      flaggedScans: parseInt(flagged.rows[0].count),
      watchlistCount: parseInt(watchlistCount.rows[0].count),
      todayScans: parseInt(todayScans.rows[0].count),
    });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch stats' });
  }
});

export default router;
