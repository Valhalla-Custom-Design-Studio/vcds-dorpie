import { Router, Request, Response } from 'express';
import { pool } from '../db/pool';
import { requireAuth } from '../middleware/auth';

const router = Router();
const WATCHLIST_ENGINE_URL = process.env.WATCHLIST_ENGINE_URL || 'http://localhost:3100';

// ── Proxy helpers ──────────────────────────────────────────────────────────────
async function engineGet(path: string) {
  const res = await fetch(`${WATCHLIST_ENGINE_URL}${path}`, {
    headers: { 'x-internal-token': process.env.INTERNAL_TOKEN || '' },
  });
  return res.json();
}

async function enginePost(path: string, body: unknown) {
  const res = await fetch(`${WATCHLIST_ENGINE_URL}${path}`, {
    method: 'POST',
    headers: { 'x-internal-token': process.env.INTERNAL_TOKEN || '', 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  return res.json();
}

async function engineDelete(path: string) {
  const res = await fetch(`${WATCHLIST_ENGINE_URL}${path}`, {
    method: 'DELETE',
    headers: { 'x-internal-token': process.env.INTERNAL_TOKEN || '' },
  });
  return res.json();
}

// ── Admin guard: only admins/moderators ───────────────────────────────────────
async function requireAdmin(req: Request, res: Response, next: Function) {
  const userId = (req as any).userId;
  const { rows } = await pool.query(
    `SELECT role FROM users WHERE id = $1`, [userId]
  );
  if (!rows[0] || !['admin', 'moderator'].includes(rows[0].role)) {
    return res.status(403).json({ error: 'Admin only' });
  }
  next();
}

// ── PLATES ─────────────────────────────────────────────────────────────────────
router.get('/plates', requireAuth, requireAdmin, async (req, res) => {
  try {
    const data = await engineGet('/api/v1/watchlist/plates');
    res.json(data);
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

router.post('/plates', requireAuth, requireAdmin, async (req, res) => {
  try {
    const data = await enginePost('/api/v1/watchlist/plates', {
      ...req.body,
      added_by_app: 'dorpie',
      added_by_user_id: (req as any).userId,
    });
    res.json(data);
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

router.delete('/plates/:id', requireAuth, requireAdmin, async (req, res) => {
  try {
    const data = await engineDelete(`/api/v1/watchlist/plates/${req.params.id}`);
    res.json(data);
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

// ── FACES ──────────────────────────────────────────────────────────────────────
router.get('/faces', requireAuth, requireAdmin, async (req, res) => {
  try {
    const data = await engineGet('/api/v1/watchlist/faces');
    res.json(data);
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

router.post('/faces', requireAuth, requireAdmin, async (req, res) => {
  try {
    const data = await enginePost('/api/v1/watchlist/faces', {
      ...req.body,
      added_by_app: 'dorpie',
      added_by_user_id: (req as any).userId,
    });
    res.json(data);
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

router.delete('/faces/:id', requireAuth, requireAdmin, async (req, res) => {
  try {
    const data = await engineDelete(`/api/v1/watchlist/faces/${req.params.id}`);
    res.json(data);
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

// ── CAMERAS ────────────────────────────────────────────────────────────────────
router.get('/cameras', requireAuth, requireAdmin, async (req, res) => {
  try {
    const data = await engineGet('/api/v1/cameras');
    res.json(data);
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

router.post('/cameras', requireAuth, requireAdmin, async (req, res) => {
  try {
    const data = await enginePost('/api/v1/cameras', req.body);
    res.json(data);
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

// ── EVENTS (read-only log) ─────────────────────────────────────────────────────
router.get('/events', requireAuth, requireAdmin, async (req, res) => {
  try {
    const limit = req.query.limit || 50;
    const data = await engineGet(`/api/v1/watchlist/events?limit=${limit}`);
    res.json(data);
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

export default router;
