/**
 * GlobalDataProvider — Obsidian Plugin
 * Direct copy of apps/word-addin/src/context/GlobalDataProvider.tsx.
 * No chrome.runtime.onMessage listener — identical to word-addin version.
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
import { onSnapshot, doc, getDoc, setDoc } from "firebase/firestore";
import { db } from "../config/firebase";
import type { User, CombinedLeaderboard, Project } from "@writinghabit/models";
import { initializeCombinedLeaderboard } from "@writinghabit/utils";
import { useNavigation } from "./NavigationProvider";
import dayjs from "dayjs";

interface GlobalDataContextType {
  user: User | null;
  userId: string | null;
  userLoading: boolean;
  combinedLeaderboard: CombinedLeaderboard | null;
  allFeatures: any[];
  featuresLoading: boolean;
  isOnline: boolean;
  getProject: (projectId: string) => Project | null;
  setProject: (projectId: string, project: Project) => void;
  hasProject: (projectId: string) => boolean;
  patchProjectCounts: (
    projectId: string,
    todayYMD: string,
    dailyTyped: number,
    dailyNet: number,
    totalTyped: number,
    totalNet: number
  ) => void;
}

const GlobalDataContext = createContext<GlobalDataContextType | undefined>(undefined);

export function useGlobalData() {
  const ctx = useContext(GlobalDataContext);
  if (!ctx) throw new Error("useGlobalData must be used within GlobalDataProvider");
  return ctx;
}

interface GlobalDataProviderProps {
  children: ReactNode;
  userId: string | null;
}

export function GlobalDataProvider({ children, userId }: GlobalDataProviderProps) {
  const { currentView } = useNavigation();

  const [user, setUser] = useState<User | null>(null);
  const [userLoading, setUserLoading] = useState(true);
  const [combinedLeaderboard, setCombinedLeaderboard] =
    useState<CombinedLeaderboard | null>(null);
  const [allFeatures, setAllFeatures] = useState<any[]>([]);
  const [featuresLoading, setFeaturesLoading] = useState(true);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [projects, setProjectsState] = useState<Map<string, Project>>(new Map());
  const projectsRef = useRef(projects);
  projectsRef.current = projects;

  const leaderboardInitializedRef = useRef(false);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);
    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  useEffect(() => {
    if (!userId || !user || leaderboardInitializedRef.current) return;
    const init = async () => {
      const currentYear = dayjs().format("YYYY");
      const ref = doc(db, "userLeaderboard", userId, "combinedLeaderboard", currentYear);
      const snap = await getDoc(ref);
      if (!snap.exists()) {
        await setDoc(ref, initializeCombinedLeaderboard({ user, manuallyTracked: false }));
      }
      leaderboardInitializedRef.current = true;
    };
    init().catch((err) =>
      console.error("[GlobalDataProvider] Error initializing combinedLeaderboard:", err)
    );
  }, [userId, user]);

  useEffect(() => {
    const load = async () => {
      try {
        const snap = await getDoc(doc(db, "features", "writing-habit"));
        if (snap.exists()) {
          const features = Object.values(snap.data()).sort(
            (a: any, b: any) => a.order - b.order
          );
          setAllFeatures(features);
        } else {
          setAllFeatures([]);
        }
      } catch (err) {
        console.error("[GlobalDataProvider] Error loading features:", err);
        setAllFeatures([]);
      } finally {
        setFeaturesLoading(false);
      }
    };
    load();
  }, []);

  useEffect(() => {
    if (!userId) {
      setUser(null);
      setUserLoading(false);
      return;
    }
    setUserLoading(true);
    const unsubscribe = onSnapshot(
      doc(db, "users", userId),
      (snap) => {
        setUser(snap.exists() ? ({ ...snap.data(), id: snap.id } as User) : null);
        setUserLoading(false);
      },
      (err) => {
        console.error("[GlobalDataProvider] User listener error:", err);
        setUser(null);
        setUserLoading(false);
      }
    );
    return unsubscribe;
  }, [userId]);

  useEffect(() => {
    if (
      !userId ||
      (currentView !== "dashboard" &&
        currentView !== "projectDetail" &&
        currentView !== "leaderboard")
    ) {
      setCombinedLeaderboard(null);
      return;
    }
    const currentYear = dayjs().format("YYYY");
    const unsubscribe = onSnapshot(
      doc(db, "userLeaderboard", userId, "combinedLeaderboard", currentYear),
      (snap) => {
        setCombinedLeaderboard(
          snap.exists() ? (snap.data() as CombinedLeaderboard) : null
        );
      },
      (err) => {
        console.error("[GlobalDataProvider] Leaderboard listener error:", err);
        setCombinedLeaderboard(null);
      }
    );
    return unsubscribe;
  }, [userId, currentView]);

  const getProject = useCallback(
    (projectId: string): Project | null => projectsRef.current.get(projectId) ?? null,
    []
  );

  const setProject = useCallback((projectId: string, project: Project) => {
    setProjectsState((prev) => {
      const next = new Map(prev);
      next.set(projectId, project);
      return next;
    });
  }, []);

  const hasProject = useCallback(
    (projectId: string): boolean => projectsRef.current.has(projectId),
    []
  );

  const patchProjectCounts = useCallback(
    (
      projectId: string,
      todayYMD: string,
      dailyTyped: number,
      dailyNet: number,
      totalTyped: number,
      totalNet: number
    ) => {
      setCombinedLeaderboard((prev) => {
        if (!prev) return prev;
        const existing = (prev.projectCounts as any)?.[projectId] ?? {};
        const oldDailyTyped = existing.daily?.[todayYMD] ?? 0;
        const newDailyTyped = Math.max(dailyTyped, oldDailyTyped);
        const delta = newDailyTyped - oldDailyTyped;
        const updatedEntry = {
          ...existing,
          daily: { ...(existing.daily ?? {}), [todayYMD]: newDailyTyped },
          dailyNet: {
            ...(existing.dailyNet ?? {}),
            [todayYMD]: dailyNet,
          },
          total: Math.max(totalTyped, existing.total ?? 0),
          netTotal: Math.max(totalNet, existing.netTotal ?? 0),
        };
        return {
          ...prev,
          currentDayWords: (prev.currentDayWords ?? 0) + delta,
          [todayYMD]: ((prev as any)[todayYMD] ?? 0) + delta,
          dailyWordsTotal: {
            ...(prev.dailyWordsTotal ?? {}),
            [todayYMD]: ((prev.dailyWordsTotal as any)?.[todayYMD] ?? 0) + delta,
          },
          projectCounts: {
            ...(prev.projectCounts as any),
            [projectId]: updatedEntry,
          },
        };
      });
    },
    []
  );

  const value = useMemo<GlobalDataContextType>(
    () => ({
      user,
      userId,
      userLoading,
      combinedLeaderboard,
      allFeatures,
      featuresLoading,
      isOnline,
      getProject,
      setProject,
      hasProject,
      patchProjectCounts,
    }),
    [
      user,
      userId,
      userLoading,
      combinedLeaderboard,
      allFeatures,
      featuresLoading,
      isOnline,
      getProject,
      setProject,
      hasProject,
      patchProjectCounts,
    ]
  );

  return (
    <GlobalDataContext.Provider value={value}>{children}</GlobalDataContext.Provider>
  );
}
