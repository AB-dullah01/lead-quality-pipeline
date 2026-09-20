import { CompanyLead } from "./types";

export const STARTING_CREDITS = 10;

export const INDUSTRIES = [
  "Healthcare",
  "Software Development",
  "Financial Services",
  "Real Estate",
  "Manufacturing",
] as const;

export type Industry = (typeof INDUSTRIES)[number];

/** Matches SaaSquatch Company Finder: USA, Canada, UK, France */
export const COUNTRIES = [
  {
    code: "USA",
    label: "United States",
    short: "USA",
    defaultCity: "New York City",
    defaultState: "NY",
  },
  {
    code: "CAN",
    label: "Canada",
    short: "CAN",
    defaultCity: "Toronto",
    defaultState: "ON",
  },
  {
    code: "GBR",
    label: "United Kingdom",
    short: "UK",
    defaultCity: "London",
    defaultState: "England",
  },
  {
    code: "FRA",
    label: "France",
    short: "FRA",
    defaultCity: "Paris",
    defaultState: "Île-de-France",
  },
] as const;

export type CountryCode = (typeof COUNTRIES)[number]["code"];

type GeoPlace = { city: string; state: string; aliases: string[] };

const PLACES: Record<CountryCode, GeoPlace[]> = {
  USA: [
    { city: "New York City", state: "NY", aliases: ["new york", "nyc", "ny", "new york city"] },
    { city: "Austin", state: "TX", aliases: ["austin", "tx", "texas"] },
    { city: "Chicago", state: "IL", aliases: ["chicago", "il", "illinois"] },
    { city: "San Francisco", state: "CA", aliases: ["san francisco", "sf", "ca", "california"] },
    { city: "Los Angeles", state: "CA", aliases: ["los angeles", "la"] },
    { city: "Miami", state: "FL", aliases: ["miami", "fl", "florida"] },
  ],
  CAN: [
    { city: "Toronto", state: "ON", aliases: ["toronto", "on", "ontario"] },
    { city: "Vancouver", state: "BC", aliases: ["vancouver", "bc", "british columbia"] },
    { city: "Montreal", state: "QC", aliases: ["montreal", "montréal", "qc", "quebec", "québec"] },
    { city: "Calgary", state: "AB", aliases: ["calgary", "ab", "alberta"] },
  ],
  GBR: [
    { city: "London", state: "England", aliases: ["london", "england", "uk", "united kingdom"] },
    { city: "Manchester", state: "England", aliases: ["manchester"] },
    { city: "Edinburgh", state: "Scotland", aliases: ["edinburgh", "scotland"] },
    { city: "Birmingham", state: "England", aliases: ["birmingham"] },
  ],
  FRA: [
    { city: "Paris", state: "Île-de-France", aliases: ["paris", "ile-de-france", "île-de-france"] },
    { city: "Lyon", state: "Auvergne-Rhône-Alpes", aliases: ["lyon"] },
    { city: "Marseille", state: "Provence-Alpes-Côte d'Azur", aliases: ["marseille"] },
    { city: "Lille", state: "Hauts-de-France", aliases: ["lille"] },
  ],
};

export function isCountryCode(value: string): value is CountryCode {
  return COUNTRIES.some((c) => c.code === value);
}

export function resolveGeo(
  countryCode: string,
  cityOrState: string
): { country: CountryCode; city: string; state: string; label: string } {
  const country: CountryCode = isCountryCode(countryCode) ? countryCode : "USA";
  const meta = COUNTRIES.find((c) => c.code === country)!;
  const q = cityOrState.trim().toLowerCase();

  if (!q) {
    return {
      country,
      city: meta.defaultCity,
      state: meta.defaultState,
      label: `${meta.defaultCity}, ${meta.defaultState}, ${meta.short}`,
    };
  }

  const places = PLACES[country];
  const hit = places.find(
    (p) =>
      p.aliases.includes(q) ||
      p.city.toLowerCase() === q ||
      p.state.toLowerCase() === q ||
      `${p.city}, ${p.state}`.toLowerCase() === q
  );

  if (hit) {
    return {
      country,
      city: hit.city,
      state: hit.state,
      label: `${hit.city}, ${hit.state}, ${meta.short}`,
    };
  }

  // Free-text city/state (same UX as SaaSquatch) — still stamp onto demo leads
  const pretty = cityOrState.trim();
  return {
    country,
    city: pretty,
    state: meta.defaultState,
    label: `${pretty}, ${meta.short}`,
  };
}

