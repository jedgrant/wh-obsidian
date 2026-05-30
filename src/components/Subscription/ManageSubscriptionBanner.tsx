/**
 * ManageSubscriptionBanner Component
 * 
 * Displays when user has an active full app subscription
 * Shows subscription info and provides link to manage it
 */

import React from "react";
import { Box, Typography, Button, Paper, Chip } from "@mui/material";
import { OpenInNew, CheckCircle } from "@mui/icons-material";

interface ManageSubscriptionBannerProps {
  subscriptionLevel: string;
  onManageClick: () => void;
}

export function ManageSubscriptionBanner({ 
  subscriptionLevel, 
  onManageClick 
}: ManageSubscriptionBannerProps) {
  return (
    <Paper
      elevation={0}
      sx={{
        p: 3,
        mb: 3,
        background: (theme) => 
          theme.palette.mode === "dark" 
            ? "linear-gradient(135deg, rgba(46, 125, 50, 0.15) 0%, rgba(56, 142, 60, 0.08) 100%)"
            : "linear-gradient(135deg, rgba(237, 247, 237, 1) 0%, rgba(200, 230, 201, 0.5) 100%)",
        border: (theme) => `1px solid ${theme.palette.success.main}40`,
        borderRadius: 2,
      }}
    >
      <Box sx={{ display: "flex", alignItems: "center", mb: 2, gap: 1 }}>
        <CheckCircle sx={{ color: "success.main", fontSize: 28 }} />
        <Typography variant="h6" sx={{ fontWeight: 600 }}>
          You're All Set!
        </Typography>
        <Chip 
          label={subscriptionLevel}
          size="small"
          color="success"
          sx={{ ml: 1 }}
        />
      </Box>
      
      <Typography variant="body1" sx={{ mb: 2, color: "text.primary" }}>
        Your active <strong>{subscriptionLevel}</strong> subscription gives you full access to all Chrome extension features. No additional subscription needed!
      </Typography>
      
      <Button
        variant="outlined"
        color="success"
        endIcon={<OpenInNew />}
        onClick={onManageClick}
        sx={{ 
          textTransform: "none",
          fontWeight: 500
        }}
      >
        Manage Subscription in App
      </Button>
    </Paper>
  );
}
