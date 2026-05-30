/**
 * Header Component for Obsidian Plugin
 *
 * Shows the hamburger menu + the current file's tracking mode chip.
 */

import React from "react";
import { Box, Button } from "@mui/material";
import MenuIcon from "@mui/icons-material/Menu";
import { FileTrackingButton } from "./FileTrackingButton";
import type { TFile } from "obsidian";
import type { FileTrackingMode } from "../hooks/useFileTracking";

interface HeaderProps {
  onMenuClick: () => void;
  activeFile: TFile | null;
  activeFileMode: FileTrackingMode;
  onFileModeChange?: (mode: FileTrackingMode) => void;
}

export function Header({ onMenuClick, activeFile, activeFileMode, onFileModeChange }: HeaderProps) {
  return (
    <Box mb={1} sx={{ display: "flex", alignItems: "center", gap: 0.5 }} justifyContent={"space-between"}>
      <Button
        startIcon={<MenuIcon fontSize="small" sx={{ mt: -0.3 }} />}
        onClick={onMenuClick}
        size="small"
        color="inherit"
      >
        Menu
      </Button>
      <FileTrackingButton
        mode={activeFileMode}
        fileName={activeFile?.basename ?? null}
        onChange={onFileModeChange ?? (() => {})}
        disabled={!activeFile}
      />
    </Box>
  );
}
