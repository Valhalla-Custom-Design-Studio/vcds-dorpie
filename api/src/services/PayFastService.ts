import crypto from 'crypto';
import axios from 'axios';

const PAYFAST_URL = process.env.PAYFAST_URL || 'https://www.payfast.co.za/eng/process';
const MERCHANT_ID = process.env.PAYFAST_MERCHANT_ID!;
const MERCHANT_KEY = process.env.PAYFAST_MERCHANT_KEY!;
const PASSPHRASE = process.env.PAYFAST_PASSPHRASE || '';

export interface PayFastPaymentParams {
  amount: number;
  itemName: string;
  itemDescription?: string;
  email: string;
  firstName: string;
  lastName: string;
  subscriptionType?: number;
  frequency?: number;
  cycles?: number;
  customStr1?: string;
  customStr2?: string;
}

export function buildPaymentUrl(params: PayFastPaymentParams): string {
  const data: Record<string, string> = {
    merchant_id: MERCHANT_ID,
    merchant_key: MERCHANT_KEY,
    return_url: process.env.PAYFAST_RETURN_URL || 'https://dorpwag.co.za/payment/success',
    cancel_url: process.env.PAYFAST_CANCEL_URL || 'https://dorpwag.co.za/payment/cancel',
    notify_url: process.env.PAYFAST_NOTIFY_URL || 'https://dorpwag-api.onrender.com/api/payments/itn',
    name_first: params.firstName,
    name_last: params.lastName,
    email_address: params.email,
    amount: params.amount.toFixed(2),
    item_name: params.itemName,
    item_description: params.itemDescription || '',
    custom_str1: params.customStr1 || '',
    custom_str2: params.customStr2 || '',
    subscription_type: String(params.subscriptionType || 1),
    frequency: String(params.frequency || 3),
    cycles: String(params.cycles || 0),
  };

  if (PASSPHRASE) data.passphrase = PASSPHRASE;

  const queryString = Object.entries(data)
    .map(([k, v]) => `${k}=${encodeURIComponent(v.trim())}`)
    .join('&');

  const signature = crypto.createHash('md5').update(queryString).digest('hex');
  return `${PAYFAST_URL}?${queryString}&signature=${signature}`;
}

export async function validateITN(body: Record<string, string>): Promise<boolean> {
  try {
    const pfData = { ...body };
    delete pfData.signature;
    if (PASSPHRASE) pfData.passphrase = PASSPHRASE;

    const queryString = Object.entries(pfData)
      .map(([k, v]) => `${k}=${encodeURIComponent(String(v).trim())}`)
      .join('&');

    const signature = crypto.createHash('md5').update(queryString).digest('hex');
    if (signature !== body.signature) return false;

    const validHosts = ['www.payfast.co.za', 'sandbox.payfast.co.za', 'w1w.payfast.co.za', 'w2w.payfast.co.za'];
    // Basic amount validation
    if (parseFloat(body.amount_gross) <= 0) return false;

    return true;
  } catch {
    return false;
  }
}
