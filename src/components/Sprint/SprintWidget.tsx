/**
 * Sprint Widget - Orchestrator for all sprint UI
 *
 * Shows sprint creation button when no active sprint
 * Shows active sprint panels when sprint in progress
 * Pattern follows web app's WritingSprintsWidget component
 */

import React from "react";
import { Box, Paper, Stack, Typography } from "@mui/material";
import { useSprint } from "../../context/SprintContext";
import { useGlobalData } from "../../context/GlobalDataProvider";
import SoloActivePanel from "./SoloActivePanel";
import MultiActivePanel from "./MultiActivePanel";
import WaitingRoomPanel from "./WaitingRoomPanel";
import SoloVictory from "./SoloVictory";
import SoloDefeat from "./SoloDefeat";
import MultiVictory from "./MultiVictory";
import CreateSprintDialog from "./CreateSprintDialog";
import ActivePublicSprintsIndicator from "./ActivePublicSprintsIndicator";

export default function SprintWidget() {
  const { user } = useGlobalData();
  const { sprint, sprintComplete } = useSprint();

  if (!user) {
    return null;
  }

  // Show completed sprint UI
  if (sprintComplete && sprintComplete.complete) {
    const participant = sprintComplete[user.id];

    if (sprintComplete.pve) {
      // Solo sprint completion
      if (sprintComplete.monsterBattle) {
        // Monster battle - check mob/player health
        const mobHealth = sprintComplete.mobHealth?.remaining ?? 100;
        const playerHealth = sprintComplete.playerHealth?.remaining ?? 100;
        //     return (
        //   <>JUST A TEST {sprintComplete.monsterBattle ? "MONSTER" : "TIMER"} {mobHealth} {playerHealth} </>
        // );
        // Victory if: mob defeated OR reached word goal
        if (mobHealth <= 0 || participant?.words >= sprintComplete.goal) {
          return <SoloVictory />;
        }
        // Defeat if: player died
        if (playerHealth <= 0) {
          return <SoloDefeat />;
        }
      } else {
        // Timer sprint - only check word goal
        if (participant?.words >= sprintComplete.goal) {
          return <SoloVictory />;
        } else {
          return <SoloDefeat />;
        }
      }
    }

    // Multiplayer - show victory screen
    if (!sprintComplete.pve) {
      // Find the winner
      const participants: any[] = [];
      sprintComplete.participantIds.forEach((id: string) => {
        if (sprintComplete[id]) {
          participants.push(sprintComplete[id]);
        }
      });
      const winner = participants.sort((a, b) => b.words - a.words)[0];
      return <MultiVictory participant={winner} />;
    }
  }

  // Show active sprint
  if (sprint) {
    // PvE (solo) sprint
    if (sprint.pve) {
      return <SoloActivePanel />;
    }

    // Multiplayer sprint - waiting for start
    if (!sprint.started) {
      return <WaitingRoomPanel />;
    }

    // Multiplayer sprint - active
    return <MultiActivePanel />;
  }

  // No active sprint - show creation widget
  return (
    <Box component={Paper} mb={2} px={2} py={1} sx={{ position: "relative" }}>
      <Stack direction="row" sx={{ width: "100%" }} alignItems="center">
        <Box flexGrow={1}>
          <ActivePublicSprintsIndicator />
          <Typography variant="button" sx={{ lineHeight: 1 }}>
            Writing sprints
          </Typography>
        </Box>
        <CreateSprintDialog />
      </Stack>
    </Box>
  );
}
