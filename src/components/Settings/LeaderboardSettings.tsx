import React, { useState } from "react";
import {
  Box,
  Typography,
  Switch,
  FormControlLabel,
  Stack,
  RadioGroup,
  Radio,
  FormControl,
  Link,
  Alert,
} from "@mui/material";
import { useGlobalData } from "../../context/GlobalDataProvider";
import { TrendingUp } from "@mui/icons-material";
import LeaderboardMetricInfoDialog from "./LeaderboardMetricInfoDialog";
import {
  LeaderboardViewMode,
  WordCountDisplay,
} from "@writinghabit/models";

interface LeaderboardSettingsProps {
  handlePreferenceChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
  compact?: boolean;
}

export default function LeaderboardSettings({
  handlePreferenceChange,
  compact = false,
}: LeaderboardSettingsProps) {
  const { user } = useGlobalData();
  const [metricInfoDialogOpen, setMetricInfoDialogOpen] = useState(false);

  if (!user) return null;

  const handleViewModeChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const syntheticEvent = {
      target: {
        name: "leaderboardViewMode",
        type: "radio",
        value: event.target.value as LeaderboardViewMode,
        checked: true,
      },
    } as React.ChangeEvent<HTMLInputElement>;
    handlePreferenceChange(syntheticEvent);
  };

  const handleWordCountChange = (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const syntheticEvent = {
      target: {
        name: "wordCountDisplay",
        type: "radio",
        value: event.target.value as WordCountDisplay,
        checked: true,
      },
    } as React.ChangeEvent<HTMLInputElement>;
    handlePreferenceChange(syntheticEvent);
  };

  const handleWeekDefinitionChange = (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const syntheticEvent = {
      target: {
        name: "weekDefinition",
        type: "radio",
        value: event.target.value as WordCountDisplay,
        checked: true,
      },
    } as React.ChangeEvent<HTMLInputElement>;
    handlePreferenceChange(syntheticEvent);
  };

  return (
    <Stack spacing={compact ? 2 : 3} id="leaderboard">
      {/* Default View Mode */}
      <Stack py={2} gap={2}>
        {!compact && (
          <Box display="flex" alignItems="center" gap={1}>
            <Typography variant="h5" fontWeight="bold">
              Leaderboard & analytics
            </Typography>
            <TrendingUp fontSize="small" />
          </Box>
        )}
        <Box>
          <FormControl component="fieldset">
            <Typography variant="body1" fontWeight="bold">
              Default view
            </Typography>
            <Typography
              variant="body2"
              mt={-0.5}
              color="text.secondary"
              display="block"
            >
              Choose where the leaderboard focuses for you when displayed.
            </Typography>
            <RadioGroup
              aria-label="leaderboard view mode"
              name="leaderboardViewMode"
              value={user.preferences?.leaderboardViewMode ?? "top10"}
              onChange={handleViewModeChange}
            >
              <FormControlLabel
                value="top10"
                control={<Radio />}
                label="Top 10 leaderboard"
                sx={{ my: -0.5 }}
              />
              <FormControlLabel
                value="around-me"
                control={<Radio />}
                label="Results around me"
                sx={{ my: -1 }}
              />
            </RadioGroup>
          </FormControl>
        </Box>

        {/* Manual Tracking Toggle */}
        <Box>
          <Typography variant="body1" fontWeight="bold">
            Filter options
          </Typography>
          <Typography
            variant="body2"
            mt={-0.5}
            color="text.secondary"
            display="block"
          >
            When enabled, accounts that use manual tracking are included in
            leaderboard rankings.
          </Typography>
          <FormControlLabel
            control={
              <Switch
                name="excludeManualTracking"
                checked={!(user.preferences?.excludeManualTracking ?? false)}
                onChange={(e) => {
                  const syntheticEvent = {
                    target: {
                      name: "excludeManualTracking",
                      type: "checkbox",
                      checked: !e.target.checked,
                      value: String(!e.target.checked),
                    },
                  } as React.ChangeEvent<HTMLInputElement>;
                  handlePreferenceChange(syntheticEvent);
                }}
                color="primary"
              />
            }
            label="Show manually tracked"
          />
        </Box>

        {/* Leaderboard Presence */}
        <Box>
          <Typography variant="body1" fontWeight="bold">
            Your visibility
          </Typography>
          <Typography
            variant="body2"
            mt={-0.5}
            color="text.secondary"
            display="block"
          >
            Control whether you appear on public leaderboards.
          </Typography>
          <FormControlLabel
            control={
              <Switch
                name="leaderboardPresence"
                checked={user.preferences?.leaderboardPresence ?? true}
                onChange={handlePreferenceChange}
                color="primary"
              />
            }
            label={
              (user.preferences?.leaderboardPresence ?? true)
                ? "Visible"
                : "Masked (name and photo will be hidden)"
            }
          />
        </Box>

        {/* Word Count Display */}
        <Box>
          <FormControl component="fieldset">
            <Typography variant="body1" fontWeight="bold">
              Word count display
            </Typography>
            <Typography
              variant="body2"
              mt={-0.5}
              color="text.secondary"
              display="block"
            >
              Choose whether to display words <strong>typed</strong> or{" "}
              <strong>total words produced</strong>.{" "}
              <Link
                component="button"
                variant="body2"
                onClick={() => setMetricInfoDialogOpen(true)}
                sx={{ cursor: "pointer" }}
              >
                Learn more
              </Link>
            </Typography>
            <RadioGroup
              aria-label="word count display"
              name="wordCountDisplay"
              value={user.preferences?.wordCountDisplay ?? "typed"}
              onChange={handleWordCountChange}
            >
              <FormControlLabel
                value="typed"
                control={<Radio />}
                label="Words typed"
                sx={{ my: -0.5 }}
              />
              <FormControlLabel
                value="net"
                control={<Radio />}
                label="Total words produced"
                sx={{ my: -1 }}
              />
            </RadioGroup>
            {user.preferences?.wordCountDisplay === "net" && (
              <Alert severity="info" sx={{ mt: 1 }}>
                Changes the Leaderboard, "Today" stat card inside the editor,
                Words comparison, and Dashboard Words per day chart.
              </Alert>
            )}
          </FormControl>
        </Box>

        {/* Week Definition */}
        <Box>
          <FormControl component="fieldset">
            <Typography variant="body1" fontWeight="bold">
              Week definition
            </Typography>
            <Typography
              variant="body2"
              mt={-0.5}
              color="text.secondary"
              display="block"
            >
              Changes the <strong>Words Comparison</strong> dashboard widget
              time range.
            </Typography>
            <RadioGroup
              aria-label="week definition"
              name="weekDefinition"
              value={user.preferences?.weekDefinition ?? "us"}
              onChange={handleWeekDefinitionChange}
            >
              <FormControlLabel
                value="iso"
                control={<Radio />}
                label="ISO (Mon-Sun)"
                sx={{ my: -0.5 }}
              />
              <FormControlLabel
                value="us"
                control={<Radio />}
                label="US (Sun-Sat)"
                sx={{ my: -1 }}
              />
            </RadioGroup>
          </FormControl>
        </Box>

        {/* Word Count Explanation Dialog */}
        <LeaderboardMetricInfoDialog
          open={metricInfoDialogOpen}
          onClose={() => setMetricInfoDialogOpen(false)}
        />
      </Stack>
    </Stack>
  );
}
