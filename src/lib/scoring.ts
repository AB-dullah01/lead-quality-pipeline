import { CompanyLead, Confidence } from "./types";

const cache = new Map<string, { at: number; value: ReturnType<typeof scoreLead> }>();
const TTL_MS = 5 * 60 * 1000;

function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
}

function band(revenue: number): string {
  if (revenue < 500_000) return "<$500K";
  if (revenue < 1_500_000) return "$500K–$1.5M";
  if (revenue < 5_000_000) return "$1.5M–$5M";
  return "$5M+";
}

const INDUSTRY_REVENUE_BOOST: Record<string, number> = {
  Healthcare: 400_000,
  "Software Development": 900_000,
  "Financial Services": 1_100_000,
  "Real Estate": 750_000,
  Manufacturing: 1_400_000,
  Accounting: 500_000,
  Insurance: 800_000,
  "Property Management": 600_000,
  "Custom Software": 700_000,
  "Electronics Manufacturing": 1_200_000,
  "Packaging Manufacturing": 950_000,
  "Medical Clinic": 450_000,
};

/**
 * Deterministic revenue + fit scoring with explicit confidence.
 * buyBoxIndustry boosts leads that match the search industry.
 */
export function scoreLead(
  lead: CompanyLead,
  buyBoxIndustry?: string
): {
  fitScore: number;
  estimatedRevenue: number;
  revenueBand: string;
  revenueConfidence: Confidence;
  scoreReason: string;
} {
  const key = `${lead.id}:${buyBoxIndustry ?? ""}`;
  const hit = cache.get(key);
  if (hit && Date.now() - hit.at < TTL_MS) return hit.value;

  let score = 35;
  const reasons: string[] = [];

  if (lead.website) {
    score += 18;
    reasons.push("has website");
  } else {
    score -= 15;
    reasons.push("no website");
  }

  if (lead.phone) {
    score += 14;
    reasons.push("phone present");
  }
  if (lead.address && lead.address !== "N/A") {
    score += 12;
    reasons.push("street address");
  }
  if (lead.bbbRating) {
    score += 10;
    reasons.push(`BBB ${lead.bbbRating}`);
  }

  if (buyBoxIndustry) {
    const needle = buyBoxIndustry.toLowerCase();
    const hay = `${lead.industry} ${lead.name}`.toLowerCase();
    const matched =
      hay.includes(needle) ||
      (needle.includes("software") && /software|dev|api|code/.test(hay)) ||
      (needle.includes("financial") && /financ|account|insur|wealth|payroll/.test(hay)) ||
      (needle.includes("real estate") && /real estate|propert|realty|title|tenant/.test(hay)) ||
      (needle.includes("manufactur") && /manufactur|fabric|tool|mold|coat|pack/.test(hay)) ||
      (needle.includes("health") && /health|medical|clinic|dental|cardio|ortho/.test(hay));

    if (matched) {
      score += 10;
      reasons.push(`${buyBoxIndustry} buy-box match`);
    }
  }

  let revenue = 350_000;
  if (lead.phone && lead.address && lead.address !== "N/A") revenue += 900_000;
  if (lead.bbbRating?.startsWith("A")) revenue += 700_000;
  if (lead.website) revenue += 400_000;
  revenue += INDUSTRY_REVENUE_BOOST[lead.industry] ?? 300_000;
  if (!lead.website) revenue = Math.round(revenue * 0.45);

  let confidence: Confidence = "low";
  const signals =
    Number(!!lead.website) +
    Number(!!lead.phone) +
    Number(!!(lead.address && lead.address !== "N/A")) +
    Number(!!lead.bbbRating);
  if (signals >= 3) confidence = "high";
  else if (signals === 2) confidence = "medium";
  else if (signals === 1) confidence = "low";
  else confidence = "unknown";

  const value = {
    fitScore: clamp(Math.round(score), 0, 100),
    estimatedRevenue: Math.round(revenue / 10_000) * 10_000,
    revenueBand: band(revenue),
    revenueConfidence: confidence,
    scoreReason: reasons.join(" · ") || "insufficient signals",
  };

  cache.set(key, { at: Date.now(), value });
  return value;
}

export function scoreLeads(
  leads: CompanyLead[],
  buyBoxIndustry?: string
): CompanyLead[] {
  return leads
    .map((lead) => {
      const s = scoreLead(lead, buyBoxIndustry);
      return {
        ...lead,
        fitScore: s.fitScore,
        estimatedRevenue: s.estimatedRevenue,
        revenueBand: s.revenueBand,
        revenueConfidence: s.revenueConfidence,
        scoreReason: s.scoreReason,
      };
    })
    .sort((a, b) => (b.fitScore ?? 0) - (a.fitScore ?? 0));
}

export function clearScoreCache() {
  cache.clear();
}
