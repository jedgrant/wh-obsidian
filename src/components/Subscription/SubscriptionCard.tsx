/**
 * SubscriptionCard Component
 *
 * Displays the Chrome extension subscription plan with features
 */

import React, { useState } from "react";
import {
  Box,
  Typography,
  Paper,
  Button,
  Divider,
  Chip,
  ButtonGroup,
  Stack,
  Alert,
  CircularProgress,
  alpha,
} from "@mui/material";
import { SubscriptionFeature } from "./SubscriptionFeature";
import { logoDataUri } from "../../../src/assets/logo";
import { User } from "@writinghabit/models";
import { Check, WarningAmberRounded } from "@mui/icons-material";
import dayjs from "dayjs";
import { getSubDetails } from "@writinghabit/utils";
type BillingPeriod = "monthly" | "yearly";

interface SubscriptionCardProps {
  onSubscribeClick: (billingPeriod: BillingPeriod) => void;
  onManageClick?: () => void;
  isDisabled?: boolean;
  loading?: boolean;
  user: User;
}

export function SubscriptionCard({
  onSubscribeClick,
  onManageClick,
  isDisabled = false,
  loading = false,
  user,
}: SubscriptionCardProps) {
  const { activeBillingPeriod, isCanceled, isSubscribed, isWebAppSubscriber } =
    getSubDetails(user);

  const [billingPeriod, setBillingPeriod] =
    useState<BillingPeriod>(activeBillingPeriod);

  const features = [
    "Unlimited doc tracking",
    "Leaderboards",
    "Writing sprints",
    "Streak tracking",
    "Closest competitor viz",
  ];

  const pricing = {
    monthly: {
      price: 2.99,
      period: "month",
      billingText: "Billed monthly",
    },
    yearly: {
      price: 29.99,
      period: "year",
      billingText: "Billed annually",
    },
  };

  const currentPricing = pricing[billingPeriod];

  const handleBillingChange = (newBilling: BillingPeriod) => {
    setBillingPeriod(newBilling);
  };

  return (
    <Paper
      elevation={3}
      sx={{
        maxWidth: 600,
        minWidth: 312,
        mx: "auto",
        p: 4,
        borderRadius: 6,
      }}
    >
      <Stack gap={5}>
        {/* Billing Period Toggle */}
        <Box sx={{ display: "flex", justifyContent: "center" }}>
          <ButtonGroup
            variant="outlined"
            aria-label="billing period"
            color="inherit"
            fullWidth
          >
            <Button
              onClick={() => handleBillingChange("yearly")}
              variant={billingPeriod === "yearly" ? "contained" : "outlined"}
            >
              Yearly
            </Button>
            <Button
              onClick={() => handleBillingChange("monthly")}
              variant={billingPeriod === "monthly" ? "contained" : "outlined"}
            >
              Monthly
            </Button>
          </ButtonGroup>
        </Box>
        {/* Header */}
        <Box
          sx={{
            textAlign: "center",
            display: "flex",
            alignItems: "center",
            flexDirection: "column",
          }}
        >
          <img src={logoDataUri} alt="logo" height="64px" width="64px" />

          <Typography
            variant="h1"
            mb={1}
            mt={0.5}
            fontWeight={200}
            sx={{
              fontFamily: "Raleway, Figtree, Arial, sans-serif",
            }}
          >
            <Box component="span" sx={{ fontWeight: "bold" }}>
              Writing
            </Box>
            Habit
          </Typography>
          <Chip
            icon={isSubscribed ? <Check /> : undefined}
            color={
              isCanceled ? "warning" : isSubscribed ? "success" : "default"
            }
            label="Obsidian Plugin"
            size="small"
          />
          {isCanceled && user.whSub?.current_period_end && (
            <Box
              mt={1}
              display="flex"
              alignItems="center"
              gap={0.5}
              sx={(theme) => ({
                borderRadius: 1,
                bgcolor: alpha(theme.palette.warning.main, 0.1),
                px: 1,
                py: 0.5,
              })}
            >
              <WarningAmberRounded color="warning" fontSize="small" />
              <Typography variant="body2">
                Ends{" "}
                {dayjs
                  .unix(user.whSub?.current_period_end)
                  .format("MMM D, YYYY")}
              </Typography>
            </Box>
          )}
        </Box>

        {/* Price */}
        <Box sx={{ textAlign: "center" }}>
          <Box
            sx={{
              display: "flex",
              alignItems: "end",
              justifyContent: "center",
            }}
          >
            <Box
              sx={{
                fontSize: "2.5rem",
                fontFamily: "ui-sans-serif, system-ui, -apple-system",
                letterSpacing: "-0.05em",
                lineHeight: 1,
                fontWeight: 800,
                color: "text.primary",
              }}
            >
              ${currentPricing.price}
            </Box>
            <Typography
              variant="h6"
              sx={{
                ml: 0,
                pb: 0,
                color: "text.secondary",
                fontWeight: 500,
              }}
            >
              /{currentPricing.period}
            </Typography>
          </Box>
          <Typography
            variant="body2"
            sx={{
              color: "text.secondary",
            }}
          >
            {/* {currentPricing.billingText} {currentPricing.period === "year" ? " • Save 16%" : ""} */}
            {currentPricing.billingText}{" "}
            {currentPricing.period === "year" ? (
              <Box
                component="span"
                aria-label="Save 16%"
                color="black"
                px={0.5}
                pt={0.25}
                pb={0.15}
                borderRadius={1}
                bgcolor="secondary.main"
                fontWeight="bold"
                textTransform={"uppercase"}
                fontSize="0.7rem"
              >
                Save 16%
              </Box>
            ) : (
              ""
            )}
          </Typography>
        </Box>
        <Divider />
        <Box>
          {/* Features */}
          <Box sx={{ mb: 3 }}>
            <Typography
              variant="button"
              display="block"
              sx={{
                mb: 1,

                letterSpacing: 0.5,
              }}
            >
              What you get
            </Typography>
            <Stack gap={0.85}>
              {features.map((feature, index) => (
                <SubscriptionFeature key={index} text={feature} />
              ))}
            </Stack>
          </Box>

          {!isSubscribed ? (
            <Button
              disableElevation
              size="large"
              fullWidth
              variant="contained"
              onClick={() => onSubscribeClick(billingPeriod)}
              disabled={isDisabled || loading}
              startIcon={
                loading ? <CircularProgress size="1.65rem" /> : undefined
              }
            >
              {loading ? "" : "Subscribe"}
            </Button>
          ) : (
            <Button
              disableElevation
              size="large"
              fullWidth
              variant="contained"
              color="secondary"
              onClick={onManageClick}
            >
              Manage
            </Button>
          )}
          {isSubscribed && isWebAppSubscriber && (
            <Alert severity="info" sx={{ mt: 2 }}>
              Web app subscription grants full access
            </Alert>
          )}
        </Box>
      </Stack>
    </Paper>
  );
}
