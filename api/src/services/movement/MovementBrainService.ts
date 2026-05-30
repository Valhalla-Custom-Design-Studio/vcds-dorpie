import { pool } from '../../db/pool';
import { sendExpoPush } from '../NotificationService';

/**
 * MovementBrain™ — 7-day pattern learning engine
 * Learns user movement patterns and detects anomalies
 * Continuously improves confidence over time
 */
export class MovementBrainService {
  static async recordCheckin(userId: string, lat: number, lng: number, status: string) {
    const hour = new Date().getHours();
    const dayOfWeek = new Date().getDay();

    const { rows } = await pool.query(
      `INSERT INTO movement_checkins(user_id, lat, lng, status, is_safe)
       VALUES($1, $2, $3, $4, true) RETURNING *`,
      [userId, lat, lng, status]
    );

    // Update pattern learning (upsert) — confidence grows with each sample
    await pool.query(`
      INSERT INTO movement_patterns (user_id, expected_hour, day_of_week, expected_status, sample_count, confidence_score)
      VALUES ($1, $2, $3, $4, 1, 0.1)
      ON CONFLICT (user_id, expected_hour, day_of_week)
      DO UPDATE SET
        expected_status = CASE
          WHEN movement_patterns.sample_count >= 5 THEN $4
          ELSE movement_patterns.expected_status
        END,
        sample_count = movement_patterns.sample_count + 1,
        confidence_score = LEAST(1.0, (movement_patterns.sample_count + 1)::float / 10.0),
        updated_at = NOW()
    `, [userId, hour, dayOfWeek, status]);

    return rows[0];
  }

  static async getPatterns(userId: string) {
    const { rows } = await pool.query(
      `SELECT * FROM movement_patterns WHERE user_id = $1 AND confidence_score >= 0.3 ORDER BY expected_hour`,
      [userId]
    );
    return rows;
  }

  static async checkAnomaly(userId: string, currentStatus: string): Promise<{ isAnomaly: boolean; reason?: string; confidence?: number }> {
    const hour = new Date().getHours();
    const dayOfWeek = new Date().getDay();

    const { rows } = await pool.query(
      `SELECT * FROM movement_patterns
       WHERE user_id = $1 AND expected_hour = $2 AND day_of_week = $3 AND confidence_score >= 0.6`,
      [userId, hour, dayOfWeek]
    );

    if (rows.length === 0) return { isAnomaly: false };

    const pattern = rows[0];
    const isAnomaly = pattern.expected_status !== currentStatus;

    if (isAnomaly) {
      // Alert emergency contacts
      await MovementBrainService.alertAnomalyContacts(userId, currentStatus, pattern.expected_status, pattern.confidence_score);
    }

    return { 
      isAnomaly, 
      reason: isAnomaly ? `Expected "${pattern.expected_status}" at this time, got "${currentStatus}"` : undefined,
      confidence: pattern.confidence_score
    };
  }

  static async alertAnomalyContacts(userId: string, actualStatus: string, expectedStatus: string, confidence: number) {
    // Only alert if confidence is high enough
    if (confidence < 0.7) return;

    // Check if we already alerted in last 2 hours
    const { rows: recent } = await pool.query(`
      SELECT id FROM notification_log 
      WHERE user_id = $1 AND type = 'movement_anomaly' AND created_at > NOW() - INTERVAL '2 hours'
    `, [userId]);
    if (recent.length > 0) return;

    const { rows: user } = await pool.query('SELECT name FROM users WHERE id = $1', [userId]);
    const userName = user[0]?.name || 'Gebruiker';

    // Get push tokens for emergency contacts
    const { rows: contacts } = await pool.query(`
      SELECT push_token FROM sos_trusted_contacts 
      WHERE user_id = $1 AND is_active = true AND push_token IS NOT NULL
    `, [userId]);

    const { rows: userTokens } = await pool.query(
      'SELECT token FROM push_tokens WHERE user_id = $1', [userId]
    );

    const allTokens = [
      ...userTokens.map((t: any) => t.token),
      ...contacts.map((c: any) => c.push_token).filter(Boolean)
    ];

    if (allTokens.length > 0) {
      await sendExpoPush(
        allTokens,
        '🧠 Bewegings-DNA™ Afwyking',
        `${userName}: Ongewone bewegingspatroon bespeur. Verwag "${expectedStatus}", kry "${actualStatus}".`,
        { type: 'movement_anomaly', userId, actualStatus, expectedStatus },
        'dorpwag-general'
      );
    }

    await pool.query(`
      INSERT INTO notification_log(user_id, title, body, type, target_app, status)
      VALUES($1, '🧠 Bewegings-DNA™ Afwyking', $2, 'movement_anomaly', 'dorpwag', 'sent')
    `, [userId, `Afwyking: ${actualStatus} vs verwag ${expectedStatus}`]);
  }

  static async getHistory(userId: string, limit = 50) {
    const { rows } = await pool.query(
      `SELECT * FROM movement_checkins WHERE user_id = $1 ORDER BY created_at DESC LIMIT $2`,
      [userId, limit]
    );
    return rows;
  }

  static async getWeeklySummary(userId: string) {
    const { rows } = await pool.query(`
      SELECT 
        day_of_week,
        expected_hour,
        expected_status,
        confidence_score,
        sample_count
      FROM movement_patterns
      WHERE user_id = $1 AND confidence_score >= 0.3
      ORDER BY day_of_week, expected_hour
    `, [userId]);
    return rows;
  }
}
