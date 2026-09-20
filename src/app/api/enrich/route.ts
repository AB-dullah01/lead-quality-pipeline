import { NextResponse } from "next/server";
import { z } from "zod";
import { getSession, saveSession } from "@/lib/store";
import { enrichLead } from "@/lib/enrichment";
import { applyCharge } from "@/lib/credits";
import { EnrichResult } from "@/lib/types";

const bodySchema = z.object({
  sessionId: z.string().min(1),
  leadIds: z.array(z.string()).min(1).max(25),
});

export async function POST(req: Request) {
  try {
    const json = await req.json();
    const { sessionId, leadIds } = bodySchema.parse(json);
    const session = await getSession(sessionId);
    if (!session) {
      return NextResponse.json({ error: "Session not found" }, { status: 404 });
    }

    const results: EnrichResult[] = [];

    for (const id of leadIds) {
      const idx = session.leads.findIndex((l) => l.id === id);
      if (idx === -1) {
        continue;
      }

      const lead = session.leads[idx];
      if (lead.enrichStatus === "success" && lead.creditsCharged > 0) {
        results.push({
          leadId: id,
          status: "success",
          charged: 0,
          fieldsFilled: lead.fieldsFilled,
          message: "Already enriched — no additional charge",
          lead,
        });
        continue;
      }

      // Pre-check: if we know enrich will need a credit and we're out, stop
      const preview = enrichLead(lead);
      if (preview.charged > 0 && session.credits.remaining < preview.charged) {
        return NextResponse.json(
          {
            error: "Insufficient credits",
            credits: session.credits,
            results,
            session,
          },
          { status: 402 }
        );
      }

      session.credits = applyCharge(
        session.credits,
        preview.charged,
        preview.status === "empty"
      );
      session.leads[idx] = preview.lead;

      results.push({
        leadId: id,
        status: preview.status,
        charged: preview.charged,
        fieldsFilled: preview.fieldsFilled,
        message: preview.message,
        lead: preview.lead,
      });
    }

    await saveSession(session);

    return NextResponse.json({
      session,
      results,
      summary: {
        attempted: results.length,
        succeeded: results.filter((r) => r.status === "success").length,
        emptyWaived: results.filter((r) => r.status === "empty").length,
        creditsChargedNow: results.reduce((s, r) => s + r.charged, 0),
      },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Enrich failed";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
