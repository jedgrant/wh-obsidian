/**
 * SubscriptionFeature Component
 * 
 * Displays an individual feature with a checkmark icon
 */

import React from "react";
import { Box, Typography } from "@mui/material";
import { Check } from "@mui/icons-material";

interface SubscriptionFeatureProps {
  text: string;
}

export function SubscriptionFeature({ text }: SubscriptionFeatureProps) {
  return (
    <Box sx={{ display: "flex", alignItems: "center", gap: 1.25 }}>
      <Check
        sx={{ 
          color: "success.main",
          fontSize: 24,
          flexShrink: 0
        }} 
      />
      <Typography variant="body1" sx={{ color: "text.primary", pt: 0.25 }}>
        {text}
      </Typography>
    </Box>
  );
}
