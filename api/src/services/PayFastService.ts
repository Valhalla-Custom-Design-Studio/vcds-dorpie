import crypto from 'crypto';

const PAYFAST_URL = process.env.PAYFAST_URL || 'https://www.payfast.co.za/eng/process';
const MERCHANT_ID = process.env.PAYFAST_MERCHANT_ID!;
const MERCHANT_KEY = process.env.PAYFAST_MERCHANT_KEY!;
const PASSPHRASE = process.env.PAYFAST_PASSPHRASE || '';

export function generateSignature(params: Record<string, string>): string {
  const sorted = Object.keys(params).sort().reduce((acc, k) => {
    if (params[k] !== '') acc[k] = params[k];
    return acc;
  }, {} as Record<string, string>);
  let str = Object.entries(sorted).map(([k, v]) => `${k}=${encodeURIComponent(v).replace(/%20/g, '+')}`).join('&');
  if (PASSPHRASE) str += `&passphrase=${encodeURIComponent(PASSPHRASE).replace(/%20/g, '+')}`;
  return crypto.createHash('md5').update(str).digest('hex');
}

export function buildPaymentURL(params: {
  amount: number; itemName: string; email: string;
  firstName: string; lastName: string;
  returnUrl: string; cancelUrl: string; notifyUrl: string;
  subscriptionType?: number; billingDate?: string; recurringAmount?: number; frequency?: number; cycles?: number;
  customStr1?: string;
}): string {
  const p: Record<string, string> = {
    merchant_id: MERCHANT_ID,
    merchant_key: MERCHANT_KEY,
    return_url: params.returnUrl,
    cancel_url: params.cancelUrl,
    notify_url: params.notifyUrl,
    name_first: params.firstName,
    name_last: params.lastName,
    email_address: params.email,
    amount: params.amount.toFixed(2),
    item_name: params.itemName,
  };
  if (params.subscriptionType) {
    p.subscription_type = String(params.subscriptionType);
    p.billing_date = params.billingDate || new Date().toISOString().split('T')[0];
    p.recurring_amount = (params.recurringAmount || params.amount).toFixed(2);
    p.frequency = String(params.frequency || 3);
    p.cycles = String(params.cycles || 0);
  }
  if (params.customStr1) p.custom_str1 = params.customStr1;
  p.signature = generateSignature(p);
  const qs = Object.entries(p).map(([k, v]) => `${k}=${encodeURIComponent(v)}`).join('&');
  return `${PAYFAST_URL}?${qs}`;
}

export function verifyITN(params: Record<string, string>): boolean {
  const { signature, ...rest } = params;
  const expected = generateSignature(rest);
  return expected === signature;
}
