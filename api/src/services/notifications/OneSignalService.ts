/**
 * OneSignal — Unlimited free push notifications
 * Use case: SOS alerts, patrol notifications, community warnings
 */

const ONESIGNAL_APP_ID = process.env.ONESIGNAL_APP_ID || "";
const ONESIGNAL_API_KEY = process.env.ONESIGNAL_API_KEY || "";
const ONESIGNAL_BASE = "https://onesignal.com/api/v1";

export async function sendSOSAlert(playerIds: string[], location: string, sosId: string): Promise<void> {
  await fetch(`${ONESIGNAL_BASE}/notifications`, {
    method: "POST",
    headers: { Authorization: `Basic ${ONESIGNAL_API_KEY}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      app_id: ONESIGNAL_APP_ID,
      include_player_ids: playerIds,
      headings: { en: "🚨 SOS ALERT — DORPWAG" },
      contents: { en: `Emergency at ${location}. Tap to respond.` },
      data: { type: "SOS", sosId },
      priority: 10,
      ttl: 300,
    }),
  });
}

export async function sendCommunityAlert(segment: string, title: string, message: string, data?: object): Promise<void> {
  await fetch(`${ONESIGNAL_BASE}/notifications`, {
    method: "POST",
    headers: { Authorization: `Basic ${ONESIGNAL_API_KEY}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      app_id: ONESIGNAL_APP_ID,
      included_segments: [segment],
      headings: { en: title, af: title },
      contents: { en: message, af: message },
      data: data || {},
    }),
  });
}

export async function sendPatrolReminder(playerIds: string[], patrolTime: string, route: string): Promise<void> {
  await fetch(`${ONESIGNAL_BASE}/notifications`, {
    method: "POST",
    headers: { Authorization: `Basic ${ONESIGNAL_API_KEY}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      app_id: ONESIGNAL_APP_ID,
      include_player_ids: playerIds,
      headings: { en: "🚔 Patrol Reminder — Dorpwag" },
      contents: { en: `Your patrol starts at ${patrolTime}. Route: ${route}` },
      data: { type: "PATROL_REMINDER" },
    }),
  });
}
