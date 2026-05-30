/**
 * SprintResult - Shows sprint duration and word goal progress
 * Matches web app's SprintResult component
 */

import React from "react";
import { Box, Stack, Typography } from "@mui/material";
import { SprintModel } from "@writinghabit/models";

interface Props {
  sprint: SprintModel;
}

export default function SprintResult({ sprint }: Props) {
  return (
    <Stack direction="row" spacing={2}>
      {/* Duration */}
      <Box>
        <Typography
          variant="caption"
          sx={{ fontSize: "0.65rem", fontWeight: 800 }}
        >
          DURATION
        </Typography>
        <Typography variant="body1" sx={{ fontWeight: 800, lineHeight: 1.1 }}>
          {sprint.duration} min
        </Typography>
      </Box>

      {/* Goal Progress */}
      <Box>
        <Typography
          variant="caption"
          sx={{ fontSize: "0.65rem", fontWeight: 800 }}
        >
          GOAL
        </Typography>
        <Typography variant="body1" sx={{ fontWeight: 800, lineHeight: 1.1 }}>
          {sprint[sprint.owner]?.words ?? 0} / {sprint.goal}
        </Typography>
      </Box>
    </Stack>
  );
}
