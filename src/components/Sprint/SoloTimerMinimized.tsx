/**
 * Solo Timer Minimized - Minimized view of timer sprint
 * Matches web app's SoloTimerMinimized.tsx component exactly
 */

import { KeyboardArrowUp } from "@mui/icons-material";
import { Box, Button, LinearProgress, Stack, Typography } from "@mui/material";
import React from "react";

interface Props {
  goalProgress: number;
  time: string;
  color: "primary" | "error" | "warning";
  setMinimized: (minimized: boolean) => void;
  handleQuit: () => void;
}

export default function SoloTimerMinimized({
  goalProgress,
  time,
  color,
  setMinimized,
  handleQuit,
}: Props) {
  return (
    <Box
      sx={{
        borderTopLeftRadius: "16px",
        overflow: "hidden",
        position: "fixed",
        right: 0,
        bottom: 52,
        zIndex: 1000,
      }}
      onClick={() => setMinimized(false)}
    >
      <Box sx={{ opacity: 0.5 }}>
        <Stack
          sx={{
            p: 2,
            px: 2,
            pb: 1.5,
            opacity: 0.8,
            bgcolor: "background.paper",
          }}
          flexDirection="row"
          alignItems="center"
          columnGap={1}
        >
          <Typography variant="h3" color={`text.${color}`}>
            {time}
          </Typography>
          <Button
            size="small"
            onClick={() => setMinimized(false)}
            color="inherit"
            sx={{ p: 0.5, minWidth: "auto" }}
          >
            <KeyboardArrowUp sx={{ fontSize: "1.2rem", mt: -0.5 }} />
          </Button>
        </Stack>
        <LinearProgress
          variant="determinate"
          color={color}
          value={goalProgress}
          sx={{
            height: 6,
            "& .MuiLinearProgress-bar": {
              borderRadius: 5,
            },
          }}
        />
      </Box>
    </Box>
  );
}
