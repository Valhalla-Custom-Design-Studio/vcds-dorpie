import { Pool } from 'pg';
import axios from 'axios';

export interface SosPublishPayload {
  suiteUserId: string;
  sourceApp: string;
  category: string;
  severity: 'critical' | 'high' | 'medium' | 'low';
  triggerMethod?: string;
  location?: { lat: number; lng: number; address?: string; townName?: string };
  message?: string;
  metadata?: Record<string, unknown>;
}

export interface DispatchResult {
  suiteAlertId: string;
  dispatched: { push: number; sms: number; apps: string[] };
}

// Bilingual notification templates
const TEMPLATES: Record<string, { en: { title: string; body: (name: string) => string }; af: { title: string; body: (name: string) => string } }> = {
  break_in: {
    en: { title: '🚨 EMERGENCY ALERT', body: (n) => `${n} — Possible break-in. Tap to respond.` },
    af: { title: '🚨 NOODALARM', body: (n) => `${n} — Moontlike inbraak. Tik om te reageer.` },
  },
  fall_detected: {
    en: { title: '🚨 FAMILY EMERGENCY', body: (n) => `${n} — Possible fall detected.` },
    af: { title: '🚨 FAMILIE NOODGEVAL', body: (n) => `${n} — Moontlike val bespeur.` },
  },
  panic: {
    en: { title: '🚨 PANIC ALERT', body: (n) => `${n} needs help NOW.` },
    af: { title: '🚨 PANIEK ALARM', body: (n) => `${n} het DADELIK hulp nodig.` },
  },
  medication_missed: {
    en: { title: '⚠️ MEDICATION ALERT', body: (n) => `${n} missed their medication.` },
    af: { title: '⚠️ MEDIKASIE WAARSKUWING', body: (n) => `${n} het medikasie gemis.` },
  },
  wandering_alert: {
    en: { title: '⚠️ WANDERING ALERT', body: (n) => `${n} may have wandered outside safe zone.` },
    af: { title: '⚠️ DWAAL WAARSKUWING', body: (n) => `${n} het moontlik die veilige sone verlaat.` },
  },
  inactivity_alarm: {
    en: { title: '⚠️ INACTIVITY ALARM', body: (n) => `No activity detected for ${n}.` },
    af: { title: '⚠️ ONAKTIWITEIT ALARM', body: (n) => `Geen aktiwiteit bespeur vir ${n}.` },
  },
  fire: {
    en: { title: '🔥 FIRE ALERT', body: (n) => `${n} — Fire reported nearby.` },
    af: { title: '🔥 BRAND ALARM', body: (n) => `${n} — Brand aangemeld naby.` },
  },
  guardian_lost: {
    en: { title: '🚨 GUARDIAN ALERT', body: (n) => `${n} — Guardian contact lost.` },
    af: { title: '🚨 VOOG ALARM', body: (n) => `${n} — Voogkontak verloor.` },
  },
};

// App-specific push channel mapping
const APP_CHANNELS: Record<string, string> = {
  dorpwag: 'dorpwag-emergency',
  ouma_en_oppas: 'oppas-emergency',
  oppas: 'oppas-emergency',
  default: 'vcds-emergency',
};

export class EmergencyHubService {
  constructor(private pool: Pool) {}

