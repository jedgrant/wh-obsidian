/**
 * SessionContext — Obsidian Plugin
 * Direct copy of apps/word-addin/src/context/SessionContext.tsx.
 */

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useMemo,
  useRef,
  type ReactNode,
} from "react";
import {
  onSnapshot,
  collection,
  query,
  doc,
  getDoc,
  where,
  documentId,
} from "firebase/firestore";
import { db } from "../config/firebase";
import { useGlobalData } from "./GlobalDataProvider";
import { useSprint } from "./SprintContext";
import type {
  Session,
  SessionData,
  SessionDays,
  SessionDoc,
  UserSessions,
  Project,
  StretchGoal,
  Participant,
  ProjectWords,
} from "@writinghabit/models";
import { useStretchGoal } from "@writinghabit/hooks";
import { updateSprint } from "../lib/sprintManager";
import { getRecentMonthIds } from "../store/sessions";
import dayjs from "dayjs";
import { getMostRecentSession, getSessionsDateRanges } from "@writinghabit/utils";

interface SessionContextType {
  sessionData: SessionData;
  project: Project | null;
  currentChapterId: string;
  sessionLoading: boolean;
  projectLoading: boolean;
  stretchGoalProps: StretchGoal;
  setCurrentChapterId: (id: string) => void;
  updateProject: (updates: Partial<Project>) => void;
}

const defaultSessionData: SessionData = {
  all: {},
  flattened: [],
  current: undefined,
  today: [],
  month: [],
  year: [],
};

const SessionContext = createContext<SessionContextType | undefined>(undefined);

export function useSession() {
  const ctx = useContext(SessionContext);
  if (!ctx) throw new Error("useSession must be used within SessionProvider");
  return ctx;
}

interface SessionProviderProps {
  children: ReactNode;
  projectId: string;
  userId: string;
  initialProject?: Project;
  enabled?: boolean;
}

