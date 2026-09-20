import { NextResponse } from "next/server";
import { z } from "zod";
import { createSession, getSession } from "@/lib/store";
import { isFirestoreConfigured } from "@/lib/firebase/admin";
import { COUNTRIES, INDUSTRIES } from "@/lib/demo-data";

const bodySchema = z.object({
  industry: z.string().optional(),
  country: z.string().optional(),
  cityOrState: z.string().optional(),
  location: z.string().optional(),
});

export async function POST(req: Request) {
  let industry: string | undefined;
  let country: string | undefined;
  let cityOrState: string | undefined;
  let location: string | undefined;
  try {
    const json = await req.json();
    const parsed = bodySchema.parse(json);
    industry = parsed.industry;
    country = parsed.country;
    cityOrState = parsed.cityOrState;
    location = parsed.location;
  } catch {
    // empty body is fine — defaults apply
  }

  const session = await createSession({
    industry,
    country,
    cityOrState,
    location,
  });
  return NextResponse.json({
    session,
    storage: isFirestoreConfigured() ? "firestore+memory" : "memory",
    options: {
      industries: INDUSTRIES,
      countries: COUNTRIES,
    },
  });
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");

  if (!id) {
    return NextResponse.json({
      industries: INDUSTRIES,
      countries: COUNTRIES,
    });
  }

  const session = await getSession(id);
  if (!session) {
    return NextResponse.json({ error: "Session not found" }, { status: 404 });
  }
  return NextResponse.json({
    session,
    storage: isFirestoreConfigured() ? "firestore+memory" : "memory",
  });
}
