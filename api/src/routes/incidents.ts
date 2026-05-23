import { Router, Request, Response } from 'express';
import { pool } from '../db/pool';
import { authenticate, AuthRequest } from '../middleware/auth';
import Joi from 'joi';

export const incidentsRouter = Router();

const incidentSchema = Joi.object({
  areaId: Joi.string().uuid().optional(),
  type: Joi.string().valid('theft','suspicious','assault','vandalism','fire','medical','other').required(),
  severity: Joi.string().valid('low','medium','high','critical').default('medium'),
  title: Joi.string().min(5).max(200).required(),
  description: Joi.string().max(2000).optional(),
  address: Joi.string().max(500).optional(),
  lat: Joi.number().optional(),
  lng: Joi.number().optional(),
});

// Get all active incidents (public)
incidentsRouter.get('/', async (req: Request, res: Response) => {
  try {
    const result = await pool.query(
      `SELECT i.*, a.name as area_name, a.name_af as area_name_af,
        u.first_name || ' ' || u.last_name AS reporter_name
       FROM incidents i
       LEFT JOIN areas a ON i.area_id = a.id
       JOIN users u ON i.reporter_id = u.id
       WHERE i.status = 'active'
       ORDER BY i.created_at DESC LIMIT 50`
    );
    res.json({ success: true, incidents: result.rows });
  } catch { res.status(500).json({ success: false, message: 'Failed to fetch incidents' }); }
});

// Report incident (authenticated)
incidentsRouter.post('/', authenticate, async (req: AuthRequest, res: Response) => {
  const { error, value } = incidentSchema.validate(req.body);
  if (error) { res.status(400).json({ success: false, message: error.details[0].message }); return; }
  try {
    const result = await pool.query(
      'INSERT INTO incidents (reporter_id, area_id, type, severity, title, description, address, lat, lng) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9) RETURNING *',
      [req.user!.id, value.areaId, value.type, value.severity, value.title, value.description, value.address, value.lat, value.lng]
    );
    res.status(201).json({ success: true, incident: result.rows[0] });
  } catch { res.status(500).json({ success: false, message: 'Report failed' }); }
});

// Resolve incident
incidentsRouter.patch('/:id/resolve', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const result = await pool.query(
      "UPDATE incidents SET status='resolved', resolved_at=NOW(), updated_at=NOW() WHERE id=$1 AND reporter_id=$2 RETURNING *",
      [req.params.id, req.user!.id]
    );
    if (!result.rows.length) { res.status(404).json({ success: false, message: 'Not found or not your incident' }); return; }
    res.json({ success: true, incident: result.rows[0] });
  } catch { res.status(500).json({ success: false, message: 'Resolve failed' }); }
});