const defaults = {
  phone: null as string | null,
  address: null as string | null,
  bbbRating: null as string | null,
  fitScore: null as number | null,
  estimatedRevenue: null as number | null,
  revenueBand: null as string | null,
  revenueConfidence: "unknown" as const,
  scoreReason: null as string | null,
  enrichStatus: "pending" as const,
  employees: null as number | null,
  yearFounded: null as number | null,
  ownerName: null as string | null,
  ownerLinkedIn: null as string | null,
  companyLinkedIn: null as string | null,
  enrichConfidence: "unknown" as const,
  enrichSources: [] as string[],
  fieldsFilled: [] as string[],
  creditsCharged: 0,
  selected: false,
};

type Seed = {
  id: string;
  name: string;
  industry: string;
  website: string | null;
  phone?: string | null;
  address?: string | null;
  bbbRating?: string | null;
  /** If true, enrichment will succeed with owner/employees data */
  enrichable?: boolean;
};

function base(
  partial: Omit<CompanyLead, keyof typeof defaults> & Partial<CompanyLead>
): CompanyLead {
  return { ...defaults, ...partial };
}

function withGeo(
  seeds: Seed[],
  city: string,
  state: string,
  country = "USA"
): CompanyLead[] {
  return seeds.map((s) =>
    base({
      id: s.id,
      name: s.name,
      industry: s.industry,
      city,
      state,
      country,
      website: s.website,
      phone: s.phone ?? null,
      address: s.address ?? null,
      bbbRating: s.bbbRating ?? null,
    })
  );
}

