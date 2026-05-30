/**
 * useVaultDetection — Obsidian Plugin
 *
 * Replaces apps/word-addin/src/hooks/useDocumentDetection.ts.
 *
 * Maps the Obsidian vault and active file onto the same conceptual model:
 *  - vault        → project  (projectId = "obsidian_<hashHex8(vaultName)>")
 *  - active .md file → chapter (chapterId = file.path hash, title = file.basename)
 *
 * Uses a simple djb2 hash so the same vault always produces the same project ID
 * without any Firestore round-trip.
 */

import { useState, useEffect, useCallback } from "react";
import type { App as ObsidianApp, TFile } from "obsidian";
import { MarkdownView } from "obsidian";

export interface VaultDetectionResult {
  projectId: string | null;
  projectTitle: string | null;
  chapterId: string | null;
  chapterTitle: string | null;
  activeFile: TFile | null;
  isReady: boolean;
}

/**
 * djb2 hash → 8-char hex string.
 * Stable for a given vault name across restarts.
 */
function djb2Hash(str: string): string {
  let hash = 5381;
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) + hash) ^ str.charCodeAt(i);
    hash = hash >>> 0; // Keep unsigned 32-bit
  }
  return hash.toString(16).padStart(8, "0");
}

export function vaultNameToProjectId(vaultName: string): string {
  return `obsidian_${djb2Hash(vaultName)}`;
}

export function filePathToChapterId(filePath: string): string {
  return `ch_${djb2Hash(filePath)}`;
}

/**
 * React hook that returns the current vault project ID and active file chapter ID.
 * Re-runs whenever the active leaf changes in Obsidian.
 *
 * @param obsidianApp - The Obsidian `App` instance passed down from the plugin.
 */
export function useVaultDetection(obsidianApp: ObsidianApp | null): VaultDetectionResult {
  const [activeFile, setActiveFile] = useState<TFile | null>(null);

  const getActiveMarkdownFile = useCallback((): TFile | null => {
    if (!obsidianApp) return null;
    const view = obsidianApp.workspace.getActiveViewOfType(MarkdownView);
    return view?.file ?? null;
  }, [obsidianApp]);

  useEffect(() => {
    if (!obsidianApp) return;

    // Seed initial value
    setActiveFile(getActiveMarkdownFile());

    // Update on leaf changes — only switch to a new file, never clear to null
    // when the user focuses the plugin panel or another non-markdown view.
    const eventRef = obsidianApp.workspace.on("active-leaf-change", () => {
      const newFile = getActiveMarkdownFile();
      if (newFile !== null) {
        setActiveFile(newFile);
      }
    });

    return () => {
      obsidianApp.workspace.offref(eventRef);
    };
  }, [obsidianApp, getActiveMarkdownFile]);

  if (!obsidianApp) {
    return {
      projectId: null,
      projectTitle: null,
      chapterId: null,
      chapterTitle: null,
      activeFile: null,
      isReady: false,
    };
  }

  const vaultName = obsidianApp.vault.getName();
  const projectId = vaultNameToProjectId(vaultName);
  const projectTitle = vaultName;

  const chapterId = activeFile ? filePathToChapterId(activeFile.path) : null;
  const chapterTitle = activeFile ? activeFile.basename : null;

  return {
    projectId,
    projectTitle,
    chapterId,
    chapterTitle,
    activeFile,
    isReady: true,
  };
}
