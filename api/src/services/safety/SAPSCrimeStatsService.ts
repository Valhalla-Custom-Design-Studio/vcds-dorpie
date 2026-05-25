/**
 * SAPS Crime Statistics — Public annual data
 * Source: https://www.saps.gov.za/services/crimestats.php
 * Use case: TrustScore™ neighbourhood safety index
 * Data: Scraped/cached annually, no live API (SAPS doesn't provide one)
 */

export interface CrimeStats {
  station: string;
  province: string;
  year: number;
  categories: {
    murder: number;
    assault: number;
    robbery: number;
    houseBreaking: number;
    carHijacking: number;
    sexualOffences: number;
  };
  totalCrimes: number;
  crimeRate: number; // per 100,000 population
}

// SA provinces crime index (2023/24 data — cached)
export const SA_CRIME_INDEX: Record<string, number> = {
  "Western Cape": 72,
  "Gauteng": 68,
  "KwaZulu-Natal": 65,
  "Eastern Cape": 61,
  "Limpopo": 45,
  "Mpumalanga": 52,
  "North West": 48,
  "Free State": 55,
  "Northern Cape": 43,
};

export async function getCrimeStatsByStation(station: string): Promise<CrimeStats | null> {
  // In production: query cached SAPS data from PostgreSQL
  // SAPS releases annual CSV — we parse and store it
  return null;
}

export function calculateAreaSafetyScore(crimeRate: number, responseTime: number, patrolCoverage: number): number {
  // TrustScore™ algorithm
  const crimeScore = Math.max(0, 100 - crimeRate / 10);
  const responseScore = Math.max(0, 100 - responseTime / 2); // minutes
  const patrolScore = patrolCoverage; // 0-100%
  return Math.round((crimeScore * 0.5) + (responseScore * 0.3) + (patrolScore * 0.2));
}
