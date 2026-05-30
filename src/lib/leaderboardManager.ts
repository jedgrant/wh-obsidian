/**
 * Leaderboard Manager — Obsidian Plugin
 *
 * Direct copy of apps/word-addin/src/lib/leaderboardManager.ts.
 * No chrome-specific dependencies — uses the same Firestore db instance.
 */

import {
  doc,
  getDoc,
  setDoc,
  updateDoc,
  serverTimestamp,
} from "firebase/firestore";
import { db } from "../config/firebase";
import type {
  Project,
  User,
  SessionData,
  UserLeaderboard,
  CombinedLeaderboard,
} from "@writinghabit/models";
import {
  shouldUpdateLeaderboard,
  buildProjectUpdateData,
  buildDailyLeaderboardData,
  buildCombinedLeaderboardData,
  getAllCounts,
  initializeUserLeaderboard,
  initializeCombinedLeaderboard,
} from "@writinghabit/utils";
import dayjs from "dayjs";

let _userLeaderboardCreatedThisSession = false;

export async function checkShouldUpdateLeaderboard(
  project: Project,
  allSessionData: SessionData
): Promise<{
  shouldUpdate: boolean;
  incrementalWords: number;
  create: boolean;
  totalWords: number;
}> {
  const counts = getAllCounts(allSessionData);
  const totalWords = counts.allWords;
  const { shouldUpdate, incrementalWords, create } = shouldUpdateLeaderboard(
    project,
    allSessionData
  );
  return { shouldUpdate, incrementalWords, create, totalWords };
}

export async function createUserLeaderboardIfNeeded(
  userId: string,
  user: User,
  manuallyTracked: boolean
): Promise<{ success: boolean; error?: string }> {
  try {
    const ref = doc(db, "userLeaderboard", userId);
    const snap = await getDoc(ref);
    if (!snap.exists()) {
      const leaderboard = initializeUserLeaderboard({ user, manuallyTracked });
      await setDoc(ref, { ...leaderboard, lastUpdated: serverTimestamp() });
    }
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function updateDailyLeaderboard(
  userId: string,
  user: User,
  project: Project,
  allSessionData: SessionData
): Promise<{ success: boolean; error?: string }> {
  try {
    const counts = getAllCounts(allSessionData);
    const id = dayjs().format("YYYY-M-D");
    const ref = doc(db, `userLeaderboard/${userId}/dailyLeaderboard/${id}`);
    const snap = await getDoc(ref);
    let existing: UserLeaderboard | undefined;
    if (snap.exists()) existing = snap.data() as UserLeaderboard;

    const data = buildDailyLeaderboardData(user, project, counts, existing);
    if (existing) {
      await updateDoc(ref, { ...data, lastUpdated: serverTimestamp() });
    } else {
      await setDoc(ref, { ...data, lastUpdated: serverTimestamp() });
    }
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function updateCombinedLeaderboard(
  userId: string,
  user: User,
  projectId: string,
  project: Project,
  allSessionData: SessionData,
  incrementalTypedWords?: number
): Promise<{ success: boolean; error?: string }> {
  try {
    const counts = getAllCounts(allSessionData);
    const totalWords = counts.allWords;
    const currentYear = dayjs().format("YYYY");
    const ref = doc(db, `userLeaderboard/${userId}/combinedLeaderboard/${currentYear}`);

    const snap = await getDoc(ref);
    let existing: CombinedLeaderboard;
    if (snap.exists()) {
      existing = snap.data() as CombinedLeaderboard;
    } else {
      existing = initializeCombinedLeaderboard({
        user,
        manuallyTracked: project.manuallyTracked || false,
      });
    }

    const previousTotal = existing.projectCounts?.[projectId]?.total || 0;
    const newWords = totalWords - previousTotal;

    const { updateData, updatedLeaderboard, errors, hasErrors } =
      buildCombinedLeaderboardData({
        userName: user.userName,
        projectTitle: project.title,
        projectColor: project.color,
        projectId,
        values: counts,
        manuallyTracked: project.manuallyTracked || false,
        projectTotal: totalWords,
        allSessionData,
        existingLeaderboard: existing,
        newWords,
        incrementalTypedWords,
      });

    if (hasErrors && errors && errors.length > 0) {
      console.error("[LeaderboardManager] Validation errors:", errors);
      return { success: false, error: errors.join("; ") };
    }

    if (snap.exists()) {
      await updateDoc(ref, { ...updateData, lastUpdated: serverTimestamp() });
    } else {
      await setDoc(ref, { ...updatedLeaderboard, lastUpdated: serverTimestamp() });
    }
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function updateAllLeaderboards(
  userId: string,
  projectId: string,
  user: User,
  project: Project,
  allSessionData: SessionData,
  incrementalTypedWords?: number
): Promise<{ success: boolean; errors: string[]; updated: string[] }> {
  const errors: string[] = [];
  const updated: string[] = [];

  if (!_userLeaderboardCreatedThisSession) {
    await createUserLeaderboardIfNeeded(userId, user, project.manuallyTracked || false);
    _userLeaderboardCreatedThisSession = true;
  }

  const dailyResult = await updateDailyLeaderboard(userId, user, project, allSessionData);
  if (dailyResult.success) updated.push("daily");
  else if (dailyResult.error) errors.push(`Daily: ${dailyResult.error}`);

  const combinedResult = await updateCombinedLeaderboard(
    userId,
    user,
    projectId,
    project,
    allSessionData,
    incrementalTypedWords
  );
  if (combinedResult.success) updated.push("combined");
  else if (combinedResult.error) errors.push(`Combined: ${combinedResult.error}`);

  return { success: errors.length === 0, errors, updated };
}
