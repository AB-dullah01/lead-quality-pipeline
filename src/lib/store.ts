import { randomUUID } from "crypto";
import { getLeadsForSearch } from "./demo-data";
import { freshCredits } from "./credits";
import { SessionState } from "./types";

const g = globalThis as unknown as {
  __leadTrustSessions?: Map<string, SessionState>;
};

function memory(): Map<string, SessionState> {
  if (!g.__leadTrustSessions) g.__leadTrustSessions = new Map();
  return g.__leadTrustSessions;
}

export async function createSession(options?: {
  industry?: string;
  country?: string;
  cityOrState?: string;
  /** @deprecated use country + cityOrState */
  location?: string;
}): Promise<SessionState> {
  const { industry, location, leads } = getLeadsForSearch(
    options?.industry ?? "Healthcare",
    options?.country ?? "USA",
    options?.cityOrState ?? options?.location ?? "New York City, NY"
  );

  const session: SessionState = {
    id: randomUUID(),
    createdAt: new Date().toISOString(),
    industry,
    location,
    credits: freshCredits(),
    leads: leads.map((l) => ({ ...l, selected: false })),
  };

  memory().set(session.id, session);

  try {
    const { saveSessionToFirestore } = await import("./firebase/admin");
    await saveSessionToFirestore(session);
  } catch {
    // optional
  }

  return session;
}

export async function getSession(id: string): Promise<SessionState | null> {
  const local = memory().get(id);
  if (local) return local;

  try {
    const { loadSessionFromFirestore } = await import("./firebase/admin");
    const remote = await loadSessionFromFirestore(id);
    if (remote) {
      memory().set(id, remote);
      return remote;
    }
  } catch {
    // ignore
  }
  return null;
}

export async function saveSession(session: SessionState): Promise<void> {
  memory().set(session.id, session);
  try {
    const { saveSessionToFirestore } = await import("./firebase/admin");
    await saveSessionToFirestore(session);
  } catch {
    // optional
  }
}