export function SessionProvider({
  children,
  projectId,
  userId,
  initialProject,
  enabled = true,
}: SessionProviderProps) {
  const { getProject, setProject, combinedLeaderboard } = useGlobalData();
  const { sprint } = useSprint();

  const [sessionData, setSessionData] = useState<SessionData>(defaultSessionData);
  const [project, setProjectState] = useState<Project | null>(initialProject ?? null);
  const [currentChapterId, setCurrentChapterId] = useState<string>("");
  const [sessionLoading, setSessionLoading] = useState(true);
  const [projectLoading, setProjectLoading] = useState(true);

  const todayWordCountRef = useRef(0);

  const todayWordCount = useMemo(
    () =>
      combinedLeaderboard?.projectCounts?.[projectId]?.daily?.[
        dayjs().format("YYYYMMDD")
      ] ?? todayWordCountRef.current,
    [combinedLeaderboard, projectId]
  );

  const dailyGoal = useMemo(() => project?.dailyGoal || 1000, [project?.dailyGoal]);
  const stretchGoalProps = useStretchGoal(todayWordCount, dailyGoal);
  todayWordCountRef.current = todayWordCount;

  // Sprint word count updates
  useEffect(() => {
    if (!sprint || !sprint.started || !sprint.id || !userId || !projectId) return;

    let words = 0;
    sessionData.today?.forEach((session) => {
      if (dayjs(session.endingTime).toDate() > sprint.startTime.toDate()) {
        words += session.typedWords || 0;
      }
    });

    const participant: Participant | undefined = (sprint as any)[userId];
    if (!participant) return;

    const projectWords: ProjectWords = {
      ...participant.projectWords,
      [projectId]: words,
    };
    const totalWords: number = Object.values(projectWords).reduce(
      (sum: number, val: any): number =>
        typeof val === "number" && !isNaN(val) ? sum + val : sum,
      0
    );

    const wordsDiff = totalWords - participant.words;
    if (wordsDiff > 0 || wordsDiff < -3) {
      updateSprint(sprint.id, {
        [userId]: { ...participant, projectWords, words: totalWords },
      }).catch((err) => console.error("[SessionContext] Sprint update error:", err));
    }
  }, [sessionData.today, sprint, userId, projectId]);

  // Session listener
  useEffect(() => {
    if (!enabled || !projectId || !userId) {
      setSessionLoading(false);
      return;
    }

    setSessionLoading(true);
    const recentMonthIds = getRecentMonthIds(3);
    const sessionsQuery = query(
      collection(db, `projects/${projectId}/sessions`),
      where(documentId(), "in", recentMonthIds)
    );

    const unsubscribe = onSnapshot(
      sessionsQuery,
      (snapshot) => {
        setSessionData((prev) => {
          if (!prev && snapshot.empty) {
            setSessionLoading(false);
            return defaultSessionData;
          }

          const sessionMonths = { ...(prev?.all || {}) } as SessionDays;
          let flattened = [...(prev?.flattened || [])] as Session[];

          snapshot.docChanges().forEach((change) => {
            const docSnap = change.doc;
            const sessionDoc = docSnap.data() as SessionDoc;
            const userData: UserSessions = sessionDoc[userId];

            if (change.type === "added" || change.type === "modified") {
              if (!userData) return;
              const incomingArray: Session[] = Object.values(userData);
              const existingById = new Map(flattened.map((s) => [s.id, s]));
              const sessionArray = incomingArray.map((incoming) => {
                const existing = existingById.get(incoming.id);
                if (!existing) return incoming;
                return {
                  ...incoming,
                  typedWords: Math.max(incoming.typedWords ?? 0, existing.typedWords ?? 0),
                  insertWords: Math.max(
                    incoming.insertWords ?? 0,
                    existing.insertWords ?? 0
                  ),
                  cutWords: Math.max(incoming.cutWords ?? 0, existing.cutWords ?? 0),
                  totalWords: Math.max(incoming.totalWords ?? 0, existing.totalWords ?? 0),
                };
              });
              sessionMonths[docSnap.id] = sessionArray;
              const changedIds = new Set(sessionArray.map((s) => s.id));
              flattened = [
                ...flattened.filter((s) => !changedIds.has(s.id)),
                ...sessionArray,
              ];
            } else if (change.type === "removed") {
              delete sessionMonths[docSnap.id];
              if (userData) {
                const removedIds = new Set(Object.keys(userData));
                flattened = flattened.filter((s) => !removedIds.has(s.id!));
              }
            }
          });

          const mostRecentSession = currentChapterId
            ? getMostRecentSession({ flattened } as SessionData, currentChapterId)
            : null;
          const sessionDateRanges = getSessionsDateRanges(flattened);

          setSessionLoading(false);
          return {
            all: sessionMonths,
            flattened,
            current: mostRecentSession || undefined,
            lastUpdated: Date.now(),
            ...sessionDateRanges,
          } as SessionData;
        });
      },
      (error) => {
        console.error("[SessionContext] Session listener error:", error);
        setSessionLoading(false);
      }
    );

    return unsubscribe;
  }, [projectId, userId, enabled]);

  // Project fetch
  useEffect(() => {
    if (!enabled || !projectId || !userId) {
      setProjectLoading(false);
      return;
    }

    if (initialProject) {
      setProjectState(initialProject);
      setProject(projectId, initialProject);
      setProjectLoading(false);
      return;
    }

    const cached = getProject(projectId);
    if (cached) {
      setProjectState(cached);
      setProjectLoading(false);
      return;
    }

    setProjectLoading(true);
    getDoc(doc(db, `projects/${projectId}`))
      .then((snap) => {
        if (snap.exists()) {
          const data = { ...snap.data(), id: snap.id } as Project;
          setProjectState(data);
          setProject(projectId, data);
        } else {
          setProjectState(null);
        }
      })
      .catch((err) => {
        console.error("[SessionContext] Error fetching project:", err);
        setProjectState(null);
      })
      .finally(() => setProjectLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [projectId, userId, enabled, initialProject]);

  // Keep current session in sync when chapterId changes
  useEffect(() => {
    if (!currentChapterId) return;
    setSessionData((prev) => {
      if (!prev?.flattened) return prev;
      const current = getMostRecentSession(prev, currentChapterId);
      return { ...prev, current: current || undefined };
    });
  }, [currentChapterId]);

  const updateProject = useCallback(
    (updates: Partial<Project>) => {
      if (!project) return;
      const updated = { ...project, ...updates };
      setProjectState(updated);
      setProject(projectId, updated);
    },
    [project, projectId, setProject]
  );

  const value: SessionContextType = useMemo(
    () => ({
      sessionData,
      project,
      currentChapterId,
      sessionLoading,
      projectLoading,
      stretchGoalProps,
      setCurrentChapterId,
      updateProject,
    }),
    [
      sessionData,
      project,
      currentChapterId,
      sessionLoading,
      projectLoading,
      stretchGoalProps,
      setCurrentChapterId,
      updateProject,
    ]
  );

  return <SessionContext.Provider value={value}>{children}</SessionContext.Provider>;
}
