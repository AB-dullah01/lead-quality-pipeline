import { NextResponse } from "next/server";
import { getSession } from "@/lib/store";

function csvEscape(v: string | number | null | undefined): string {
  if (v === null || v === undefined) return "";
  const s = String(v);
  if (s.includes(",") || s.includes('"') || s.includes("\n")) {
    return `"${s.replace(/"/g, '""')}"`;
  }
  return s;
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");
  if (!id) {
    return NextResponse.json({ error: "id required" }, { status: 400 });
  }
  const session = await getSession(id);
  if (!session) {
    return NextResponse.json({ error: "Session not found" }, { status: 404 });
  }

  const headers = [
    "name",
    "industry",
    "city",
    "state",
    "website",
    "phone",
    "address",
    "fitScore",
    "estimatedRevenue",
    "revenueBand",
    "revenueConfidence",
    "ownerName",
    "ownerLinkedIn",
    "employees",
    "yearFounded",
    "enrichStatus",
    "enrichConfidence",
    "fieldsFilled",
    "creditsCharged",
  ];

  const rows = session.leads.map((l) =>
    [
      l.name,
      l.industry,
      l.city,
      l.state,
      l.website,
      l.phone,
      l.address,
      l.fitScore,
      l.estimatedRevenue,
      l.revenueBand,
      l.revenueConfidence,
      l.ownerName,
      l.ownerLinkedIn,
      l.employees,
      l.yearFounded,
      l.enrichStatus,
      l.enrichConfidence,
      l.fieldsFilled.join("|"),
      l.creditsCharged,
    ]
      .map(csvEscape)
      .join(",")
  );

  const csv = [headers.join(","), ...rows].join("\n");
  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="leadtrust-${id.slice(0, 8)}.csv"`,
    },
  });
}
