/**
 * Waiting Room Panel - Multiplayer Sprint Waiting UI
 *
 * Shows while waiting for sprint to start
 */

import React from "react";
import { Box, Paper } from "@mui/material";
import { Timestamp, deleteField } from "firebase/firestore";
import dayjs from "dayjs";
import { useSprint } from "../../context/SprintContext";
import { useGlobalData } from "../../context/GlobalDataProvider";
import { updateSprint, deleteSprint } from "../../lib/sprintManager";
import { WaitingRoomContent } from "@writinghabit/ui";

export default function WaitingRoomPanel() {
  const { user } = useGlobalData();
  const { sprint } = useSprint();

  if (!user || !sprint) return null;

  const handleStart = async () => {
    if (sprint.owner === user.id && sprint.id) {
      await updateSprint(sprint.id, {
        started: true,
        startTime: Timestamp.fromDate(new Date()),
        endTime: Timestamp.fromDate(
          dayjs().add(sprint.duration, "minutes").toDate(),
        ),
        active: true,
      });
    }
  };

  const handleEndEarly = () => {
    if (sprint.id) deleteSprint(sprint.id);
  };

  const removeParticipant = async (userId: string) => {
    if (!sprint.id) return;
    await updateSprint(sprint.id, {
      participantIds: sprint.participantIds.filter((id) => id !== userId),
      [userId]: deleteField(),
    });
  };

  return (
    <Box component={Paper} p={2}>
      <WaitingRoomContent
        sprint={sprint}
        user={user}
        onStart={handleStart}
        onEndEarly={handleEndEarly}
        onRemoveParticipant={removeParticipant}
      />
    </Box>
  );
}
