import type { Firestore } from "firebase-admin/firestore";
import { SessionState } from "../types";

let initPromise: Promise<Firestore | null> | null = null;

async function getDb(): Promise<Firestore | null> {
  if (!process.env.FIREBASE_PROJECT_ID || !process.env.FIREBASE_CLIENT_EMAIL) {
    return null;
  }
  if (!process.env.FIREBASE_PRIVATE_KEY) return null;

  if (!initPromise) {
    initPromise = (async () => {
      const { getApps, initializeApp, cert } = await import("firebase-admin/app");
      const { getFirestore } = await import("firebase-admin/firestore");

      if (!getApps().length) {
        initializeApp({
          credential: cert({
            projectId: process.env.FIREBASE_PROJECT_ID,
            clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
            privateKey: process.env.FIREBASE_PRIVATE_KEY!.replace(/\\n/g, "\n"),
          }),
        });
      }
      return getFirestore();
    })();
  }
  return initPromise;
}

export async function saveSessionToFirestore(session: SessionState): Promise<void> {
  const db = await getDb();
  if (!db) return;
  await db.collection("sessions").doc(session.id).set(session, { merge: true });
}

export async function loadSessionFromFirestore(
  id: string
): Promise<SessionState | null> {
  const db = await getDb();
  if (!db) return null;
  const snap = await db.collection("sessions").doc(id).get();
  if (!snap.exists) return null;
  return snap.data() as SessionState;
}

export function isFirestoreConfigured(): boolean {
  return Boolean(
    process.env.FIREBASE_PROJECT_ID &&
      process.env.FIREBASE_CLIENT_EMAIL &&
      process.env.FIREBASE_PRIVATE_KEY
  );
}
