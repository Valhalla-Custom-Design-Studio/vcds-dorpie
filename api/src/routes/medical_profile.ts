import { Router, Response } from 'express';
import { pool } from '../db/pool';
import { authenticate, AuthRequest } from '../middleware/auth';

const r = Router();

/**
 * GET /api/profile/medical
 * Returns the authenticated user's medical profile.
 * Returns empty object if not yet set.
 */
r.get('/', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const { rows } = await pool.query(
      'SELECT * FROM user_medical_profiles WHERE user_id = $1',
      [req.user!.id]
    );
    res.json({ success: true, data: rows[0] || null });
  } catch (err) {
    console.error('[medical-profile] GET error:', err);
    res.status(500).json({ success: false, message: 'Failed to fetch medical profile' });
  }
});

/**
 * PUT /api/profile/medical
 * Upserts the authenticated user's medical profile.
 * All fields optional — only provided fields are updated.
 */
r.put('/', authenticate, async (req: AuthRequest, res: Response) => {
  const {
    blood_type,
    allergies,
    medical_conditions,
    current_medications,
    doctor_name,
    doctor_phone,
    medical_aid_name,
    medical_aid_number,
    emergency_notes,
  } = req.body;

  try {
    const { rows } = await pool.query(
      `INSERT INTO user_medical_profiles (
        user_id, blood_type, allergies, medical_conditions, current_medications,
        doctor_name, doctor_phone, medical_aid_name, medical_aid_number, emergency_notes
      ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)
      ON CONFLICT (user_id) DO UPDATE SET
        blood_type          = COALESCE($2, user_medical_profiles.blood_type),
        allergies           = COALESCE($3, user_medical_profiles.allergies),
        medical_conditions  = COALESCE($4, user_medical_profiles.medical_conditions),
        current_medications = COALESCE($5, user_medical_profiles.current_medications),
        doctor_name         = COALESCE($6, user_medical_profiles.doctor_name),
        doctor_phone        = COALESCE($7, user_medical_profiles.doctor_phone),
        medical_aid_name    = COALESCE($8, user_medical_profiles.medical_aid_name),
        medical_aid_number  = COALESCE($9, user_medical_profiles.medical_aid_number),
        emergency_notes     = COALESCE($10, user_medical_profiles.emergency_notes),
        updated_at          = NOW()
      RETURNING *`,
      [
        req.user!.id,
        blood_type || null,
        allergies || null,
        medical_conditions || null,
        current_medications || null,
        doctor_name || null,
        doctor_phone || null,
        medical_aid_name || null,
        medical_aid_number || null,
        emergency_notes || null,
      ]
    );
    res.json({ success: true, data: rows[0] });
  } catch (err) {
    console.error('[medical-profile] PUT error:', err);
    res.status(500).json({ success: false, message: 'Failed to save medical profile' });
  }
});

/**
 * DELETE /api/profile/medical
 * Clears the authenticated user's medical profile.
 */
r.delete('/', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    await pool.query('DELETE FROM user_medical_profiles WHERE user_id = $1', [req.user!.id]);
    res.json({ success: true, message: 'Medical profile cleared' });
  } catch (err) {
    console.error('[medical-profile] DELETE error:', err);
    res.status(500).json({ success: false, message: 'Failed to clear medical profile' });
  }
});

export default r;
