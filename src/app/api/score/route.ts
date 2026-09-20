import { NextResponse } from "next/server";
import { z } from "zod";
import { getSession, saveSession } from "@/lib/store";
import { scoreLeads } from "@/lib/scoring";

const bodySchema = z.object({
  sessionId: z.string().min(1),
});

export async function POST(req: Request) {
  try {
    const json = await req.json();
    const { sessionId } = bodySchema.parse(json);
    const session = await getSession(sessionId);
    if (!session) {
      return NextResponse.json({ error: "Session not found" }, { status: 404 });
    }

    session.leads = scoreLeads(session.leads, session.industry);
    await saveSession(session);

    return NextResponse.json({
      session,
      message:
        "Scored with deterministic revenue heuristics + confidence. LLM optional; never shows raw model failures.",
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Score failed";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
