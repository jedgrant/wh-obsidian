import { Plugin, WorkspaceLeaf, Notice } from "obsidian";
import { ObsidianSidebarView, VIEW_TYPE } from "./views/ObsidianSidebarView";
import { signInWithToken } from "./lib/auth";
import { initPluginData } from "./lib/pluginData";

export default class WritingHabitPlugin extends Plugin {
  async onload(): Promise<void> {
    initPluginData(this);

    // Expose the raw plugin directory path and vault adapter so monster images
    // can be resolved to proper Obsidian resource URLs at runtime.
    // We store the raw manifest.dir (vault-relative path) rather than calling
    // getResourcePath on the directory, because getResourcePath appends a
    // ?timestamp query string which breaks URL concatenation.
    (window as any).__WH_MANIFEST_DIR__ = this.manifest.dir;
    (window as any).__WH_VAULT_ADAPTER__ = this.app.vault.adapter;

    // Register our custom sidebar view
    this.registerView(
      VIEW_TYPE,
      (leaf: WorkspaceLeaf) => new ObsidianSidebarView(leaf)
    );

    // Ribbon icon to open the sidebar
    this.addRibbonIcon("pen-line", "Writing Habit", async () => {
      await this.activateSidebar();
    });

    // Deep-link handler for Google OAuth relay
    // The web page at /obsidian-auth redirects to obsidian://writing-habit-auth?token=...
    // after the user signs in with Google in their external browser.
    this.registerObsidianProtocolHandler("writing-habit-auth", async (params) => {
      const token = params["token"];
      if (!token) {
        new Notice("Writing Habit: Missing auth token in deep link.");
        return;
      }
      const result = await signInWithToken(token);
      if ("error" in result) {
        new Notice(`Writing Habit sign-in failed: ${result.error}`);
      } else {
        new Notice("Writing Habit: Signed in successfully!");
        await this.activateSidebar();
      }
    });

    // Status bar item (optional — shows plugin is active)
    const statusBarItem = this.addStatusBarItem();
    statusBarItem.setText("Writing Habit");

    // Open sidebar on load if it was previously open
    if (this.app.workspace.layoutReady) {
      await this.activateSidebar();
    } else {
      this.app.workspace.onLayoutReady(() => {
        this.activateSidebar();
      });
    }
  }

  async onunload(): Promise<void> {
    // Flush any pending word-count state for the active file.
    // flushActive is stored on window by useWordTracking when tracking starts.
    try {
      const flush = (window as any).__WH_FLUSH_ACTIVE_FILE__;
      if (typeof flush === "function") flush();
    } catch (err) {
      console.error("[WritingHabit] Error flushing on unload:", err);
    }

    // Detach all open instances of our view
    this.app.workspace.detachLeavesOfType(VIEW_TYPE);
  }

  async activateSidebar(): Promise<void> {
    const { workspace } = this.app;

    // If already open, just reveal it
    const existing = workspace.getLeavesOfType(VIEW_TYPE);
    if (existing.length > 0) {
      workspace.revealLeaf(existing[0]);
      return;
    }

    // Open in right sidebar
    const leaf = workspace.getRightLeaf(false);
    if (leaf) {
      await leaf.setViewState({ type: VIEW_TYPE, active: true });
      workspace.revealLeaf(leaf);
    }
  }
}
