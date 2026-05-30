/**
 * useFileTracking — Obsidian Plugin
 *
 * Reads tracking mode from project.chapterTracking (Firestore source of truth).
 * Mode changes write directly to Firestore via updateProject.
 */

import { useCallback } from "react";
import type { Project, ChapterTrackingMode } from "@writinghabit/models";
import { updateProject } from "../store/project";

export type FileTrackingMode = ChapterTrackingMode;

interface UseFileTrackingResult {
  mode: ChapterTrackingMode;
  setMode: (mode: ChapterTrackingMode) => Promise<void>;
}

export function useFileTracking(
  projectId: string | null,
  chapterId: string | null,
  project: Project | null,
  onProjectUpdate: (updated: Project) => void
): UseFileTrackingResult {
  // Mode is derived directly from Firestore project data.
  const mode: ChapterTrackingMode =
    chapterId && project?.chapterTracking?.[chapterId]
      ? project.chapterTracking[chapterId]
      : "full";

  const setMode = useCallback(
    async (newMode: ChapterTrackingMode) => {
      if (!projectId || !chapterId || !project) return;
      const updatedTracking = { ...(project.chapterTracking ?? {}), [chapterId]: newMode };
      const updatedProject: Project = { ...project, chapterTracking: updatedTracking };
      onProjectUpdate(updatedProject);
      await updateProject(projectId, { chapterTracking: updatedTracking }).catch((err) =>
        console.error("[useFileTracking] updateProject failed:", err)
      );
    },
    [projectId, chapterId, project, onProjectUpdate]
  );

  return { mode, setMode };
}
