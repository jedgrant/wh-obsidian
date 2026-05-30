import { ItemView, WorkspaceLeaf } from "obsidian";
import { createRoot, type Root } from "react-dom/client";
import React from "react";
import { App as WHApp } from "../App";

export const VIEW_TYPE = "writing-habit-sidebar";

const FIGTREE_HREF =
  "https://fonts.googleapis.com/css2?family=Figtree:ital,wght@0,300..900;1,300..900&display=swap";

function ensureFigtreeLoaded() {
  if (!document.querySelector(`link[href="${FIGTREE_HREF}"]`)) {
    const link = document.createElement("link");
    link.rel = "stylesheet";
    link.href = FIGTREE_HREF;
    document.head.appendChild(link);
  }
}

export class ObsidianSidebarView extends ItemView {
  private root: Root | null = null;
  private shadowHost: HTMLDivElement | null = null;

  constructor(leaf: WorkspaceLeaf) {
    super(leaf);
  }

  getViewType(): string {
    return VIEW_TYPE;
  }

  getDisplayText(): string {
    return "Writing Habit";
  }

  getIcon(): string {
    return "pen-line";
  }

  async onOpen(): Promise<void> {
    ensureFigtreeLoaded();

    const container = this.containerEl.children[1] as HTMLElement;
    container.empty();
    container.addClass("writing-habit-sidebar");

    // Render inside a Shadow DOM so Obsidian's global CSS cannot leak in.
    this.shadowHost = document.createElement("div");
    this.shadowHost.style.cssText = "display:block;height:100%;";
    container.appendChild(this.shadowHost);

    const shadow = this.shadowHost.attachShadow({ mode: "open" });

    // transform:translateZ(0) creates a new containing block for position:fixed
    // children. Without it, MUI backdrops (position:fixed) would cover the full
    // viewport, escaping the sidebar and blocking Obsidian's UI. With it, all
    // MUI dialogs/menus/popovers (disablePortal:true in theme) are contained
    // within the sidebar panel.
    const mountPoint = document.createElement("div");
    mountPoint.style.cssText = "height:100%; transform:translateZ(0); overflow:hidden;";
    shadow.appendChild(mountPoint);

    this.root = createRoot(mountPoint);
    this.root.render(
      React.createElement(WHApp, { obsidianApp: this.app, shadowRoot: shadow })
    );
  }

  async onClose(): Promise<void> {
    this.root?.unmount();
    this.root = null;
    this.shadowHost = null;
  }
}
