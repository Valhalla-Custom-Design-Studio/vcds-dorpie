/**
 * TrustScore™ — SA-First Neighbourhood Safety Intelligence Score
 * World First: Data-driven community trust score for insurers + estate agents
 * Patent pending — VCDS™ IP Asset
 */

export interface TrustScoreInput {
  neighbourhood_id: string;
  verified_incidents_30d: number;
  resolved_incidents_30d: number;
  active_patrol_members: number;
  avg_response_time_minutes: number;
  community_participation_rate: number; // 0-1
  false_alarm_rate: number; // 0-1
  sos_activations_30d: number;
  sos_resolved_30d: number;
  registered_households: number;
  active_households: number;
}

export interface TrustScoreResult {
  neighbourhood_id: string;
  trust_score: number; // 0-1000 (like credit score)
  grade: "AAA" | "AA" | "A" | "BBB" | "BB" | "B" | "CCC" | "D";
  components: TrustScoreComponents;
  trend: "improving" | "stable" | "declining";
  insurance_risk_band: "low" | "medium" | "high" | "very_high";
  estate_agent_rating: string;
  calculated_at: string;
  ip_watermark: string;
}

interface TrustScoreComponents {
  incident_resolution_score: number;
  patrol_coverage_score: number;
  response_time_score: number;
  community_engagement_score: number;
  sos_effectiveness_score: number;
}

export function calculateTrustScore(input: TrustScoreInput): TrustScoreResult {
  // Incident Resolution Score (0-200)
  const resolution_rate = input.verified_incidents_30d > 0
    ? input.resolved_incidents_30d / input.verified_incidents_30d
    : 1;
  const incident_resolution_score = Math.round(resolution_rate * (1 - input.false_alarm_rate) * 200);

  // Patrol Coverage Score (0-200)
  const patrol_density = Math.min(input.active_patrol_members / Math.max(input.registered_households / 10, 1), 1);
  const patrol_coverage_score = Math.round(patrol_density * 200);

  // Response Time Score (0-200) — under 5min = 200, over 60min = 0
  const response_time_score = Math.round(Math.max(0, 200 - (input.avg_response_time_minutes / 60) * 200));

  // Community Engagement Score (0-200)
  const engagement_rate = input.active_households / Math.max(input.registered_households, 1);
  const community_engagement_score = Math.round(
    (input.community_participation_rate * 0.5 + engagement_rate * 0.5) * 200
  );

  // SOS Effectiveness Score (0-200)
  const sos_rate = input.sos_activations_30d > 0
    ? input.sos_resolved_30d / input.sos_activations_30d
    : 1;
  const sos_effectiveness_score = Math.round(sos_rate * 200);

  const trust_score = Math.min(1000, Math.round(
    incident_resolution_score +
    patrol_coverage_score +
    response_time_score +
    community_engagement_score +
    sos_effectiveness_score
  ));

  const grade = trust_score >= 900 ? "AAA"
    : trust_score >= 800 ? "AA"
    : trust_score >= 700 ? "A"
    : trust_score >= 600 ? "BBB"
    : trust_score >= 500 ? "BB"
    : trust_score >= 400 ? "B"
    : trust_score >= 300 ? "CCC"
    : "D";

  const insurance_risk_band = trust_score >= 700 ? "low"
    : trust_score >= 500 ? "medium"
    : trust_score >= 300 ? "high"
    : "very_high";

  const estate_agent_rating = trust_score >= 800
    ? "Premium Security Estate — Top 10%"
    : trust_score >= 600
    ? "Good Security — Above Average"
    : trust_score >= 400
    ? "Average Security"
    : "Below Average — Security Concerns";

  return {
    neighbourhood_id: input.neighbourhood_id,
    trust_score,
    grade,
    components: {
      incident_resolution_score,
      patrol_coverage_score,
      response_time_score,
      community_engagement_score,
      sos_effectiveness_score,
    },
    trend: "stable",
    insurance_risk_band,
    estate_agent_rating,
    calculated_at: new Date().toISOString(),
    ip_watermark: "TrustScore™ — VCDS™ Patent Pending ZA2026/XXXXX",
  };
}
