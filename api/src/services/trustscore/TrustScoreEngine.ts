/**
 * TrustScore™ — SA-First neighbourhood trust scoring engine
 * PATENT PENDING — VCDS™ IP Asset
 * Licensable to: Santam, Discovery Insure, Pam Golding, Seeff, FNB Home Loans
 */

export interface TrustScoreInput {
  neighbourhoodId: string;
  incidentCount30d: number;
  resolvedIncidents30d: number;
  avgResponseTimeMinutes: number;
  activePatrollers: number;
  communityParticipationRate: number; // 0-1
  verifiedResidents: number;
  totalResidents: number;
  crimeRatePer100k: number;
  sosResponseRate: number; // 0-1
}

export interface TrustScore {
  score: number; // 0-100
  grade: "A+" | "A" | "B" | "C" | "D" | "F";
  breakdown: {
    safetyScore: number;
    responseScore: number;
    communityScore: number;
    verificationScore: number;
  };
  trend: "IMPROVING" | "STABLE" | "DECLINING";
  insuranceDiscount?: number; // % discount for Santam/Discovery
  propertyValueImpact?: string;
}

export function calculateTrustScore(input: TrustScoreInput): TrustScore {
  // Safety component (40%)
  const resolutionRate = input.incidentCount30d > 0 ? input.resolvedIncidents30d / input.incidentCount30d : 1;
  const safetyScore = Math.round((resolutionRate * 50) + Math.max(0, 50 - input.crimeRatePer100k / 20));

  // Response component (25%)
  const responseScore = Math.round(Math.max(0, 100 - input.avgResponseTimeMinutes * 3) * input.sosResponseRate);

  // Community component (20%)
  const communityScore = Math.round(
    (input.communityParticipationRate * 60) +
    (Math.min(input.activePatrollers / 10, 1) * 40)
  );

  // Verification component (15%)
  const verificationScore = Math.round((input.verifiedResidents / Math.max(input.totalResidents, 1)) * 100);

  const score = Math.round(
    safetyScore * 0.4 +
    responseScore * 0.25 +
    communityScore * 0.2 +
    verificationScore * 0.15
  );

  const grade = score >= 90 ? "A+" : score >= 80 ? "A" : score >= 70 ? "B" : score >= 60 ? "C" : score >= 50 ? "D" : "F";
  const insuranceDiscount = score >= 80 ? 15 : score >= 70 ? 10 : score >= 60 ? 5 : 0;

  return {
    score,
    grade,
    breakdown: { safetyScore, responseScore, communityScore, verificationScore },
    trend: "STABLE",
    insuranceDiscount,
    propertyValueImpact: score >= 80 ? "+8-12% property value" : score >= 60 ? "+3-5% property value" : "Neutral",
  };
}
