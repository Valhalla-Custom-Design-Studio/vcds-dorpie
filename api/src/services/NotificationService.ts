import axios from 'axios';

export interface NotifyContact { name: string; phone?: string; pushToken?: string; }

export async function sendBulkSMS(contacts: NotifyContact[], message: string): Promise<void> {
  if (!process.env.BULKSMS_USERNAME || !process.env.BULKSMS_PASSWORD) {
    console.warn('[BulkSMS] Credentials not configured — skipping SMS');
    return;
  }
  const recipients = contacts
    .filter(c => c.phone)
    .map(c => ({ type: 'INTERNATIONAL', address: c.phone!.replace(/\s/g, '') }));
  if (!recipients.length) return;
  try {
    await axios.post(
      'https://api.bulksms.com/v1/messages',
      { to: recipients, body: message },
      { auth: { username: process.env.BULKSMS_USERNAME!, password: process.env.BULKSMS_PASSWORD! } }
    );
    console.log(`[BulkSMS] Sent to ${recipients.length} recipients`);
  } catch (e: any) {
    console.error('[BulkSMS] Failed:', e.response?.data || e.message);
  }
}

export async function sendExpoPush(
  tokens: string[],
  title: string,
  body: string,
  data?: Record<string, any>,
  channelId?: string
): Promise<void> {
  if (!tokens.length) return;
  const messages = tokens.map(to => ({
    to, title, body, data: data || {},
    sound: 'default',
    priority: 'high',
    channelId: channelId || 'default',
  }));
  try {
    await axios.post('https://exp.host/--/api/v2/push/send', messages, {
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
    });
    console.log(`[Push] Sent to ${tokens.length} devices`);
  } catch (e: any) {
    console.error('[Push] Failed:', e.response?.data || e.message);
  }
}

export async function sendTownPush(
  pool: any,
  townId: string,
  title: string,
  body: string,
  data?: Record<string, any>,
  channelId?: string
): Promise<void> {
  const { rows } = await pool.query(
    `SELECT pt.token FROM push_tokens pt
     JOIN users u ON u.id = pt.user_id
     WHERE u.town_id = $1`,
    [townId]
  );
  const tokens = rows.map((r: any) => r.token);
  await sendExpoPush(tokens, title, body, data, channelId);
}
