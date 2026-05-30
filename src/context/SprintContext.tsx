/**
 * SprintContext — Obsidian Plugin
 * Direct copy of apps/word-addin/src/context/SprintContext.tsx.
 * Uses localStorage (same as word-addin) so sessionManager can read the active sprint.
 * Sprint key is "wh_obsidian_activeSprint" to namespace it from the web app.
 */

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  type ReactNode,
} from "react";
import { db } from "../config/firebase";
import { SprintModel } from "@writinghabit/models";
import { listenToActiveSprint, listenToPublicSprints } from "@writinghabit/utils";
import { setActiveSprintCache } from "../lib/sessionManager";

interface SprintContextType {
  sprint: SprintModel | null;
  sprintComplete: SprintModel | null;
  publicSprints: SprintModel[];
  sprintLoading: boolean;
  setSprintComplete: (sprint: SprintModel | null) => void;
}

const SprintContext = createContext<SprintContextType | undefined>(undefined);

export function useSprint() {
  const ctx = useContext(SprintContext);
  if (!ctx) throw new Error("useSprint must be used within SprintProvider");
  return ctx;
}

interface SprintProviderProps {
  children: ReactNode;
  userId: string;
  enabled?: boolean;
}

export function SprintProvider({ children, userId, enabled = true }: SprintProviderProps) {
  const [sprint, setSprint] = useState<SprintModel | null>(null);
  const [sprintComplete, setSprintComplete] = useState<SprintModel | null>(null);
  const [publicSprints, setPublicSprints] = useState<SprintModel[]>([]);
  const [sprintLoading, setSprintLoading] = useState(true);

  useEffect(() => {
    if (!enabled || !userId) {
      setSprintLoading(false);
      return;
    }

    const unsubscribe = listenToActiveSprint(db, userId, (activeSprint) => {
      setSprint(activeSprint);
      setSprintLoading(false);
      setActiveSprintCache(activeSprint);
    });

    return unsubscribe;
  }, [userId, enabled]);

  useEffect(() => {
    if (!enabled) return;
    const unsubscribe = listenToPublicSprints(db, (sprints) => {
      setPublicSprints(sprints);
    });
    return unsubscribe;
  }, [enabled]);

  return (
    <SprintContext.Provider
      value={{ sprint, sprintComplete, publicSprints, sprintLoading, setSprintComplete }}
    >
      {children}
    </SprintContext.Provider>
  );
}
