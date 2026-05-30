import { Router, Request, Response } from 'express';
import { authenticate } from '../middleware/auth';
import { pool } from '../db/pool';
import { sendExpoPush } from '../services/NotificationService';

const router = Router();

// GET /api/geofence — list user's fences
router.get('/', authenticate, async (req: Request, res: Response) => {
  const userId = (req as any).user?.id;
  try {
    const { rows } = await pool.query(
      `SELECT id, label, lat, lng, radius, active, notify_on_exit, notify_on_enter, linked_user_id, linked_user_name
       FROM geofences WHERE user_id = $1 ORDER BY created_at DESC`,
      [userId]
    );
    res.json({ fences: rows });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch geofences' });
  }
});

// POST /api/geofence — create fence
router.post('/', authenticate, async (req: Request, res: Response) => {
  const userId = (req as any).user?.id;
  const { label, lat, lng, radius, notify_on_exit, notify_on_enter, linked_user_id, linked_user_name } = req.body;
  if (!label || !lat || !lng || !radius) return res.status(400).json({ error: 'label, lat, lng, radius required' });
  try {
    const { rows } = await pool.query(
      `INSERT INTO geofences(user_id, label, lat, lng, radius, active, notify_on_exit, notify_on_enter, linked_user_id, linked_user_name, created_at)
       VALUES($1,$2,$3,$4,$5,true,$6,$7,$8,$9,NOW()) RETURNING *`,
      [userId, label, lat, lng, radius, notify_on_exit ?? true, notify_on_enter ?? false, linked_user_id || null, linked_user_name || null]
    );
    res.json({ fence: rows[0] });
  } catch (err) {
    res.status(500).json({ error: 'Failed to create geofence' });
  }
});

// PATCH /api/geofence/:id — toggle active
router.patch('/:id', authenticate, async (req: Request, res: Response) => {
  const userId = (req as any).user?.id;
  const { active } = req.body;
  try {
    await pool.query(
      'UPDATE geofences SET active = $1 WHERE id = $2 AND user_id = $3',
      [active, req.params.id, userId]
    );
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Failed to update geofence' });
  }
});

// DELETE /api/geofence/:id
router.delete('/:id', authenticate, async (req: Request, res: Response) => {
  const userId = (req as any).user?.id;
  try {
    await pool.query('DELETE FROM geofences WHERE id = $1 AND user_id = $2', [req.params.id, userId]);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete geofence' });
  }
});

// POST /api/geofence/check — called by mobile on location update to check breaches
router.post('/check', authenticate, async (req: Request, res: Response) => {
  const userId = (req as any).user?.id;
  const { lat, lng } = req.body;
  if (!lat || !lng) return res.status(400).json({ error: 'lat and lng required' });

  try {
    const { rows: fences } = await pool.query(
      `SELECT * FROM geofences WHERE active = true AND (user_id = $1 OR linked_user_id = $1)`,
      [userId]
    );

    const breaches: any[] = [];

    for (const fence of fences) {
      // Haversine distance in metres
      const R = 6371000;
      const dLat = (lat - fence.lat) * Math.PI / 180;
      const dLng = (lng - fence.lng) * Math.PI / 180;
      const a = Math.sin(dLat/2)**2 + Math.cos(fence.lat * Math.PI/180) * Math.cos(lat * Math.PI/180) * Math.sin(dLng/2)**2;
      const dist = R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));

      const wasInside = fence.last_inside ?? true;
      const isInside = dist <= fence.radius;

      if (wasInside && !isInside && fence.notify_on_exit) {
        // Exited fence
        breaches.push({ fenceId: fence.id, label: fence.label, type: 'exit', dist: Math.round(dist) });
        // Notify fence owner
        const { rows: ownerTokens } = await pool.query(
          'SELECT token FROM push_tokens WHERE user_id = $1', [fence.user_id]
        );
        for (const { token } of ownerTokens) {
          await sendExpoPush(token, `🚨 ${fence.label}`, `Persoon het die area verlaat (${Math.round(dist)}m weg)`, {});
        }
      } else if (!wasInside && isInside && fence.notify_on_enter) {
        breaches.push({ fenceId: fence.id, label: fence.label, type: 'enter', dist: Math.round(dist) });
      }

      // Update last_inside
      await pool.query('UPDATE geofences SET last_inside = $1 WHERE id = $2', [isInside, fence.id]);
    }

    res.json({ breaches, checked: fences.length });
  } catch (err) {
    console.error('Geofence check error:', err);
    res.status(500).json({ error: 'Geofence check failed' });
  }
});

export default router;
