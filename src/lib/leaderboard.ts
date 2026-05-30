/**
 * Leaderboard utility functions for Word Add-in
 * Direct port from chrome-ext/src/lib/leaderboard.ts — no chrome deps.
 */

import {
  collectionGroup,
  doc,
  onSnapshot,
  query,
  where,
  orderBy,
  limit,
  getDocs,
  getDoc,
  getCountFromServer,
} from "firebase/firestore";
import { db } from "../config/firebase";
import { UserLeaderboard, CombinedLeaderboard } from "@writinghabit/models";
import dayjs from "dayjs";

export const getUserLeaderboard = async (
  userId: string,
  period: string,
  date: string
) => {
  const docRef = doc(db, `userLeaderboard/${userId}/${period}/${date}`);
  const snap = await getDoc(docRef);
  return snap.exists() ? (snap.data() as UserLeaderboard) : null;
};

export const getUserLeaderboardRank = async ({
  words,
  field = "words",
  period,
  date,
  excludeManual = false,
}: {
  words: number;
  field?: string;
  period: string;
  date: string;
  excludeManual?: boolean;
}) => {
  try {
    const constraints = [
      where("id", "==", date),
      where(field, ">=", words),
      ...(excludeManual ? [where("manuallyTracked", "==", false)] : []),
    ];
    const rankingQuery = query(collectionGroup(db, period), ...constraints);
    const snap = await getCountFromServer(rankingQuery);
    return snap.data().count;
  } catch (e) {
    console.error(e);
    return 0;
  }
};

export const getUserLeaderboardAroundRank = async ({
  userWords,
  field,
  date,
  period,
  beforeCount = 3,
  afterCount = 6,
  excludeManual = false,
}: {
  userWords: number;
  field: string;
  date: string;
  period: string;
  beforeCount?: number;
  afterCount?: number;
  excludeManual?: boolean;
}) => {
  try {
    const constraints = [
      where("id", "==", date),
      ...(excludeManual ? [where("manuallyTracked", "==", false)] : []),
    ];
    const aboveQuery = query(
      collectionGroup(db, period),
      ...constraints,
      where(field, ">", userWords),
      orderBy(field, "asc"),
      limit(beforeCount)
    );
    const aboveSnap = await getDocs(aboveQuery);
    const aboveDocs = aboveSnap.docs.reverse();

    const belowQuery = query(
      collectionGroup(db, period),
      ...constraints,
      where(field, "<=", userWords),
      orderBy(field, "desc"),
      limit(afterCount + 1)
    );
    const belowSnap = await getDocs(belowQuery);

    return [
      ...aboveDocs.map((d) => ({ ...d.data(), id: d.id })),
      ...belowSnap.docs.map((d) => ({ ...d.data(), id: d.id })),
    ] as UserLeaderboard[];
  } catch (err) {
    console.error("Error fetching around rank:", err);
    return [];
  }
};

export const listenToUsersLeaderboard = (
  userId: string,
  callback: (data: UserLeaderboard | null) => void
) => {
  const date = dayjs().format("YYYY-M-D");
  const ref = doc(db, `userLeaderboard/${userId}/dailyLeaderboard/${date}`);
  return onSnapshot(ref, (snap) => {
    callback(snap.exists() ? (snap.data() as UserLeaderboard) : null);
  });
};

export const getCombinedLeaderboardRank = async ({
  userId,
  period,
  year,
  month,
  useNetWords = false,
  excludeManualTracking = false,
}: {
  userId: string;
  period: string;
  year: string;
  month: string | null;
  useNetWords?: boolean;
  excludeManualTracking?: boolean;
}) => {
  try {
    const docRef = doc(db, `userLeaderboard/${userId}/${period}/${year}`);
    const snap = await getDoc(docRef);
    if (!snap.exists()) return 0;

    const data = snap.data() as CombinedLeaderboard;
    const field = month
      ? useNetWords
        ? `month${month}Net`
        : `month${month}`
      : useNetWords
      ? "totalNetWords"
      : "totalWords";

    const words = (data as any)[field] ?? 0;

    const rankQuery = query(
      collectionGroup(db, period),
      where("id", "==", year),
      where(field, ">", words),
      ...(excludeManualTracking ? [where("manuallyTracked", "==", false)] : [])
    );
    const countSnap = await getCountFromServer(rankQuery);
    return countSnap.data().count + 1;
  } catch (err) {
    console.error("Error getting combined leaderboard rank:", err);
    return 0;
  }
};

export const getDailyLeaderboardAroundWordCount = async ({
  words,
  userId,
  pageSize = 10,
  useNetWords = false,
  excludeManual = false,
}: {
  words: number;
  userId: string;
  pageSize?: number;
  useNetWords?: boolean;
  excludeManual?: boolean;
}) => {
  const date = dayjs().format("YYYY-M-D");
  const field = useNetWords ? "netWords" : "words";
  try {
    const constraints = [
      where("id", "==", date),
      ...(excludeManual ? [where("manuallyTracked", "==", false)] : []),
    ];
    const q = query(
      collectionGroup(db, "dailyLeaderboard"),
      ...constraints,
      where(field, ">=", words),
      orderBy(field, "asc"),
      limit(pageSize)
    );
    const snap = await getDocs(q);
    return { docs: snap.docs.map((d) => ({ ...d.data(), id: d.id }) as UserLeaderboard), lastDoc: snap.docs[snap.docs.length - 1] ?? null };
  } catch (err) {
    console.error("Error fetching daily leaderboard:", err);
    return { docs: [], lastDoc: null };
  }
};
