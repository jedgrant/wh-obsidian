/**
 * Active Public Sprints Indicator - Shows count of active public sprints
 */

import React from "react";
import { Box, Typography } from "@mui/material";
import { useSprint } from "../../context/SprintContext";

export default function ActivePublicSprintsIndicator() {
  const { publicSprints } = useSprint();
  if (!publicSprints || publicSprints.length < 1) return null;
  const inProgress = publicSprints.some(
    (sprint) => sprint.started && !sprint.complete,
  );


  return (
    <Box
      sx={{
        mr: 1,
        px: 1,
        py: 0.5,
        bgcolor: inProgress ? "success.main" : "error.main",
        borderRadius: 1,
        display: "inline-flex",
        alignItems: "center",
      }}
    >
      <Typography
        variant="caption"
        sx={{ color: "white", fontWeight: "bold", lineHeight: 1 }}
      >
        {publicSprints.length}
      </Typography>
    </Box>
  );
}
