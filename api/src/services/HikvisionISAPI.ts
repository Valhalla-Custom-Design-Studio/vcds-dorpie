/**
 * Dorpwag™ Hikvision ISAPI Bridge
 * ─────────────────────────────────────────────────────────────
 * Two modes:
 *   A) PUSH  — Hikvision camera POSTs XML events to /api/lpr/hikvision/webhook
 *   B) PULL  — Server polls camera ISAPI endpoint with HTTP Digest auth
 *
 * No third-party LPR API required. Works fully offline/LAN.
 * ─────────────────────────────────────────────────────────────
 */

import crypto from 'crypto';
import { db } from '../db';

// ── HTTP Digest Auth helper ──────────────────────────────────
// Hikvision uses RFC 2617 Digest Authentication
export function buildDigestAuth(
  method: string,
  uri: string,
  username: string,
  password: string,
  realm: string,
  nonce: string,
  nc = '00000001',
  cnonce = crypto.randomBytes(8).toString('hex'),
  qop = 'auth'
): string {
  const ha1 = crypto.createHash('md5').update(`${username}:${realm}:${password}`).digest('hex');
  const ha2 = crypto.createHash('md5').update(`${method}:${uri}`).digest('hex');
  const response = crypto
    .createHash('md5')
    .update(`${ha1}:${nonce}:${nc}:${cnonce}:${qop}:${ha2}`)
    .digest('hex');

  return (
    `Digest username="${username}", realm="${realm}", nonce="${nonce}", ` +
    `uri="${uri}", qop=${qop}, nc=${nc}, cnonce="${cnonce}", response="${response}"`
  );
}

// ── Parse WWW-Authenticate header from Hikvision ─────────────
export function parseWWWAuth(header: string): Record<string, string> {
  const params: Record<string, string> = {};
  const matches = header.matchAll(/(\w+)="([^"]+)"/g);
  for (const m of matches) params[m[1]] = m[2];
  return params;
}

// ── Fetch with Digest Auth (two-step handshake) ──────────────
export async function fetchWithDigest(
  url: string,
  method: string,
  username: string,
  password: string,
  body?: string
): Promise<{ status: number; text: string }> {
  // Step 1: unauthenticated request to get nonce
  const step1 = await fetch(url, { method, signal: AbortSignal.timeout(5000) });

  if (step1.status !== 401) {
    // Camera doesn't require auth or already accessible
    return { status: step1.status, text: await step1.text() };
  }

  const wwwAuth = step1.headers.get('www-authenticate') ?? '';
  const authParams = parseWWWAuth(wwwAuth);
  const uri = new URL(url).pathname;

  const authHeader = buildDigestAuth(
    method, uri, username, password,
    authParams.realm ?? 'Streaming Server',
    authParams.nonce ?? '',
    '00000001',
    crypto.randomBytes(8).toString('hex'),
    authParams.qop ?? 'auth'
  );

  // Step 2: authenticated request
  const step2 = await fetch(url, {
    method,
    headers: {
      Authorization: authHeader,
      'Content-Type': body ? 'application/xml' : 'application/json',
    },
    body,
    signal: AbortSignal.timeout(8000),
  });

  return { status: step2.status, text: await step2.text() };
}

// ── Parse Hikvision ISAPI XML plate event ────────────────────
export function parseISAPIPlateEvent(xml: string): {
  plate: string | null;
  confidence: number;
  imageBase64?: string;
  direction?: string;
  laneNo?: string;
} {
  // Hikvision ANPR event XML structure
  const plate = xml.match(/<licensePlate>([^<]+)<\/licensePlate>/)?.[1]
    ?? xml.match(/<plateNumber>([^<]+)<\/plateNumber>/)?.[1]
    ?? null;

  const confidenceStr = xml.match(/<confidence>([^<]+)<\/confidence>/)?.[1] ?? '0';
  const confidence = parseFloat(confidenceStr);

  const imageBase64 = xml.match(/<picData>([^<]+)<\/picData>/)?.[1];
  const direction = xml.match(/<direction>([^<]+)<\/direction>/)?.[1];
  const laneNo = xml.match(/<laneNo>([^<]+)<\/laneNo>/)?.[1];

  return { plate, confidence, imageBase64, direction, laneNo };
}

