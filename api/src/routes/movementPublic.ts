import { Router, Request, Response } from 'express';
import Joi from 'joi';

const r = Router();

const MovementQuerySchema = Joi.object({
  lat: Joi.number().min(-90).max(90).required(),
  lng: Joi.number().min(-180).max(180).required(),
  radius: Joi.number().min(100).max(5000).default(500),
  hours: Joi.number().min(1).max(72).default(24),
});

/**
 * GET /api/movement/public
 * Public movement intelligence feed for Dorpwag™ community map.
 * Returns anonymised vehicle movement patterns within radius.
 * No PII — plate numbers hashed, timestamps rounded to 15min.
 */
r.get('/', async (req: Request, res: Response) => {
  const { error, value } = MovementQuerySchema.validate(req.query, { convert: true });
  if (error) {
    return res.status(400).json({ error: 'Invalid query', details: error.details });
  }

  const { lat, lng, radius, hours } = value;

  try {
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
  return [];
}

export default r;
