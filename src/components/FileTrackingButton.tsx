/**
 * FileTrackingButton — Obsidian Plugin
 *
 * Shows the current file's tracking mode and lets the user change it via a menu.
 *
 * Modes:
 *   full   — counts toward project total + daily stats / leaderboard
 *   stats  — daily stats / leaderboard only (not project word count)
 *   ignore — not tracked at all
 */

import React, { useState } from "react";
import {
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Tooltip,
  Box,
  Typography,
} from "@mui/material";
import TrackChangesIcon from "@mui/icons-material/TrackChanges";
import BarChartIcon from "@mui/icons-material/BarChart";
import VisibilityOffIcon from "@mui/icons-material/VisibilityOff";
import type { FileTrackingMode } from "../hooks/useFileTracking";

interface FileTrackingButtonProps {
  mode: FileTrackingMode;
  fileName: string | null;
  onChange: (mode: FileTrackingMode) => void;
  disabled?: boolean;
}

const modeConfig: Record<
  FileTrackingMode,
  {
    label: string;
    icon: React.ReactElement;
    color: string;
    description: string;
  }
> = {
  full: {
    label: "Tracked",
    icon: <TrackChangesIcon sx={{ fontSize: 16 }} />,
    color: "success.main",
    description: "Counts toward project total + daily stats",
  },
  stats: {
    label: "Stats only",
    icon: <BarChartIcon fontSize="small" />,
    color: "warning.main",
    description: "Daily stats & leaderboard only — not project total",
  },
  ignore: {
    label: "Ignored",
    icon: <VisibilityOffIcon fontSize="small" />,
    color: "text.disabled",
    description: "Not tracked at all",
  },
};

const modeOrder: FileTrackingMode[] = ["full", "stats", "ignore"];

export function FileTrackingButton({
  mode,
  fileName,
  onChange,
  disabled,
}: FileTrackingButtonProps) {
  const [open, setOpen] = useState(false);
  const config = modeConfig[mode];

  const handleOpen = (e: React.MouseEvent<HTMLElement>) => {
    e.stopPropagation();
    setOpen(true);
  };

  const handleClose = () => setOpen(false);

  const handleSelect = (newMode: FileTrackingMode) => {
    onChange(newMode);
    handleClose();
  };

  return (
    <>
      <Tooltip
        title={
          fileName ? `${fileName}: ${config.description}` : config.description
        }
        placement="bottom"
      >
        <Box component="span">
          <Button
            size="small"
            color="inherit"
            startIcon={
              <Box
                component="span"
                sx={{ color: config.color, display: "flex" }}
              >
                {config.icon}
              </Box>
            }
            onClick={handleOpen}
            disabled={disabled}
            sx={{
              minWidth: 0,
              px: 0.5,
              fontSize: "0.7rem",
              textTransform: "none",
            }}
          >
            {config.label}
          </Button>
        </Box>
      </Tooltip>

      <Dialog open={open} onClose={handleClose} maxWidth="xs" fullWidth>
        <DialogTitle sx={{ pb: 1 }}>
          {fileName ? `Tracking: ${fileName}` : "File Tracking Mode"}
        </DialogTitle>
        <DialogContent sx={{ pt: 0 }}>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Control how this file's words are counted. Use{" "}
            <strong>Tracked</strong> for files that are part of your project's
            word count. Switch to <strong>Stats only</strong> for notes or
            research you want in your daily stats but not the project total.
            Choose <strong>Ignored</strong> to exclude a file entirely — useful
            for outlines, templates, or scratch pads.
          </Typography>
          <List disablePadding>
            {modeOrder.map((m) => {
              const c = modeConfig[m];
              return (
                <ListItemButton
                  key={m}
                  selected={m === mode}
                  onClick={() => handleSelect(m)}
                  sx={{ borderRadius: 1, mb: 0.5 }}
                >
                  <ListItemIcon sx={{ color: c.color, minWidth: 36 }}>
                    {c.icon}
                  </ListItemIcon>
                  <ListItemText
                    primary={c.label}
                    secondary={c.description}
                    primaryTypographyProps={{
                      variant: "body2",
                      fontWeight: m === mode ? 600 : 400,
                    }}
                    secondaryTypographyProps={{
                      variant: "caption",
                      lineHeight: 1.3,
                    }}
                  />
                </ListItemButton>
              );
            })}
          </List>
        </DialogContent>
      </Dialog>
    </>
  );
}
