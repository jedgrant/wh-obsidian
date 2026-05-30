/**
 * Solo Defeat - Defeat screen for PvE sprints
 * Matches web app's SoloDeafeat.tsx component
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
import { Warning, WarningRounded } from "@mui/icons-material";

export default function SoloDefeat() {
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
      <Box display="flex" gap={0.5}>
        <Typography
          variant="h4"
          fontWeight="bold"
          sx={{ letterSpacing: -0.3 }}
          color="error.main"
        >
          {sprintComplete.monsterBattle ? "DEFEATED" : "TOO SLOW"}
        </Typography>
        <WarningRounded sx={{ color: "error.main", fontSize: "1.6rem" }} />
      </Box>
      <Typography variant="body2">
        {sprintComplete.monsterBattle
          ? "Bruh, you died! We still believe in you. But, slay a smaller monster next time?"
          : "Good try. You'll get it next time."}
      </Typography>
      <SprintResult sprint={sprintComplete} />
      <Box display="flex" gap={1} mt={1}>
        <Button
          disableElevation
          size="small"
          variant="contained"
          color="error"
          onClick={handlePlayAgain}
        >
          Retry
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
    </Box>
  );
}
