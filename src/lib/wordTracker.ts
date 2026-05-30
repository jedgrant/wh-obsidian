/**
 * Word Tracker — Obsidian Plugin
 *
 * Uses two Obsidian workspace events:
 *
 *  • `editor-paste`  — fires before the paste is applied; gives direct
 *    ClipboardEvent access so we can read the pasted text and count its words
 *    exactly. Sets a `pendingPaste` flag consumed by the next change event.
 *
 *  • `editor-change` — fires after any edit. We compute the word delta against
 *    the last known count and attribute it to typed/pasted/cut using the flag.
 *
 * This is cleaner than the Word add-in's heuristic threshold approach because
 * Obsidian gives us the raw clipboard content directly.
 *
 * Mirrors the interface of apps/word-addin/src/lib/wordTracking.ts so the
 * session manager can be reused without modification.
 */

import type { App, Editor, MarkdownFileInfo, TFile } from "obsidian";
import { MarkdownView } from "obsidian";
import { countWords } from "@writinghabit/utils";
import type { SessionChange } from "@writinghabit/models";

export interface WordChangeEvent {
  /** Total word count of the active file right now */
  totalWords: number;
  /** Plain text content of the active file */
  content: string;
  /** Session change deltas since the last flush */
  sessionChange: SessionChange;
  /** The Obsidian TFile that was being edited */
  file: TFile;
}

export type WordChangeCallback = (event: WordChangeEvent) => void;

/** Called when the active file changes so the caller can flush + start a new session. */
export type FileChangeCallback = (newFile: TFile | null, prevFile: TFile | null) => void;

interface TrackerState {
  lastWordCount: number;
  /** Accumulated typed word additions since last flush */
  pendingAdd: number;
  /** Accumulated pasted word additions since last flush */
  pendingInsert: number;
  /** Accumulated cut words since last flush */
  pendingCut: number;
  /** Set to true by editor-paste; consumed by next editor-change flush */
  pendingPaste: boolean;
  /** Debounce timer handle */
  debounceTimer: ReturnType<typeof setTimeout> | null;
}

export interface WordTracker {
  /** Remove all event listeners and cancel pending timers. */
  stop: () => void;
  /** Flush pending word-count state for the currently active file immediately. */
  flushActive: () => void;
}

/**
 * Starts word tracking for all Markdown editors in the vault.
 *
 * Returns a WordTracker with stop() and flushActive() methods.
 * Call stop() when the plugin unloads or tracking is disabled.
 */