/** Per-industry catalogs: mix of rich (enrichable) and thin (empty enrich) leads */
const CATALOG: Record<Industry, Seed[]> = {
  Healthcare: [
    {
      id: "hc_01",
      name: "Harbor Dental Group",
      industry: "Healthcare",
      website: "https://example-harbor-dental.com",
      phone: "(212) 555-0142",
      address: "120 W 57th St",
      bbbRating: "A+",
      enrichable: true,
    },
    {
      id: "hc_02",
      name: "Midtown Cardiac Diagnostics",
      industry: "Healthcare",
      website: "https://example-cardiac-nyc.com",
      phone: "(212) 555-0198",
      address: "845 3rd Ave",
      bbbRating: "A",
      enrichable: true,
    },
    {
      id: "hc_03",
      name: "Brooklyn Family Physiatry",
      industry: "Healthcare",
      website: "https://example-bk-physiatry.com",
      address: "88 Court St",
      enrichable: true,
    },
    {
      id: "hc_04",
      name: "Bethany Medical Clinic of New York, PLLC",
      industry: "Healthcare",
      website: "https://bmcofny.com",
    },
    {
      id: "hc_05",
      name: "Night & Day Medical",
      industry: "Healthcare",
      website: "https://nightdaymedical.com",
    },
    {
      id: "hc_06",
      name: "Patients Medical",
      industry: "Healthcare",
      website: "https://patientsmedical.com",
    },
    {
      id: "hc_07",
      name: "Queens Urgent Care Partners",
      industry: "Healthcare",
      website: "https://example-queens-urgent.com",
      phone: "(718) 555-0166",
      address: "37-12 Junction Blvd",
      bbbRating: "B+",
      enrichable: true,
    },
    {
      id: "hc_08",
      name: "Extension Health Labs",
      industry: "Healthcare",
      website: null,
    },
    {
      id: "hc_09",
      name: "Amsterdam Family Health Center",
      industry: "Medical Clinic",
      website: "https://example-amsterdam-fhc.com",
      phone: "(212) 555-0110",
      address: "610 Amsterdam Ave",
      bbbRating: "A-",
      enrichable: true,
    },
    {
      id: "hc_10",
      name: "Hudson Orthopedics PC",
      industry: "Healthcare",
      website: "https://example-hudson-ortho.com",
      phone: "(646) 555-0177",
      address: "215 W 40th St",
      bbbRating: "A",
      enrichable: true,
    },
  ],
  "Software Development": [
    {
      id: "sw_01",
      name: "Northstar Dev Collective",
      industry: "Software Development",
      website: "https://example-northstar-dev.com",
      phone: "(512) 555-0140",
      address: "600 Congress Ave",
      bbbRating: "A",
      enrichable: true,
    },
    {
      id: "sw_02",
      name: "ParcelOps Software",
      industry: "Software Development",
      website: "https://example-parcelops.com",
      phone: "(415) 555-0188",
      address: "535 Mission St",
      bbbRating: "A-",
      enrichable: true,
    },
    {
      id: "sw_03",
      name: "Lint & Ship Studios",
      industry: "Software Development",
      website: "https://example-lintship.com",
      address: "221 W Hubbard St",
      enrichable: true,
    },
    {
      id: "sw_04",
      name: "QuickStack Labs LLC",
      industry: "Software Development",
      website: "https://quickstack-demo.example",
    },
    {
      id: "sw_05",
      name: "ByteBasin Consulting",
      industry: "Custom Software",
      website: "https://bytebasin.example",
    },
    {
      id: "sw_06",
      name: "NullPointer Partners",
      industry: "Software Development",
      website: null,
    },
    {
      id: "sw_07",
      name: "Cascade API Systems",
      industry: "Software Development",
      website: "https://example-cascade-api.com",
      phone: "(312) 555-0122",
      address: "233 S Wacker Dr",
      bbbRating: "A+",
      enrichable: true,
    },
    {
      id: "sw_08",
      name: "Harbor Code Agency",
      industry: "Software Development",
      website: "https://example-harbor-code.com",
      phone: "(646) 555-0191",
      address: "75 Varick St",
      bbbRating: "B+",
      enrichable: true,
    },
    {
      id: "sw_09",
      name: "Shipfast Prototypes",
      industry: "Software Development",
      website: "https://shipfast-proto.example",
    },
    {
      id: "sw_10",
      name: "Relay Graph Inc",
      industry: "Software Development",
      website: "https://example-relaygraph.com",
      phone: "(737) 555-0155",
      address: "901 E Cesar Chavez",
      enrichable: true,
    },
  ],
  "Financial Services": [
    {
      id: "fs_01",
      name: "Beacon Wealth Advisors",
      industry: "Financial Services",
      website: "https://example-beacon-wealth.com",
      phone: "(212) 555-0170",
      address: "375 Park Ave",
      bbbRating: "A+",
      enrichable: true,
    },
    {
      id: "fs_02",
      name: "Lumen Bookkeeping Co",
      industry: "Accounting",
      website: "https://example-lumen-books.com",
      phone: "(312) 555-0133",
      address: "150 N Michigan Ave",
      bbbRating: "A",
      enrichable: true,
    },
    {
      id: "fs_03",
      name: "Prairie Capital Brokers",
      industry: "Financial Services",
      website: "https://example-prairie-cap.com",
      address: "227 W Monroe St",
      enrichable: true,
    },
    {
      id: "fs_04",
      name: "LedgerLite Tax Prep",
      industry: "Financial Services",
      website: "https://ledgerlite-tax.example",
    },
    {
      id: "fs_05",
      name: "Swift Escrow Partners",
      industry: "Financial Services",
      website: "https://swiftescrow.example",
    },
    {
      id: "fs_06",
      name: "Untitled Finance Group",
      industry: "Financial Services",
      website: null,
    },
    {
      id: "fs_07",
      name: "Harbor Fiduciary LLC",
      industry: "Financial Services",
      website: "https://example-harbor-fiduciary.com",
      phone: "(415) 555-0160",
      address: "555 California St",
      bbbRating: "A-",
      enrichable: true,
    },
    {
      id: "fs_08",
      name: "Atlas Payroll Services",
      industry: "Financial Services",
      website: "https://example-atlas-payroll.com",
      phone: "(512) 555-0118",
      address: "300 W 6th St",
      bbbRating: "B+",
      enrichable: true,
    },
    {
      id: "fs_09",
      name: "Pennywise Advisory Desk",
      industry: "Financial Services",
      website: "https://pennywise-adv.example",
    },
    {
      id: "fs_10",
      name: "Crownstone Insurance Brokers",
      industry: "Insurance",
      website: "https://example-crownstone-ins.com",
      phone: "(646) 555-0144",
      address: "140 Broadway",
      enrichable: true,
    },
  ],
  "Real Estate": [
    {
      id: "re_01",
      name: "Cobblestone Property Group",
      industry: "Real Estate",
      website: "https://example-cobblestone-pg.com",
      phone: "(212) 555-0125",
      address: "200 Park Ave S",
      bbbRating: "A",
      enrichable: true,
    },
    {
      id: "re_02",
      name: "Lone Star Commercial Realty",
      industry: "Real Estate",
      website: "https://example-lonestar-cre.com",
      phone: "(512) 555-0199",
      address: "100 Congress Ave",
      bbbRating: "A+",
      enrichable: true,
    },
    {
      id: "re_03",
      name: "Lakefront Property Management",
      industry: "Property Management",
      website: "https://example-lakefront-pm.com",
      address: "401 N Michigan Ave",
      enrichable: true,
    },
    {
      id: "re_04",
      name: "Keys & Closings Realty",
      industry: "Real Estate",
      website: "https://keysclosings.example",
    },
    {
      id: "re_05",
      name: "Open House Brokers LLC",
      industry: "Real Estate",
      website: "https://openhouseny.example",
    },
    {
      id: "re_06",
      name: "Untitled Listings Co",
      industry: "Real Estate",
      website: null,
    },
    {
      id: "re_07",
      name: "Bayview Escrow & Title",
      industry: "Real Estate",
      website: "https://example-bayview-title.com",
      phone: "(415) 555-0172",
      address: "1 Market St",
      bbbRating: "A-",
      enrichable: true,
    },
    {
      id: "re_08",
      name: "Metro Multifamily Advisors",
      industry: "Real Estate",
      website: "https://example-metro-mfa.com",
      phone: "(312) 555-0181",
      address: "333 W Wacker Dr",
      bbbRating: "B+",
      enrichable: true,
    },
    {
      id: "re_09",
      name: "Corner Lot Investments",
      industry: "Real Estate",
      website: "https://cornerlot.example",
    },
    {
      id: "re_10",
      name: "Skyline Tenant Services",
      industry: "Real Estate",
      website: "https://example-skyline-tenant.com",
      phone: "(646) 555-0136",
      address: "11 Madison Ave",
      enrichable: true,
    },
  ],
  Manufacturing: [
    {
      id: "mf_01",
      name: "Ironclad Precision Parts",
      industry: "Manufacturing",
      website: "https://example-ironclad-parts.com",
      phone: "(312) 555-0148",
      address: "2800 S Ashland Ave",
      bbbRating: "A",
      enrichable: true,
    },
    {
      id: "mf_02",
      name: "Hill Country Fabrication",
      industry: "Manufacturing",
      website: "https://example-hillcountry-fab.com",
      phone: "(512) 555-0152",
      address: "4700 E Cesar Chavez",
      bbbRating: "A-",
      enrichable: true,
    },
    {
      id: "mf_03",
      name: "Bay Assembly Systems",
      industry: "Electronics Manufacturing",
      website: "https://example-bay-assembly.com",
      address: "1600 Seaport Blvd",
      enrichable: true,
    },
    {
      id: "mf_04",
      name: "QuickMold Plastics LLC",
      industry: "Manufacturing",
      website: "https://quickmold.example",
    },
    {
      id: "mf_05",
      name: "Sheet & Form Industries",
      industry: "Manufacturing",
      website: "https://sheetform.example",
    },
    {
      id: "mf_06",
      name: "Untitled Machine Shop",
      industry: "Manufacturing",
      website: null,
    },
    {
      id: "mf_07",
      name: "Hudson Valley Tooling",
      industry: "Manufacturing",
      website: "https://example-hv-tooling.com",
      phone: "(914) 555-0164",
      address: "55 Industrial Park Rd",
      bbbRating: "A+",
      enrichable: true,
    },
    {
      id: "mf_08",
      name: "Prairie Pack Solutions",
      industry: "Packaging Manufacturing",
      website: "https://example-prairie-pack.com",
      phone: "(773) 555-0111",
      address: "4200 W 47th St",
      bbbRating: "B+",
      enrichable: true,
    },
    {
      id: "mf_09",
      name: "BoltBin Components",
      industry: "Manufacturing",
      website: "https://boltbin.example",
    },
    {
      id: "mf_10",
      name: "Cascade Coatings Inc",
      industry: "Manufacturing",
      website: "https://example-cascade-coatings.com",
      phone: "(415) 555-0190",
      address: "900 Minnesota St",
      enrichable: true,
    },
  ],
};

export function isIndustry(value: string): value is Industry {
  return (INDUSTRIES as readonly string[]).includes(value);
}

export function getLeadsForSearch(
  industry: string,
  countryCode: string,
  cityOrState: string
): { industry: Industry; location: string; leads: CompanyLead[] } {
  const selected: Industry = isIndustry(industry) ? industry : "Healthcare";
  const geo = resolveGeo(countryCode, cityOrState);

  const seeds = CATALOG[selected];
  const leads = withGeo(seeds, geo.city, geo.state, geo.country).map((lead) => ({
    ...lead,
    address:
      lead.address && lead.address !== "N/A"
        ? `${lead.address}, ${geo.city}, ${geo.state}`
        : lead.address,
  }));

  return {
    industry: selected,
    location: geo.label,
    leads,
  };
}

/** IDs that should return successful enrichment (used by enrichment module) */
export const ENRICHABLE_IDS = new Set(
  Object.values(CATALOG)
    .flat()
    .filter((s) => s.enrichable)
    .map((s) => s.id)
);
