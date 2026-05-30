/**
 * Subscription Page for Obsidian Plugin
 *
 * Adapted from chrome-ext:
 * - Replaced chrome.tabs.create with window.open
 * - Uses "createExtensionCheckoutSession" same as chrome-ext (same backend)
 */

import React, { useState } from "react";
import {
  Box,
  Typography,
  Paper,
  Alert,
  AlertTitle,
  Fade,
  Snackbar,
} from "@mui/material";
import { useGlobalData } from "../context/GlobalDataProvider";
import { SubscriptionCard } from "../components/Subscription/SubscriptionCard";
import { Info } from "@mui/icons-material";
import { httpsCallable } from "firebase/functions";
import { functions, currentEnvironment } from "../config/firebase";
import { getCusomterPortalURL } from "@writinghabit/static-data";

export function Subscription() {
  const { user } = useGlobalData();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const hasActiveSubscription = user?.whSubStatus === true;
  const subscriptionLevel =
    user?.whSub?.level === 0
      ? "Plugin/Extension"
      : user?.whSub?.level === 1
      ? "Hobbyist"
      : user?.whSub?.level === 2
      ? "Pro"
      : null;
  const hasFullAppSubscription =
    hasActiveSubscription &&
    (user?.whSub?.level === 1 || user?.whSub?.level === 2);

  const handleManagePortal = () => {
    const url = getCusomterPortalURL(currentEnvironment === "production");
    window.open(url, "_blank");
  };

  const handleSubscribeClick = async (billingPeriod: "monthly" | "yearly") => {
    if (!user) {
      setError("You must be signed in to subscribe");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const createCheckoutSession = httpsCallable(
        functions,
        "createExtensionCheckoutSession"
      );
      const result = await createCheckoutSession({ billingPeriod });
      const data = result.data as { url: string };
      if (data.url) window.open(data.url, "_blank");
    } catch (err: any) {
      setError(err.message || "Failed to start checkout. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  if (!user) {
    return (
      <Box sx={{ p: 3, textAlign: "center" }}>
        <Alert severity="warning">
          <AlertTitle>Sign in required</AlertTitle>
          You need to be signed in to manage your subscription.
        </Alert>
      </Box>
    );
  }

  return (
    <Fade in timeout={300}>
      <Box sx={{ display: "flex", flexDirection: "column", gap: 3 }}>
        <SubscriptionCard
          onSubscribeClick={handleSubscribeClick}
          onManageClick={handleManagePortal}
          isDisabled={loading}
          loading={loading}
          user={user}
        />

        {hasFullAppSubscription ? (
          <Paper
            elevation={0}
            sx={{
              p: 4,
              textAlign: "center",
              background: (theme) =>
                theme.palette.mode === "dark"
                  ? "rgba(255, 255, 255, 0.03)"
                  : "rgba(0, 0, 0, 0.02)",
              borderRadius: 2,
            }}
          >
            <Typography variant="h6" sx={{ mb: 1, fontWeight: 600 }}>
              Enjoying all the features?
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Your {subscriptionLevel} subscription includes everything the
              Obsidian Plugin has to offer.
            </Typography>
          </Paper>
        ) : (
          !hasActiveSubscription && (
            <Alert severity="info" icon={<Info />} sx={{ borderRadius: 2 }}>
              <AlertTitle sx={{ fontWeight: 600 }}>
                Web App subscription
              </AlertTitle>
              <Typography variant="body2">
                If you subscribe to the full WritingHabit app (Hobbyist or Pro
                tier), you automatically get{" "}
                <strong>full access to all Obsidian Plugin features</strong> at no
                additional cost.
              </Typography>
            </Alert>
          )
        )}

        <Snackbar
          open={!!error}
          autoHideDuration={6000}
          onClose={() => setError(null)}
          message={error}
        />
        <Snackbar
          open={!!successMessage}
          autoHideDuration={6000}
          onClose={() => setSuccessMessage(null)}
          message={successMessage}
        />
      </Box>
    </Fade>
  );
}
