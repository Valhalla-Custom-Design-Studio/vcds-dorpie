import { pool } from '../db/pool';
import { sendBulkSMS, sendExpoPush } from '../services/NotificationService';

/**
 * DeadMan™ Cron — runs every 60 seconds on Render
 * Checks all active guardian sessions for missed pings
 * Escalates to emergency contacts if threshold exceeded
 */
export async function runDeadManCheck() {
  try {
    const { rows: overdue } = await pool.query(`
      SELECT 
        gs.id, gs.user_id, gs.ping_interval_minutes, gs.last_ping_at,
        gs.escalation_count, gs.escalation_level,
        u.name, u.email,
        EXTRACT(EPOCH FROM (NOW() - gs.last_ping_at)) / 60 AS minutes_since_ping
      FROM guardian_sessions gs
      JOIN users u ON u.id = gs.user_id
      WHERE gs.is_active = true
        AND gs.last_ping_at < NOW() - (gs.ping_interval_minutes * INTERVAL '1 minute')
        AND (gs.escalation_level IS NULL OR gs.escalation_level < 3)
    `);

    for (const session of overdue) {
      const minutesOverdue = Math.floor(session.minutes_since_ping - session.ping_interval_minutes);
      const newLevel = Math.min(3, (session.escalation_level || 0) + 1);

      const { rows: contacts } = await pool.query(`
        SELECT name, phone, push_token FROM sos_trusted_contacts 
        WHERE user_id = $1 AND is_active = true
        ORDER BY is_primary DESC
      `, [session.user_id]);

      const { rows: tokens } = await pool.query(
        'SELECT token FROM push_tokens WHERE user_id = $1',
        [session.user_id]
      );

      const pushTokens = tokens.map((t: any) => t.token);
      const contactList = contacts.map((c: any) => ({ name: c.name, phone: c.phone, pushToken: c.push_token }));

      let alertTitle = '';
      let alertBody = '';
      let smsText = '';

      if (newLevel === 1) {
        alertTitle = '⚠️ Dorpwag™ — Geen Aanmelding';
        alertBody = `${session.name} het nie aangemeld nie (${minutesOverdue} min laat).`;
        smsText = `⚠️ DORPWAG™: ${session.name} het nie aangemeld nie (${minutesOverdue} min laat). Kontroleer asseblief.`;
      } else if (newLevel === 2) {
        alertTitle = '🚨 Dorpwag™ — DRINGENDE WAARSKUWING';
        alertBody = `${session.name} het STEEDS nie aangemeld nie. Dringende aksie benodig!`;
        smsText = `🚨 DORPWAG™ DRINGEND: ${session.name} reageer nie. Kontak onmiddellik of skakel 10111.`;
      } else {
        alertTitle = '🆘 Dorpwag™ — NOODGEVAL';
        alertBody = `${session.name} — NOODGEVAL. Laaste bekende posisie gestuur.`;
        smsText = `🆘 DORPWAG™ NOODGEVAL: ${session.name} reageer nie. Skakel 10111 onmiddellik!`;
        await pool.query(
          `INSERT INTO sos_events(user_id, message, source, trigger_method, source_app)
           VALUES($1, 'Auto-triggered: Dead Man Switch expired', 'deadman_cron', 'automatic', 'dorpwag')`,
          [session.user_id]
        );
      }

      await Promise.allSettled([
        sendBulkSMS(contactList, smsText),
        sendExpoPush(pushTokens, alertTitle, alertBody, { type: 'deadman_alert', userId: session.user_id, level: newLevel }, 'dorpwag-emergency'),
      ]);

      await pool.query(
        `UPDATE guardian_sessions SET escalation_level = $1, escalation_count = escalation_count + 1, last_escalation_at = NOW() WHERE id = $2`,
        [newLevel, session.id]
      );

      await pool.query(
        `INSERT INTO notification_log(user_id, title, body, type, target_app, status) VALUES($1, $2, $3, 'deadman_escalation', 'dorpwag', 'sent')`,
        [session.user_id, alertTitle, alertBody]
      );
    }

    if (overdue.length > 0) {
      console.log(`[DeadMan] Processed ${overdue.length} overdue sessions`);
    }
  } catch (err) {
    console.error('[DeadMan Cron] Error:', err);
  }
}

/**
 * Movement Anomaly Check — runs every 5 minutes
 * Alerts users who haven't checked in for 4+ hours
 */
export async function runMovementAnomalyCheck() {
  try {
    const { rows: anomalies } = await pool.query(`
      SELECT DISTINCT mc.user_id, u.name,
        MAX(mc.created_at) as last_checkin,
        EXTRACT(EPOCH FROM (NOW() - MAX(mc.created_at))) / 3600 AS hours_since
      FROM movement_checkins mc
      JOIN users u ON u.id = mc.user_id
      WHERE mc.created_at > NOW() - INTERVAL '7 days'
      GROUP BY mc.user_id, u.name
      HAVING EXTRACT(EPOCH FROM (NOW() - MAX(mc.created_at))) / 3600 > 4
        AND mc.user_id NOT IN (
          SELECT user_id FROM guardian_sessions WHERE is_active = true
        )
    `);

    for (const anomaly of anomalies) {
      const { rows: recentAlert } = await pool.query(
        `SELECT id FROM notification_log WHERE user_id = $1 AND type = 'movement_anomaly' AND created_at > NOW() - INTERVAL '4 hours'`,
        [anomaly.user_id]
      );
      if (recentAlert.length > 0) continue;

      const { rows: tokens } = await pool.query('SELECT token FROM push_tokens WHERE user_id = $1', [anomaly.user_id]);
      const pushTokens = tokens.map((t: any) => t.token);

      if (pushTokens.length > 0) {
        await sendExpoPush(
          pushTokens,
          '🧠 Bewegings-DNA™ Herinnering',
          `Jy het nie in ${Math.floor(anomaly.hours_since)} uur aangemeld nie. Alles reg?`,
          { type: 'movement_reminder', userId: anomaly.user_id },
          'dorpwag-general'
        );
        await pool.query(
          `INSERT INTO notification_log(user_id, title, body, type, target_app, status) VALUES($1, '🧠 Bewegings-DNA™', 'Herinnering gestuur', 'movement_anomaly', 'dorpwag', 'sent')`,
          [anomaly.user_id]
        );
      }
    }
  } catch (err) {
    console.error('[Movement Anomaly Cron] Error:', err);
  }
}

// Legacy export alias
export const runDeadManCron = runDeadManCheck;
