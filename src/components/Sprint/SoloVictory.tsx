/**
 * Solo Victory - Victory screen for PvE sprints
 * Matches web app's SoloVictory.tsx component
 */

import React from "react";
import {
  Box,
  Button,
  Snackbar,
  SnackbarContent,
  Stack,
  Typography,
  Theme,
  Paper,
} from "@mui/material";
import { useTheme } from "@mui/material/styles";
import { useSprint } from "../../context/SprintContext";
import { useGlobalData } from "../../context/GlobalDataProvider";
import { createSprint } from "../../lib/sprintManager";
import { getSprintSettings } from "../../lib/sprintSettings";
import { initializeSprint } from "@writinghabit/models";
import { Timestamp } from "firebase/firestore";
import dayjs from "dayjs";
import monsters from "../../static-data/monsters";
import SprintResult from "./SprintResult";

export default function SoloVictory() {
  const { user } = useGlobalData();
  const { sprintComplete, setSprintComplete } = useSprint();
  const theme = useTheme() as Theme;

  if (!sprintComplete || !user) return null;

  const background = theme.palette.background.paper;
  const text = theme.palette.text;

  const getMonster = () => {
    return monsters[Math.floor(Math.random() * monsters.length)];
  };

  const handleClearSprint = () => {
    setSprintComplete(null);
  };

  const handlePlayAgain = async () => {
    const settings = await getSprintSettings();
    const selectedMonster = settings.monsterBattle ? getMonster() : undefined;
    const sprintData = {
      ...initializeSprint(user, selectedMonster?.id),
      ...settings,
      started: true,
      publicSprint: false,
      startTime: Timestamp.fromDate(dayjs().toDate()),
      endTime: Timestamp.fromDate(
        dayjs().add(settings.duration, "minutes").toDate(),
      ),
    };
    await createSprint(sprintData);
    setSprintComplete(null);
  };

  return (
    <Box component={Paper} p={2}>
      <Stack spacing={1}>
        <Box>
          <Typography
            color="text.success"
            variant="h4"
            fontWeight="bold"
            sx={{ letterSpacing: 0.1 }}
          >
            VICTORY
          </Typography>

          {sprintComplete.monsterBattle ? (
            <Typography variant="body2" mt={-0.75}>
              You crushed that monster! We had faith in you.
            </Typography>
          ) : (
            <Typography variant="body2" mt={-0.75}>
              You beat the clock! We had faith in you.
            </Typography>
          )}
          <SprintResult sprint={sprintComplete} />
        </Box>
        <Box display="flex" gap={1}>
          <Button
            disableElevation
            size="small"
            variant="contained"
            color="primary"
            onClick={handlePlayAgain}
          >
            Repeat sprint
          </Button>
          <Button
            disableElevation
            size="small"
            variant="contained"
            color="inherit"
            onClick={handleClearSprint}
          >
            Close
          </Button>
        </Box>
      </Stack>
    </Box>
  );
}
