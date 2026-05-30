// Dorpwag™ Subscription Tiers — Bilingual (AF/EN)
// Gratis (Free) | Gemeenskap R49/mo | Bewaker R99/mo

export type Tier = 'free' | 'community' | 'guardian';

export interface TierFeatures {
  id: Tier;
  name_af: string;
  name_en: string;
  price: number; // ZAR/month
  description_af: string;
  description_en: string;
  features_af: string[];
  features_en: string[];
  color: string;
  recommended?: boolean;
}

export const TIERS: Record<Tier, TierFeatures> = {
  free: {
    id: 'free',
    name_af: 'Gratis',
    name_en: 'Free',
    price: 0,
    description_af: 'Basiese gemeenskapstoegang vir alle inwoners.',
    description_en: 'Basic community access for all residents.',
    features_af: [
      'Lees gemeenskapskennisgewings',
      'Blaai deur gemeenskapsforums',
      'Basiese besigheidsgids',
      'Noodkontaklys',
    ],
    features_en: [
      'Read community notices',
      'Browse community forums',
      'Basic business directory',
      'Emergency contact list',
    ],
    color: '#6B7280',
  },
  community: {
    id: 'community',
    name_af: 'Gemeenskap',
    name_en: 'Community',
    price: 49,
    description_af: 'Vir aktiewe gemeenskapslede wat meer wil bydra.',
    description_en: 'For active community members who want to contribute more.',
    features_af: [
      'Alles in Gratis',
      'Plaas advertensies & aankondigings',
      'Besigheidsprofiel',
      'Direk boodskappe stuur',
      'Gebeure skep & RSVP',
      'Prioriteit ondersteuning',
    ],
    features_en: [
      'Everything in Free',
      'Post listings & announcements',
      'Business profile',
      'Direct messaging',
      'Create & RSVP events',
      'Priority support',
    ],
    color: '#3B82F6',
    recommended: true,
  },
  guardian: {
    id: 'guardian',
    name_af: 'Bewaker™',
    name_en: 'Guardian™',
    price: 99,
    description_af: 'Volledige veiligheidsuite vir bewuste inwoners.',
    description_en: 'Full safety suite for security-conscious residents.',
    features_af: [
      'Alles in Gemeenskap',
      'SOS noodwaarskuwings',
      'Dooie man incheck-timer',
      'Bewegingsdophouding',
      'Veiligheidshittkaart',
      'Bewakermodus™ (aktief patrolleer)',
      'LPR voertuigwaglyste',
      'AI-aangedrewe misdaadwaarskuwings',
    ],
    features_en: [
      'Everything in Community',
      'SOS emergency alerts',
      'Dead man check-in timer',
      'Movement tracking',
      'Safety heatmap',
      'Guardian Mode™ (active patrol)',
      'LPR vehicle watchlists',
      'AI-powered crime alerts',
    ],
    color: '#F59E0B',
  },
};

export function canAccess(userTier: Tier, requiredTier: Tier): boolean {
  const order: Tier[] = ['free', 'community', 'guardian'];
  return order.indexOf(userTier) >= order.indexOf(requiredTier);
}
