// Dorpwag™ Subscription Tiers
export type DorpwagTier = 'free' | 'pro' | 'platinum';

export const DORPWAG_TIERS = {
  free: {
    id: 'free', name_af: 'Gratis', name_en: 'Free', price: 0,
    color: '#6B7280',
    features_af: [
      'Gemeenskapskenmerke', 'Basiese kennisgewings', 'Markplek toegang', 'Forum & gebeure',
    ],
    locked_af: ['SOS Noodknoppie', 'Bewakermodus™', 'LPR Kamera', 'AI Misdaadanalise', 'GeoFence Wagposte', 'Gesigherkenning'],
  },
  pro: {
    id: 'pro', name_af: 'Pro', name_en: 'Pro', price: 99,
    color: '#3B82F6', badge: 'GEWILD',
    features_af: [
      'Alles in Gratis', 'SOS Noodknoppie', 'Bewakermodus™', 'Phantom Alert™',
      'Bewegings-DNA™', 'LPR Kamera (Hikvision + Snipr)', 'AI Misdaadanalise', 'Dooie Man Skakelaar',
    ],
    locked_af: ['GeoFence Wagposte', 'Gesigherkenning', 'HOA Admin Paneel'],
  },
  platinum: {
    id: 'platinum', name_af: 'Platinum', name_en: 'Platinum', price: 199,
    color: '#C9A84C', badge: 'BESTE WAARDE',
    features_af: [
      'Alles in Pro', 'GeoFence Wagposte', 'Gesigherkenning', 'HOA Admin Paneel',
      'Multi-kamera bestuur', 'Gevorderde analise', 'Prioriteit ondersteuning',
    ],
    locked_af: [],
  },
} as const;

export const DORPWAG_SUBSCRIBE_ROUTE = '/subscribe';
export const DORPWAG_ACCENT = '#C9A84C';
