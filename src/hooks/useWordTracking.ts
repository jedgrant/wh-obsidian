/**
 * useWordTracking — Obsidian Plugin
 *
 * Manages the lifecycle of word tracking for the Obsidian workspace.
 * Mirrors apps/word-addin/src/hooks/useWordTracking.ts but synchronous
 * (Obsidian events don't need an async setup step).
 */

import { useEffect, useRef, useCallback } from "react";
import type { App as ObsidianApp, TFile } from "obsidian";
import {
  startWordTracking,
  type WordChangeCallback,
  type FileChangeCallback,
  type WordTracker,
} from "../lib/wordTracker";

interface UseWordTrackingOptions {
  /** Must be the Obsidian App instance — null while loading */
  obsidianApp: ObsidianApp | null;
  /** Whether tracking is currently active */
  enabled: boolean;
  debounceMs?: number;
  onChange: WordChangeCallback;
  onFileChange: FileChangeCallback;
}

export function useWordTracking({
  obsidianApp,
  enabled,
  debounceMs = 1300,
  onChange,
  onFileChange,
}: UseWordTrackingOptions): void {
  const trackerRef = useRef<WordTracker | null>(null);
  const onChangeRef = useRef<WordChangeCallback>(onChange);
  const onFileChangeRef = useRef<FileChangeCallback>(onFileChange);

  useEffect(() => {
    onChangeRef.current = onChange;
  }, [onChange]);

  useEffect(() => {
    onFileChangeRef.current = onFileChange;
  }, [onFileChange]);

  const stableOnChange = useCallback<WordChangeCallback>((event) => {
    onChangeRef.current(event);
  }, []);

  const stableOnFileChange = useCallback<FileChangeCallback>(
    (newFile: TFile | null, prevFile: TFile | null) => {
      onFileChangeRef.current(newFile, prevFile);
    },
    []
  );

  useEffect(() => {
    if (!enabled || !obsidianApp) return;

    const tracker = startWordTracking(
      obsidianApp,
      stableOnChange,
      stableOnFileChange,
      debounceMs
    );
    trackerRef.current = tracker;
    // Expose flushActive so main.ts can call it synchronously on plugin unload
    (window as any).__WH_FLUSH_ACTIVE_FILE__ = () => tracker.flushActive();

    return () => {
      if (trackerRef.current) {
        trackerRef.current.stop();
        trackerRef.current = null;
      }
      (window as any).__WH_FLUSH_ACTIVE_FILE__ = undefined;
    };
  }, [enabled, obsidianApp, debounceMs, stableOnChange, stableOnFileChange]);
}