export function startWordTracking(
  obsidianApp: App,
  onChange: WordChangeCallback,
  onFileChange: FileChangeCallback,
  debounceMs = 1300
): WordTracker {
  const { workspace } = obsidianApp;

  // Per-file state so switching files doesn't corrupt counts
  const fileStates = new Map<string, TrackerState>();
  let activeFile: TFile | null = null;

  function getState(file: TFile): TrackerState {
    if (!fileStates.has(file.path)) {
      fileStates.set(file.path, {
        lastWordCount: 0,
        pendingAdd: 0,
        pendingInsert: 0,
        pendingCut: 0,
        pendingPaste: false,
        debounceTimer: null,
      });
    }
    return fileStates.get(file.path)!;
  }

  function getCurrentFile(info: MarkdownView | MarkdownFileInfo): TFile | null {
    return (info as MarkdownView).file ?? null;
  }

  // ── Seed the currently active file immediately so the first edit doesn't
  // count all existing document words as typed. This handles both initial
  // plugin load and tracker restart (e.g. after plugin re-enable).
  const initView = workspace.getActiveViewOfType(MarkdownView);
  if (initView?.file && initView?.editor) {
    activeFile = initView.file;
    const initState = getState(initView.file);
    initState.lastWordCount = countWords(initView.editor.getValue());
  }

  // ── editor-paste: capture clipboard words before paste is applied ─────────
  const pasteRef = workspace.on(
    "editor-paste",
    (evt: ClipboardEvent, editor: Editor, info: MarkdownView | MarkdownFileInfo) => {
      const file = getCurrentFile(info);
      if (!file) return;

      const state = getState(file);
      state.pendingPaste = true;

      // Pre-count the clipboard text so we have it ready even if the editor
      // normalises whitespace or strips formatting.
      const text = evt.clipboardData?.getData("text/plain") ?? "";
      if (text) {
        // Store the clipboard word count to cross-check against the delta.
        // We still use the delta for final accuracy (e.g. replace-on-paste).
        (state as TrackerState & { _clipboardWords?: number })._clipboardWords =
          countWords(text);
      }
    }
  );

  // ── editor-change: compute delta and schedule flush ───────────────────────
  const changeRef = workspace.on(
    "editor-change",
    (editor: Editor, info: MarkdownView | MarkdownFileInfo) => {
      const file = getCurrentFile(info);
      if (!file) return;

      const state = getState(file);
      const newContent = editor.getValue();
      const newWordCount = countWords(newContent);
      const delta = newWordCount - state.lastWordCount;

      if (delta > 0) {
        if (state.pendingPaste) {
          state.pendingInsert += delta;
          state.pendingPaste = false;
          (state as any)._clipboardWords = undefined;
        } else {
          state.pendingAdd += delta;
        }
      } else if (delta < 0) {
        state.pendingCut += Math.abs(delta);
        // Clear paste flag on cut — user deleted instead of replacing
        state.pendingPaste = false;
      }
      // delta === 0: formatting change, ignore

      state.lastWordCount = newWordCount;

      // Debounce: reset timer on each change
      if (state.debounceTimer !== null) {
        clearTimeout(state.debounceTimer);
      }
      state.debounceTimer = setTimeout(() => {
        state.debounceTimer = null;
        flushState(file, state, newContent, newWordCount);
      }, debounceMs);
    }
  );

  // ── active-leaf-change: notify caller when file switches ─────────────────
  const leafRef = workspace.on("active-leaf-change", () => {
    const view = workspace.getActiveViewOfType(MarkdownView);
    const newFile: TFile | null = view?.file ?? null;
    const prevFile = activeFile;

    if (newFile?.path !== prevFile?.path) {
      // Flush any pending state for the file we're leaving.
      // Note: the active view has already switched by this point, so we use
      // state.lastWordCount (not the editor) for the word total.
      if (prevFile) {
        const state = fileStates.get(prevFile.path);
        if (state) {
          if (state.debounceTimer !== null) {
            clearTimeout(state.debounceTimer);
            state.debounceTimer = null;
          }
          if (state.pendingAdd || state.pendingInsert || state.pendingCut) {
            flushState(prevFile, state, "", state.lastWordCount);
          }
        }
      }

      activeFile = newFile;
      onFileChange(newFile, prevFile);

      // Seed lastWordCount for the newly active file so the first edit delta
      // is correct (not all existing words counted as typed).
      // We use vault.cachedRead instead of editor.getValue() because Obsidian
      // fires active-leaf-change before the editor has loaded the new file's
      // content — editor.getValue() can still return the previous file's text.
      if (newFile) {
        // Ensure the state object exists in the map before the async callback runs.
        getState(newFile);
        const capturedPath = newFile.path;
        obsidianApp.vault.cachedRead(newFile)
          .then((content) => {
            const s = fileStates.get(capturedPath);
            // Only update the seed if no editing has started yet.
            if (s && !s.pendingAdd && !s.pendingInsert && !s.pendingCut) {
              s.lastWordCount = countWords(content);
            }
          })
          .catch(() => {
            // Fallback: read from the editor if vault access fails.
            const s = fileStates.get(capturedPath);
            if (s && !s.pendingAdd && !s.pendingInsert && !s.pendingCut) {
              const activeView = obsidianApp.workspace.getActiveViewOfType(MarkdownView);
              if (activeView?.file?.path === capturedPath && activeView.editor) {
                s.lastWordCount = countWords(activeView.editor.getValue());
              }
            }
          });
      }
    }
  });

  // ── flush helper ──────────────────────────────────────────────────────────
  function flushState(
    file: TFile,
    state: TrackerState,
    content: string,
    totalWords: number
  ) {
    if (!state.pendingAdd && !state.pendingInsert && !state.pendingCut) return;

    const sessionChange: SessionChange = {
      add: state.pendingAdd,
      insert: state.pendingInsert,
      cut: state.pendingCut,
    };
    state.pendingAdd = 0;
    state.pendingInsert = 0;
    state.pendingCut = 0;
    state.pendingPaste = false;

    onChange({ totalWords, content, sessionChange, file });
  }

  // ── flush active file (for use on unload) ────────────────────────────────
  function flushActive() {
    if (!activeFile) return;
    const state = fileStates.get(activeFile.path);
    if (!state) return;
    if (state.debounceTimer !== null) {
      clearTimeout(state.debounceTimer);
      state.debounceTimer = null;
    }
    if (state.pendingAdd || state.pendingInsert || state.pendingCut) {
      const view = workspace.getActiveViewOfType(MarkdownView);
      const content = view?.editor?.getValue() ?? "";
      flushState(activeFile, state, content, state.lastWordCount);
    }
  }

  // ── cleanup ───────────────────────────────────────────────────────────────
  return {
    stop() {
      workspace.offref(pasteRef);
      workspace.offref(changeRef);
      workspace.offref(leafRef);

      // Cancel all pending timers
      for (const state of fileStates.values()) {
        if (state.debounceTimer !== null) {
          clearTimeout(state.debounceTimer);
        }
      }
      fileStates.clear();
    },
    flushActive,
  };
}


