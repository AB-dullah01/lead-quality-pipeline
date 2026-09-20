export type Confidence = "high" | "medium" | "low" | "unknown";

export type EnrichStatus = "pending" | "success" | "empty" | "failed";

export interface CompanyLead {
  id: string;
  name: string;
  industry: string;
  city: string;
  state: string;
  country: string;
  website: string | null;
  phone: string | null;
  address: string | null;
  /** Raw discovery fields — may be sparse, like real scrapers */
  bbbRating: string | null;
  /** Scoring outputs */
  fitScore: number | null;
  estimatedRevenue: number | null;
  revenueBand: string | null;
  revenueConfidence: Confidence;
  scoreReason: string | null;
  /** Enrichment outputs */
  enrichStatus: EnrichStatus;
  employees: number | null;
  yearFounded: number | null;
  ownerName: string | null;
  ownerLinkedIn: string | null;
  companyLinkedIn: string | null;
  enrichConfidence: Confidence;
  enrichSources: string[];
  fieldsFilled: string[];
  creditsCharged: number;
  selected: boolean;
}

export interface CreditLedger {
  starting: number;
  remaining: number;
  charged: number;
  waivedEmpty: number;
}

export interface SessionState {
  id: string;
  createdAt: string;
  industry: string;
  location: string;
  credits: CreditLedger;
  leads: CompanyLead[];
}

export interface EnrichResult {
  leadId: string;
  status: EnrichStatus;
  charged: number;
  fieldsFilled: string[];
  message: string;
  lead: CompanyLead;
}
