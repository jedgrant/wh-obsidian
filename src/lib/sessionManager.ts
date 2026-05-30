/**
 * Session Manager — Obsidian Plugin
 *
 * Mirrors apps/word-addin/src/lib/sessionManager.ts.
 *
 * Key difference from word-addin: Obsidian has many files per vault.
 * Each file maps to a chapter (chapterId = hashed file path), so we pass
 * chapterId explicitly rather than using projectId as the chapter.
 *
 * Active sprint is stored in localStorage, identical to word-addin.
 */

import type { Session, SessionData, SessionChange, Project, User, ChapterTrackingMode, ChapterData } from "@writinghabit/models";
import {
  sessionUpdate,
  getAllCounts,
  checkIncrementalUpdate,
  getSessionsDateRanges,
} from "@writinghabit/utils";
import { Timestamp } from "firebase/firestore";
import dayjs from "dayjs";
import { fetchSessionData, persistSession } from "../store/sessions";
import { getProject, updateProject, createProject } from "../store/project";
import {
  checkShouldUpdateLeaderboard,
  updateAllLeaderboards,
  createUserLeaderboardIfNeeded,
} from "./leaderboardManager";

let pendingLBTypedWords = 0;

// In-memory cache of the active sprint, kept in sync by SprintContext.
// No persistence needed — the sprint is reloaded from Firestore on every plugin start.
let _activeSprintCache: import("@writinghabit/models").SprintModel | undefined;

export function setActiveSprintCache(
  sprint: import("@writinghabit/models").SprintModel | null
): void {
  _activeSprintCache = sprint ?? undefined;
}

function getActiveSprint(): import("@writinghabit/models").SprintModel | undefined {
  return _activeSprintCache;
}

export interface UpdateSessionParams {
  userId: string;
  projectId: string;
  /** Stable hash-based ID for the specific file being edited */
  chapterId: string;
  documentTitle: string;
  /** Title of the active chapter/file (e.g. file.basename in Obsidian) */
  chapterTitle?: string;
  totalWordCount: number;
  content: string;
  sessionChange: SessionChange;
  sessionData?: SessionData;
  project?: Project;
  user: User;
}

export interface UpdateSessionResult {
  success: boolean;
  noChange?: boolean;
  session?: Session;
  allSessions?: SessionData;
  leaderboardUpdated?: boolean;
  updatedProject?: Project;
  error?: string;
}

