/**
 * Affiliate partner configuration
 * All affiliate links route through /go/:partner
 */

import { PartnerConfig } from '@/types/pregame';

export const PARTNERS: Record<string, PartnerConfig> = {
  stake: {
    id: 'stake',
    name: 'Stake',
    baseUrl: 'https://stake.games/?c=doctore',
  },
  cloudbet: {
    id: 'cloudbet',
    name: 'Cloudbet',
    baseUrl: 'https://cloudbet.com/ref/doctore',
  },
};

// Default partner for primary CTAs
export const DEFAULT_PARTNER = 'stake';

// Get partner by ID, returns null if not found
export function getPartner(partnerId: string): PartnerConfig | null {
  return PARTNERS[partnerId.toLowerCase()] || null;
}

// Build affiliate redirect URL with tracking params
export function buildAffiliateUrl(
  partnerId: string,
  params?: {
    src?: string;
    sport?: string;
    date?: string;
    match?: string;
    placement?: string;
  }
): string {
  const searchParams = new URLSearchParams();
  if (params?.src) searchParams.set('src', params.src);
  if (params?.sport) searchParams.set('sport', params.sport);
  if (params?.date) searchParams.set('date', params.date);
  if (params?.match) searchParams.set('match', params.match);
  if (params?.placement) searchParams.set('placement', params.placement);

  const queryString = searchParams.toString();
  return `/go/${partnerId}${queryString ? `?${queryString}` : ''}`;
}