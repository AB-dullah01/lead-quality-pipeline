import { ENRICHABLE_IDS } from "./demo-data";
import { CompanyLead, Confidence, EnrichStatus } from "./types";

type EnrichRecord = {
  employees: number;
  yearFounded: number;
  ownerName: string;
  ownerLinkedIn: string | null;
  companyLinkedIn: string | null;
  phone: string | null;
  address: string | null;
  revenue: number;
  sources: string[];
};

/** Deterministic enrich payloads for enrichable IDs (stable across industries) */
function buildRecord(lead: CompanyLead): EnrichRecord {
  const hash = [...lead.id].reduce((a, c) => a + c.charCodeAt(0), 0);
  const employees = 8 + (hash % 55);
  const yearFounded = 1995 + (hash % 28);
  const revenue = (employees * 85_000 + (hash % 7) * 250_000) ;

  const first = ["Alex", "Jordan", "Sam", "Riley", "Morgan", "Casey", "Taylor"][
    hash % 7
  ];
  const last = ["Nguyen", "Patel", "Brooks", "Reyes", "Kim", "Walsh", "Okoro"][
    hash % 7
  ];
  const slug = `${first}-${last}`.toLowerCase();

  return {
    employees,
    yearFounded,
    ownerName: `${first} ${last}`,
    ownerLinkedIn: `https://linkedin.com/in/example-${slug}`,
    companyLinkedIn: lead.website
      ? `https://linkedin.com/company/example-${lead.id}`
      : null,
    phone: lead.phone,
    address: lead.address && lead.address !== "N/A" ? lead.address : null,
    revenue,
    sources:
      hash % 2 === 0
        ? ["internal-db", "apollo-sim"]
        : ["growjo-sim", "apollo-sim"],
  };
}

function display(value: string | number | null | undefined): string | number | null {
  if (value === null || value === undefined) return null;
  if (typeof value === "number" && Number.isNaN(value)) return null;
  if (
    typeof value === "string" &&
    (value === "NaN" || value === "N/A" || value.trim() === "")
  ) {
    return null;
  }
  return value;
}

function confidenceFromFields(count: number): Confidence {
  if (count >= 5) return "high";
  if (count >= 3) return "medium";
  if (count >= 1) return "low";
  return "unknown";
}

/**
 * Enrich a lead. Empty results charge 0 credits and never show NaN.
 */
export function enrichLead(lead: CompanyLead): {
  lead: CompanyLead;
  status: EnrichStatus;
  fieldsFilled: string[];
  charged: number;
  message: string;
} {
  if (!ENRICHABLE_IDS.has(lead.id)) {
    const updated: CompanyLead = {
      ...lead,
      enrichStatus: "empty",
      enrichConfidence: "low",
      enrichSources: ["internal-db", "apollo-sim", "growjo-sim"],
      fieldsFilled: [],
      creditsCharged: lead.creditsCharged,
      ownerName: null,
      ownerLinkedIn: null,
      companyLinkedIn: null,
      employees: null,
      yearFounded: null,
    };
    return {
      lead: updated,
      status: "empty",
      fieldsFilled: [],
      charged: 0,
      message: "No enrichable data found across sources. Credit not charged.",
    };
  }

  const record = buildRecord(lead);
  const fieldsFilled: string[] = [];
  const next: CompanyLead = { ...lead };

  const apply = <K extends keyof CompanyLead>(
    key: K,
    value: CompanyLead[K],
    label: string
  ) => {
    const cleaned = display(value as string | number | null) as CompanyLead[K];
    if (cleaned !== null && cleaned !== undefined && cleaned !== "") {
      next[key] = cleaned;
      fieldsFilled.push(label);
    } else {
      next[key] = null as CompanyLead[K];
    }
  };

  apply("employees", record.employees, "employees");
  apply("yearFounded", record.yearFounded, "yearFounded");
  apply("ownerName", record.ownerName, "ownerName");
  apply("ownerLinkedIn", record.ownerLinkedIn, "ownerLinkedIn");
  apply("companyLinkedIn", record.companyLinkedIn, "companyLinkedIn");
  apply("phone", record.phone ?? lead.phone, "phone");
  apply("address", record.address ?? lead.address, "address");
  next.estimatedRevenue = record.revenue;
  fieldsFilled.push("revenue");

  if (fieldsFilled.length === 0) {
    next.enrichStatus = "empty";
    next.enrichConfidence = "low";
    next.enrichSources = record.sources;
    next.fieldsFilled = [];
    return {
      lead: next,
      status: "empty",
      fieldsFilled: [],
      charged: 0,
      message: "Enrichment ran but filled 0 fields. Credit not charged.",
    };
  }

  next.enrichStatus = "success";
  next.enrichConfidence = confidenceFromFields(fieldsFilled.length);
  next.enrichSources = record.sources;
  next.fieldsFilled = fieldsFilled;
  next.creditsCharged = lead.creditsCharged + 1;

  return {
    lead: next,
    status: "success",
    fieldsFilled,
    charged: 1,
    message: `Enriched ${fieldsFilled.length} fields from ${record.sources.join(", ")}.`,
  };
}
