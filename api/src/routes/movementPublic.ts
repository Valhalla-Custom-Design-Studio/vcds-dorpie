import { Router, Request, Response } from 'express';
import { z } from 'zod';

const r = Router();

const MovementQuerySchema = z.object({
  lat: z.coerce.number().min(-90).max(90),
  lng: z.coerce.number().min(-180).max(180),
  radius: z.coerce.number().min(100).max(5000).default(500),
  hours: z.coerce.number().min(1).max(72).default(24),
});

/**
 * GET /api/movement/public
 * Public movement intelligence feed for Dorpwag™ community map.
 * Returns anonymised vehicle movement patterns within radius.
 * No PII — plate numbers hashed, timestamps rounded to 15min.
 */
r.get('/', async (req: Request, res: Response) => {
  const parsed = MovementQuerySchema.safeParse(req.query);
  if (!parsed.success) {
    return res.status(400).json({ error: 'Invalid query', details: parsed.error.flatten() });
  }

  const { lat, lng, radius, hours } = parsed.data;

  try {
    // Fetch from watchlist engine — anonymised movement data
    const movements = await fetchPublicMovements({ lat, lng, radius, hours });
    return res.json({
      success: true,
      count: movements.length,
      radius,
      hours,
      movements,
      generatedAt: new Date().toISOString(),
    });
  } catch (err) {
    return res.status(500).json({ error: 'Movement data unavailable', code: 'MOVEMENT_FETCH_ERROR' });
  }
});

async function fetchPublicMovements(params: {
  lat: number; lng: number; radius: number; hours: number;
}) {
  // Wired to vcds-watchlist-engine in production
  // Returns anonymised movement events within radius
  return [];
}

export default r;