  async publishSOS(payload: SosPublishPayload): Promise<DispatchResult> {
    const client = await this.pool.connect();
    try {
      await client.query('BEGIN');

      // 1. Create suite alert
      const alertResult = await client.query(
        `INSERT INTO suite_alerts 
          (suite_user_id, source_app, category, severity, trigger_method, lat, lng, address, town_name, message, metadata)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)
         RETURNING id`,
        [
          payload.suiteUserId, payload.sourceApp, payload.category,
          payload.severity, payload.triggerMethod || 'manual',
          payload.location?.lat, payload.location?.lng,
          payload.location?.address, payload.location?.townName,
          payload.message, JSON.stringify(payload.metadata || {}),
        ]
      );
      const suiteAlertId = alertResult.rows[0].id;

      // 2. Get sender name
      const senderResult = await client.query(
        'SELECT name, preferred_locale FROM suite_users WHERE id = $1',
        [payload.suiteUserId]
      );
      const sender = senderResult.rows[0] || { name: 'Unknown', preferred_locale: 'af' };

      // 3. Resolve notification targets via emergency links
      const linksResult = await client.query(
        `SELECT sel.to_user_id, sel.relationship, sel.priority, sel.notify_via_apps,
                su.name as recipient_name, su.phone, su.preferred_locale
         FROM suite_emergency_links sel
         JOIN suite_users su ON su.id = sel.to_user_id
         WHERE sel.from_user_id = $1 AND sel.is_active = true
         ORDER BY sel.priority ASC`,
        [payload.suiteUserId]
      );

      const dispatched = { push: 0, sms: 0, apps: new Set<string>() };

      // 4. Dispatch by priority (P1 immediate, P2 +30s, P3 +60s)
      for (const link of linksResult.rows) {
        const locale = link.preferred_locale || 'af';
        const template = TEMPLATES[payload.category] || TEMPLATES['panic'];
        const tmpl = template[locale as 'en' | 'af'] || template.af;

        // Get push tokens for this recipient across all apps
        const tokensResult = await client.query(
          `SELECT token, app_name, device_type FROM suite_push_tokens 
           WHERE suite_user_id = $1 AND is_active = true`,
          [link.to_user_id]
        );

        for (const tokenRow of tokensResult.rows) {
          const channel = APP_CHANNELS[tokenRow.app_name] || APP_CHANNELS.default;
          const isElderlyApp = tokenRow.app_name === 'ouma_en_oppas' || tokenRow.app_name === 'oppas';

          const pushPayload = {
            to: tokenRow.token,
            channelId: channel,
            title: isElderlyApp && payload.category === 'break_in'
              ? (locale === 'af' ? '🚨 NOOD' : '🚨 EMERGENCY')
              : tmpl.title,
            body: isElderlyApp && payload.category === 'break_in'
              ? (locale === 'af' ? `${sender.name.toUpperCase()} HET HULP NODIG!` : `${sender.name.toUpperCase()} NEEDS HELP!`)
              : tmpl.body(sender.name),
            sound: 'emergency_alarm.wav',
            priority: 'high',
            data: {
              type: 'cross_app_emergency',
              suiteAlertId,
              sourceApp: payload.sourceApp,
              category: payload.category,
              severity: payload.severity,
              senderName: sender.name,
              location: payload.location,
              screen: `/emergency-alert/${suiteAlertId}`,
            },
          };

          // Send via Expo Push API
          try {
            await axios.post('https://exp.host/--/api/v2/push/send', pushPayload, {
              headers: { 'Content-Type': 'application/json' },
              timeout: 5000,
            });
            dispatched.push++;
            dispatched.apps.add(tokenRow.app_name);

            // Log dispatch
            await client.query(
              `INSERT INTO suite_alert_dispatches 
                (suite_alert_id, recipient_id, app_name, channel, push_token, priority, status, sent_at)
               VALUES ($1,$2,$3,$4,$5,$6,'sent',NOW())`,
              [suiteAlertId, link.to_user_id, tokenRow.app_name, channel, tokenRow.token, link.priority]
            );
          } catch (err) {
            await client.query(
              `INSERT INTO suite_alert_dispatches 
                (suite_alert_id, recipient_id, app_name, channel, push_token, priority, status, error)
               VALUES ($1,$2,$3,$4,$5,$6,'failed',$7)`,
              [suiteAlertId, link.to_user_id, tokenRow.app_name, channel, tokenRow.token, link.priority,
               err instanceof Error ? err.message : 'unknown']
            );
          }
        }

        // SMS via BulkSMS (if phone available and priority 1 or 2)
        if (link.phone && link.priority <= 2 && process.env.BULKSMS_TOKEN) {
          const smsBody = locale === 'af'
            ? `SUITE™ ALARM — ${sender.name}: ${payload.category.replace(/_/g, ' ')}. ${payload.location?.townName || ''} ${payload.location?.address || ''}`
            : `SUITE™ ALERT — ${sender.name}: ${payload.category.replace(/_/g, ' ')}. ${payload.location?.townName || ''} ${payload.location?.address || ''}`;

          try {
            await axios.post('https://api.bulksms.com/v1/messages', {
              to: link.phone, body: smsBody.trim()
            }, {
              auth: { username: 'vcds', password: process.env.BULKSMS_TOKEN! },
              timeout: 5000,
            });
            dispatched.sms++;
            await client.query(
              `INSERT INTO suite_alert_dispatches 
                (suite_alert_id, recipient_id, app_name, channel, phone, priority, status, sent_at)
               VALUES ($1,$2,'sms','sms',$3,$4,'sent',NOW())`,
              [suiteAlertId, link.to_user_id, link.phone, link.priority]
            );
          } catch { /* SMS failure non-blocking */ }
        }
      }

      await client.query('COMMIT');

      return {
        suiteAlertId,
        dispatched: {
          push: dispatched.push,
          sms: dispatched.sms,
          apps: Array.from(dispatched.apps),
        },
      };
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  }

  async respondToAlert(suiteAlertId: string, responderId: string, responseApp: string, response: string): Promise<void> {
    await this.pool.query(
      `INSERT INTO suite_alert_responses (suite_alert_id, responder_id, response_app, response)
       VALUES ($1,$2,$3,$4)`,
      [suiteAlertId, responderId, responseApp, response]
    );
    // Update dispatch status
    await this.pool.query(
      `UPDATE suite_alert_dispatches SET status = 'acknowledged' 
       WHERE suite_alert_id = $1 AND recipient_id = $2`,
      [suiteAlertId, responderId]
    );
  }

  async resolveAlert(suiteAlertId: string, resolvedBy: string): Promise<void> {
    await this.pool.query(
      `UPDATE suite_alerts SET status = 'resolved', resolved_at = NOW(), resolved_by = $2
       WHERE id = $1`,
      [suiteAlertId, resolvedBy]
    );
    // Notify all dispatched recipients of resolution via push
    const dispatches = await this.pool.query(
      `SELECT DISTINCT push_token, app_name, recipient_id FROM suite_alert_dispatches
       WHERE suite_alert_id = $1 AND push_token IS NOT NULL`,
      [suiteAlertId]
    );
    const resolverResult = await this.pool.query('SELECT name FROM suite_users WHERE id = $1', [resolvedBy]);
    const resolverName = resolverResult.rows[0]?.name || 'Unknown';

    for (const d of dispatches.rows) {
      try {
        await axios.post('https://exp.host/--/api/v2/push/send', {
          to: d.push_token,
          channelId: APP_CHANNELS[d.app_name] || APP_CHANNELS.default,
          title: '✅ ALLES VEILIG / ALL CLEAR',
          body: `${resolverName} het die noodalarm gekanselleer. / cancelled the emergency.`,
          data: { type: 'alert_resolved', suiteAlertId },
        }, { timeout: 5000 });
      } catch { /* non-blocking */ }
    }
  }

  async requestLink(fromUserId: string, toEmail: string, relationship: string, bidirectional: boolean): Promise<string> {
    const toUser = await this.pool.query('SELECT id FROM suite_users WHERE email = $1', [toEmail]);
    if (!toUser.rows.length) throw new Error('User not found with that email');
    const toUserId = toUser.rows[0].id;

    const result = await this.pool.query(
      `INSERT INTO suite_link_requests (from_user_id, to_user_id, relationship, bidirectional)
       VALUES ($1,$2,$3,$4) RETURNING id`,
      [fromUserId, toUserId, relationship, bidirectional]
    );
    return result.rows[0].id;
  }

  async approveLink(requestId: string, approverId: string): Promise<void> {
    const req = await this.pool.query(
      'SELECT * FROM suite_link_requests WHERE id = $1 AND to_user_id = $2 AND status = $3',
      [requestId, approverId, 'pending']
    );
    if (!req.rows.length) throw new Error('Link request not found or already processed');
    const { from_user_id, to_user_id, relationship, bidirectional } = req.rows[0];

    await this.pool.query(
      `INSERT INTO suite_emergency_links (from_user_id, to_user_id, relationship, source_app, approved_at)
       VALUES ($1,$2,$3,'suite',NOW()) ON CONFLICT (from_user_id, to_user_id) DO UPDATE SET is_active = true, approved_at = NOW()`,
      [from_user_id, to_user_id, relationship]
    );
    if (bidirectional) {
      await this.pool.query(
        `INSERT INTO suite_emergency_links (from_user_id, to_user_id, relationship, source_app, approved_at)
         VALUES ($1,$2,$3,'suite',NOW()) ON CONFLICT (from_user_id, to_user_id) DO UPDATE SET is_active = true, approved_at = NOW()`,
        [to_user_id, from_user_id, relationship]
      );
    }
    await this.pool.query(
      `UPDATE suite_link_requests SET status = 'approved', responded_at = NOW() WHERE id = $1`,
      [requestId]
    );
  }

  async getAlertFeed(suiteUserId: string, limit = 20): Promise<unknown[]> {
    const result = await this.pool.query(
      `SELECT sa.*, su.name as sender_name
       FROM suite_alerts sa
       JOIN suite_users su ON su.id = sa.suite_user_id
       WHERE sa.suite_user_id = $1
          OR sa.suite_user_id IN (
            SELECT from_user_id FROM suite_emergency_links WHERE to_user_id = $1 AND is_active = true
          )
       ORDER BY sa.created_at DESC
       LIMIT $2`,
      [suiteUserId, limit]
    );
    return result.rows;
  }
}