// ── Test camera connectivity ─────────────────────────────────
export async function testHikvisionCamera(
  ip: string, port: number, username: string, password: string
): Promise<{ online: boolean; firmware?: string; error?: string }> {
  try {
    const url = `http://${ip}:${port}/ISAPI/System/deviceInfo`;
    const result = await fetchWithDigest(url, 'GET', username, password);

    if (result.status === 200) {
      const firmware = result.text.match(/<firmwareVersion>([^<]+)<\/firmwareVersion>/)?.[1];
      return { online: true, firmware };
    }
    return { online: false, error: `HTTP ${result.status}` };
  } catch (e: any) {
    return { online: false, error: e.message ?? 'Timeout' };
  }
}

// ── Poll camera for recent ANPR events ──────────────────────
export async function pollHikvisionANPR(
  ip: string, port: number, username: string, password: string
): Promise<Array<{ plate: string; confidence: number; direction?: string }>> {
  try {
    const url = `http://${ip}:${port}/ISAPI/Traffic/channels/1/vehicleDetect/plates`;
    const result = await fetchWithDigest(url, 'GET', username, password);

    if (result.status !== 200) return [];

    // Parse multiple plate entries
    const entries: Array<{ plate: string; confidence: number; direction?: string }> = [];
    const plateMatches = result.text.matchAll(/<PlateInfo>([\s\S]*?)<\/PlateInfo>/g);

    for (const match of plateMatches) {
      const block = match[1];
      const plate = block.match(/<plateNumber>([^<]+)<\/plateNumber>/)?.[1];
      const conf = parseFloat(block.match(/<confidence>([^<]+)<\/confidence>/)?.[1] ?? '0');
      const dir = block.match(/<direction>([^<]+)<\/direction>/)?.[1];
      if (plate) entries.push({ plate, confidence: conf, direction: dir });
    }

    return entries;
  } catch {
    return [];
  }
}

// ── Subscribe camera to push events to our webhook ──────────
export async function subscribeHikvisionWebhook(
  ip: string, port: number, username: string, password: string,
  webhookUrl: string
): Promise<boolean> {
  try {
    const url = `http://${ip}:${port}/ISAPI/Event/notification/httpHosts`;
    const body = `<?xml version="1.0" encoding="UTF-8"?>
<HttpHostNotificationList>
  <HttpHostNotification>
    <id>1</id>
    <url>${webhookUrl}</url>
    <protocolType>HTTP</protocolType>
    <parameterFormatType>XML</parameterFormatType>
    <addressingFormatType>ipaddress</addressingFormatType>
    <hostName>${new URL(webhookUrl).hostname}</hostName>
    <portNo>${new URL(webhookUrl).port || 80}</portNo>
    <httpAuthenticationMethod>none</httpAuthenticationMethod>
  </HttpHostNotification>
</HttpHostNotificationList>`;

    const result = await fetchWithDigest(url, 'PUT', username, password, body);
    return result.status === 200 || result.status === 204;
  } catch {
    return false;
  }
}

// ── Process incoming webhook event and store in DB ───────────
export async function processWebhookEvent(
  xml: string,
  cameraId: string,
  communityId: string
): Promise<{ plate: string; isWatchlisted: boolean; watchlistReason?: string } | null> {
  const parsed = parseISAPIPlateEvent(xml);
  if (!parsed.plate) return null;

  const plate = parsed.plate.toUpperCase().replace(/[^A-Z0-9]/g, '');
  if (!plate) return null;

  // Check watchlist
  const wl = await db.query(
    'SELECT reason FROM lpr_watchlist WHERE plate = $1 AND community_id = $2',
    [plate, communityId]
  );
  const isWatchlisted = wl.rows.length > 0;
  const watchlistReason = wl.rows[0]?.reason;

  // Store event
  await db.query(
    `INSERT INTO lpr_events
       (community_id, camera_id, plate, confidence, source, is_watchlisted, watchlist_reason, image_url)
     VALUES ($1, $2, $3, $4, 'hikvision', $5, $6, $7)`,
    [communityId, cameraId, plate, parsed.confidence, isWatchlisted, watchlistReason ?? null, null]
  );

  // Update camera last_seen
  await db.query(
    'UPDATE lpr_cameras SET last_seen = NOW(), is_online = true WHERE id = $1',
    [cameraId]
  );

  // Trigger alert if watchlisted
  if (isWatchlisted) {
    await db.query(
      `INSERT INTO alerts (community_id, type, message, severity, metadata)
       VALUES ($1, 'lpr_hit', $2, 'high', $3)`,
      [
        communityId,
        `🚨 Waglys voertuig bespeur: ${plate}`,
        JSON.stringify({ plate, cameraId, source: 'hikvision', reason: watchlistReason }),
      ]
    );
  }

  return { plate, isWatchlisted, watchlistReason };
}
