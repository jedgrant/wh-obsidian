/**
 * Recent Projects Hook for Obsidian Plugin
 * Adapted from chrome-ext — queries app == "obsidian"
 */

import { useEffect, useCallback, useState } from "react";
import { getDocs, collection, query, where, orderBy, limit } from "firebase/firestore";
import { db } from "../config/firebase";
import type { Project } from "@writinghabit/models";

interface UseRecentProjectsProps {
  userId: string | undefined;
  enabled: boolean;
  setProject?: (projectId: string, project: Project) => void;
}

export interface RecentProjectsData {
  projects: Project[];
  loading: boolean;
  refetch: () => Promise<void>;
}

export const useRecentProjects = ({
  userId,
  enabled,
  setProject,
}: UseRecentProjectsProps): RecentProjectsData => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchRecentProjects = useCallback(async () => {
    if (!userId || !enabled) return;
    setLoading(true);
    try {
      const q = query(
        collection(db, "projects"),
        where("userId", "==", userId),
        where("prompt", "==", false),
        where("app", "==", "obsidian"),
        orderBy("lastUpdated", "desc"),
        limit(3)
      );
      const snap = await getDocs(q);
      const list = snap.docs.map((d) => ({ ...d.data(), id: d.id })) as Project[];
      setProjects(list);
      if (setProject) list.forEach((p) => setProject(p.id, p));
    } catch (err) {
      console.error("[useRecentProjects] Error:", err);
      setProjects([]);
    } finally {
      setLoading(false);
    }
  }, [userId, enabled, setProject]);

  useEffect(() => {
    if (enabled && userId) fetchRecentProjects();
  }, [enabled, userId, fetchRecentProjects]);

  useEffect(() => {
    if (!enabled) setProjects([]);
  }, [enabled]);

  return { projects, loading, refetch: fetchRecentProjects };
};
