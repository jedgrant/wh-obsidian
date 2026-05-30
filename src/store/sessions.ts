/**
 * Session store — Obsidian Plugin
 *
 * Direct mirror of apps/word-addin/src/store/sessions.ts.
 * Reads and writes session documents under `projects/{projectId}/sessions/{monthYear}`.
 */

import { doc, getDoc, updateDoc, setDoc } from "firebase/firestore";
import { db } from "../config/firebase";
import type { Session, SessionData } from "@writinghabit/models";
import dayjs from "dayjs";

export function generateSessionId(date?: Date): string {
  return dayjs(date).format("MM-YYYY");
}

export function getRecentMonthIds(count: number): string[] {
  return Array.from({ length: count }, (_, i) =>
    dayjs().subtract(i, "month").format("MM-YYYY")
  );
}

export async function fetchSessionData(
  userId: string,
  projectId: string
): Promise<SessionData> {
  try {
    const monthIds = getRecentMonthIds(2);
    const refs = monthIds.map((m) =>
      doc(db, `projects/${projectId}/sessions/${m}`)
    );
    const snaps = await Promise.all(refs.map(getDoc));

    const sessions: Session[] = [];
    snaps.forEach((snap) => {
      if (snap.exists()) {
        const data = snap.data();
        const userSessions = data?.[userId];
        if (userSessions) {
          Object.values(userSessions).forEach((s) => {
            sessions.push(s as Session);
          });
        }
      }
    });

    const todayKey = dayjs().format("YYYY-MM-DD");

    const all: { [key: string]: Session[] } = {};
    sessions.forEach((s) => {
      const key = dayjs(s.sessionDate || s.startingTime).format("MM-YYYY");
      if (!all[key]) all[key] = [];
      all[key].push(s);
    });

    return {
      today: sessions.filter((s) => s.sessionDate === todayKey),
      all,
      flattened: sessions,
    };
  } catch (err) {
    console.error("[sessions store] fetchSessionData failed:", err);
    return { all: {}, flattened: [], today: [] };
  }
}

export async function persistSession(
  userId: string,
  projectId: string,
  session: Session
): Promise<void> {
  const monthYear = generateSessionId(
    session.startingTime ? new Date(session.startingTime) : undefined
  );
  const ref = doc(db, `projects/${projectId}/sessions/${monthYear}`);
  const sessionId = session.id as string;
  const updatePath = `${userId}.${sessionId}`;

  const sessionToSave = Object.fromEntries(
    Object.entries({
      ...session,
      userId,
      sessionDate: dayjs(session.startingTime).format("YYYY-MM-DD"),
    }).filter(([, v]) => v !== undefined)
  );

  try {
    await updateDoc(ref, { [updatePath]: sessionToSave });
  } catch {
    // Document doesn't exist yet — create it
    await setDoc(ref, { [userId]: { [sessionId]: sessionToSave } }, { merge: true });
  }
}