export async function updateSession(
  params: UpdateSessionParams,
  optimisticUpdate?: (session: Session, allSessions: SessionData, project?: Project) => void
): Promise<UpdateSessionResult> {
  try {
    const {
      userId,
      projectId,
      chapterId,
      documentTitle,
      chapterTitle,
      totalWordCount,
      content,
      sessionChange,
      user,
    } = params;

    const sessionData: SessionData =
      params.sessionData ?? (await fetchSessionData(userId, projectId));

    let project: Project = params.project ??
      (await getProject(projectId)) ?? ({
        id: projectId,
        userId,
        words: totalWordCount,
        title: documentTitle,
      } as unknown as Project);

    // ── Per-chapter word counts (mirrors chrome extension logic) ─────────────
    // Update this chapter's word count in the chapterWords map.
    const updatedChapterWords: { [id: string]: number } = {
      ...(project.chapterWords ?? {}),
      [chapterId]: totalWordCount,
    };
    // Tracking mode for this chapter (default "full" when not set).
    const chapterTracking = project.chapterTracking ?? {};
    const chapterMode: ChapterTrackingMode = chapterTracking[chapterId] ?? "full";
    // project.words = sum of chapterWords where mode is "full" (or not set).
    const computedProjectWords = Object.entries(updatedChapterWords).reduce(
      (sum, [id, w]) => {
        const mode = chapterTracking[id] ?? "full";
        return mode === "full" ? sum + w : sum;
      },
      0
    );

    const sprint = getActiveSprint();

    const chapter = {
      id: chapterId,
      projectId,
      userId,
      words: totalWordCount,
      html: content,
      content,
    } as unknown as Parameters<typeof sessionUpdate>[0]["chapter"];

    const result = await sessionUpdate({
      newChapterWordCount: totalWordCount,
      sessionData,
      chapter,
      user,
      project,
      sprint: sprint as import("@writinghabit/models").SprintModel,
      splitChapter: false,
      pastedContent: (sessionChange.insert ?? 0) > 0,
      sessionChange,
    });

    if (result.noChange) {
      return {
        success: true,
        noChange: true,
        allSessions: result.allSessionData,
        leaderboardUpdated: false,
      };
    }

    if (!result.session || !result.allSessionData) {
      return { success: false, error: "sessionUpdate returned no data" };
    }

    const sessionDate = dayjs(result.session.startingTime).format("YYYY-MM-DD");
    const enrichedSession: Session = { ...result.session, sessionDate };
    const enrichedFlattened = result.allSessionData.flattened.map((s) =>
      s.id === enrichedSession.id ? enrichedSession : s
    );
    const enrichedRanges = getSessionsDateRanges(enrichedFlattened);
    const allSessionData: SessionData = {
      ...result.allSessionData,
      flattened: enrichedFlattened,
      current: enrichedSession,
      ...enrichedRanges,
    };

    // project.words = sum of chapterWords for "full"-tracked files.
    // "stats" files contribute to daily stats / leaderboard but not project total.
    const projectTotal = chapterMode !== "ignore" ? computedProjectWords : project.words;

    // Compute chapter minutes from all session data (sum per chapterId)
    const minutesByChapter: { [id: string]: number } = {};
    for (const session of allSessionData.flattened) {
      const cid = (session.chapterId as string | undefined) ?? chapterId;
      minutesByChapter[cid] = (minutesByChapter[cid] ?? 0) + (session.totalMinutes ?? 0);
    }
    const updatedChapterMinutes: { [id: string]: number } = { ...(project.chapterMinutes ?? {}) };
    for (const [id, mins] of Object.entries(minutesByChapter)) {
      updatedChapterMinutes[id] = Math.round(mins * 10) / 10;
    }

    // Build unified chapterData map
    const updatedChapterData: { [id: string]: ChapterData } = { ...(project.chapterData ?? {}) };
    for (const [id, words] of Object.entries(updatedChapterWords)) {
      const resolvedTitle =
        id === chapterId ? (chapterTitle ?? documentTitle) : updatedChapterData[id]?.title;
      updatedChapterData[id] = {
        ...(resolvedTitle !== undefined && { title: resolvedTitle }),
        words,
        minutes: updatedChapterMinutes[id] ?? 0,
        tracking: chapterTracking[id] ?? "full",
      };
    }

    let updatedProject: Project = {
      ...project,
      words: projectTotal,
      title: documentTitle,
      chapterWords: updatedChapterWords,
      chapterMinutes: updatedChapterMinutes,
      chapterData: updatedChapterData,
    };

    if (optimisticUpdate) {
      optimisticUpdate(enrichedSession, allSessionData, updatedProject);
    }

    persistSession(userId, projectId, enrichedSession).catch((err) =>
      console.error("[SessionManager] session persist failed:", err)
    );

    const { create } = checkIncrementalUpdate(project, projectTotal);
    if (create) {
      createUserLeaderboardIfNeeded(userId, user, project.manuallyTracked || false).catch(
        () => {}
      );
    }

    pendingLBTypedWords += sessionChange.add;

    let leaderboardUpdated = false;
    const lb = await checkShouldUpdateLeaderboard(project, allSessionData);
    if (lb.shouldUpdate) {
      const snapshot = pendingLBTypedWords;
      pendingLBTypedWords = 0;
      const lbResult = await updateAllLeaderboards(
        userId,
        projectId,
        user,
        project,
        allSessionData,
        snapshot
      );
      leaderboardUpdated = lbResult.success;
      if (lbResult.success) {
        const lbTimestamp = Timestamp.now();
        const lbWords = getAllCounts(allSessionData).dayNetWords;
        project = { ...project, lastLBUpdate: lbTimestamp as unknown as string, lastLBWords: lbWords };
        updatedProject = { ...updatedProject, lastLBUpdate: lbTimestamp as unknown as string, lastLBWords: lbWords };
      }
    }

    const wordsChanged = project.words !== projectTotal;
    const titleChanged = project.title !== documentTitle;
    const chapterWordsChanged = project.chapterWords?.[chapterId] !== totalWordCount;
    if (wordsChanged || titleChanged || chapterWordsChanged || leaderboardUpdated) {
      const projectUpdate: Partial<Project> = {
        words: projectTotal,
        title: documentTitle,
        chapterWords: updatedChapterWords,
        chapterMinutes: updatedChapterMinutes,
        chapterData: updatedChapterData,
      };
      if (leaderboardUpdated) {
        projectUpdate.lastLBUpdate = updatedProject.lastLBUpdate;
        projectUpdate.lastLBWords = updatedProject.lastLBWords;
      }
      updateProject(projectId, projectUpdate).catch((err) =>
        console.error("[SessionManager] project update failed:", err)
      );
    }

    return {
      success: true,
      session: enrichedSession,
      allSessions: allSessionData,
      leaderboardUpdated,
      updatedProject,
    };
  } catch (err: unknown) {
    console.error("[SessionManager] updateSession failed:", err);
    return {
      success: false,
      error: (err as Error).message ?? "Unknown error",
    };
  }
}

export async function ensureProjectExists(
  projectId: string,
  vaultName: string,
  userId: string
): Promise<Project> {
  const existing = await getProject(projectId);
  if (existing) return existing;

  const newProject: Partial<Project> = {
    id: projectId,
    userId,
    title: vaultName,
    words: 0,
    manuallyTracked: false,
    app: "obsidian",
    prompt: false,
    tags: [],
    type: 0,
    status: "writing" as Project["status"],
    hasAccess: [userId],
  };

  await createProject(projectId, newProject);
  return newProject as Project;
}
