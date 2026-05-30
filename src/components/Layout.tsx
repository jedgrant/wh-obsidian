/**
 * Layout Component for Obsidian Plugin
 *
 * Adapted from chrome-ext Layout.tsx:
 * - Removed chrome.runtime context-invalidation checks
 * - Kept offline/syncing banner and tracking banner
 */

import React, { useState, useEffect } from "react";
import { Box, Alert } from "@mui/material";
import { Header } from "./Header";
import { NavigationDrawer } from "./NavigationDrawer";
import { useNavigation } from "../context/NavigationProvider";
import { useGlobalData } from "../context/GlobalDataProvider";
import { waitForPendingWrites } from "firebase/firestore";
import { db } from "../config/firebase";
import type { ViewName } from "../context/NavigationProvider";
import type { TFile } from "obsidian";
import type { FileTrackingMode } from "../hooks/useFileTracking";

interface LayoutProps {
  children: React.ReactNode;
  onNavigate: (view: ViewName) => void;
  activeFile?: TFile | null;
  activeFileMode?: FileTrackingMode;
  onActiveFileModeChange?: (mode: FileTrackingMode) => void;
  /** True when the loaded vault project belongs to a different user account */
  wrongAccount?: boolean;
}

export function Layout({ children, onNavigate, activeFile, activeFileMode, onActiveFileModeChange, wrongAccount }: LayoutProps) {
  const { currentView, hasActiveProject, projectTitle } = useNavigation();
  const { isOnline } = useGlobalData();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);

  useEffect(() => {
    const handleOnline = async () => {
      setIsSyncing(true);
      try {
        await waitForPendingWrites(db);
      } finally {
        setIsSyncing(false);
      }
    };
    const handleOffline = () => setIsSyncing(false);

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);
    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  const handleNavigate = (view: ViewName) => {
    onNavigate(view);
    setDrawerOpen(false);
  };

  return (
    <Box sx={{ height: "100vh", display: "flex", flexDirection: "column" }}>
      <Header
        onMenuClick={() => setDrawerOpen((o) => !o)}
        activeFile={activeFile ?? null}
        activeFileMode={activeFileMode ?? "full"}
        onFileModeChange={onActiveFileModeChange}
      />

      {wrongAccount && (
        <Alert severity="warning" sx={{ mx: 1, mt: 1, py: 0 }}>
          This vault was tracked with a different account. Switch accounts to see your projects.
        </Alert>
      )}

      {!isOnline && (
        <Alert severity="info" sx={{ mx: 1, mt: 1, py: 0 }}>
          Offline — words are saved locally and will sync when you reconnect.
        </Alert>
      )}
      {isOnline && isSyncing && (
        <Alert severity="success" sx={{ mx: 1, mt: 1, py: 0 }}>
          Back online — syncing your words…
        </Alert>
      )}

      {/* {hasActiveProject && projectTitle && currentView !== "projectDetail" && (
        <Alert
          severity="info" variant="filled"
          sx={{ mb: 1, py: 0, cursor: "pointer" }}
          onClick={() => handleNavigate("projectDetail")}
        >
          Tracking: <strong>{projectTitle}</strong> — tap to view
        </Alert>
      )} */}

      <Box sx={{ flexGrow: 1, overflow: "auto" }}>{children}</Box>

      <NavigationDrawer
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        currentView={currentView}
        onNavigate={handleNavigate}
        isTrackingProject={hasActiveProject}
      />
    </Box>
  );
}
