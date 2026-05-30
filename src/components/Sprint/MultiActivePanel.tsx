/**
 * Multi Active Panel - Multiplayer Sprint UI for Chrome Extension
 *
 * Displays active multiplayer sprint with participants
 * Uses shared UI components with extension Context state
 */

import React, { useCallback, useEffect, useMemo } from "react";
import {
  Box,
  Stack,
  Button,
  Theme,
  Typography,
  Paper,
} from "@mui/material";
import { useTheme } from "@mui/material/styles";
import { Delete } from "@mui/icons-material";
import { useSprint } from "../../context/SprintContext";
import { useGlobalData } from "../../context/GlobalDataProvider";
import { deleteSprint, updateSprint } from "../../lib/sprintManager";
import { ParticipantList } from "@writinghabit/ui";
import { useSprintTimer } from "@writinghabit/hooks";
import { Participant } from "@writinghabit/models";
import MultiVictory from "./MultiVictory";

export default function MultiActivePanel() {
  const { user } = useGlobalData();
  const { sprint, setSprintComplete } = useSprint();
  const theme = useTheme() as Theme;

  const handleSprintComplete = useCallback(async () => {
    if (!sprint) return;
    setSprintComplete({ ...sprint, complete: true });
    if (sprint.id) {
      await updateSprint(sprint.id, { complete: true, active: false });
    }
  }, [sprint, setSprintComplete]);

  const { time, totalSeconds } = useSprintTimer(sprint ?? null, handleSprintComplete);

  const participants: Participant[] = useMemo(() => {
    if (!sprint) return [];
    const result: Participant[] = [];
    sprint.participantIds.forEach((id) => {
      if (sprint[id]) result.push(sprint[id]);
    });
    return result;
  }, [sprint]);

  // Check for word goal completion
  useEffect(() => {
    if (!sprint || !participants.length) return;
    const mostWords = [...participants].sort((a, b) => b.words - a.words)[0];
    if (sprint.winCondition === "words" && mostWords?.words >= sprint.goal) {
      handleSprintComplete();
    }
  }, [sprint, participants, handleSprintComplete]);

  if (!user || !sprint) return null;

  const color =
    totalSeconds < 60 ? "error" : totalSeconds < 120 ? "warning" : "primary";

  const handleDelete = () => {
    if (sprint.id && user.id === sprint.owner) {
      deleteSprint(sprint.id);
    }
  };

  return (
    <Box component={Paper} p={2}>
      <Stack direction="row" spacing={2} sx={{ mt: -0.5 }}>
        <Box sx={{ minWidth: 100 }}>
          <Typography color="text.secondary" variant="button">
            Goal
          </Typography>
          <Typography variant="h5" mt={-0.5} color="inherit">
            {sprint?.goal} words
          </Typography>
        </Box>
        <Box sx={{ flexGrow: 1 }}>
          <Typography color="text.secondary" variant="button">
            Time
          </Typography>
          <Typography
            variant="h5"
            mt={-0.5}
            color={totalSeconds < 60 ? "error" : "inherit"}
            fontWeight={totalSeconds < 120 ? "bold" : "100"}
          >
            {time}
          </Typography>
        </Box>
        {user.id === sprint?.owner && (
          <Box>
            <Button
              size="small"
              color="inherit"
              variant="contained"
              disableElevation
              onClick={handleDelete}
              sx={{
                minWidth: "auto",
                px: 0.2,
              }}
            >
              <Delete sx={{ fontSize: 18 }} />
            </Button>
          </Box>
        )}
      </Stack>
      {participants?.length > 0 && (
        <ParticipantList
          participants={participants}
          goalWords={sprint.goal}
          color={color}
          maxHeight={180}
        />
      )}
    </Box>
  );
}