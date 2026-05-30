/**
 * Multi Victory - Victory screen for multiplayer sprints
 * Matches web app's MultiVictory.tsx component
 */

import React from "react";
import {
  Box,
  IconButton,
  Paper,
  Stack,
  Typography,
  Avatar,
} from "@mui/material";
import { Participant } from "@writinghabit/models";
import { Close, EmojiEvents } from "@mui/icons-material";
import { useSprint } from "../../context/SprintContext";
import { updateSprint } from "../../lib/sprintManager";
import { amber, grey, orange } from "@mui/material/colors";
import { generateDarkGradient } from "@writinghabit/utils";

interface Props {
  participant: Participant | null;
}

export default function MultiVictory({ participant }: Props) {
  const { sprintComplete, setSprintComplete } = useSprint();

  const handleClearSprint = () => {
    if (sprintComplete?.id) {
      updateSprint(sprintComplete.id, { complete: true, active: false });
    }
    setSprintComplete(null);
  };

  // Get all participants and sort by words
  const participants: Participant[] = [];
  if (sprintComplete) {
    sprintComplete.participantIds.forEach((id) => {
      if (sprintComplete[id]) {
        participants.push(sprintComplete[id]);
      }
    });
  }
  const sortedParticipants = participants.sort((a, b) => b.words - a.words);

  const getMedalColor = (index: number) => {
    if (index === 0) return amber[500]; // Gold
    if (index === 1) return grey[400]; // Silver
    if (index === 2) return orange[800]; // Bronze
    return "transparent";
  };

  return (
    <Box component={Paper} p={2}>
      <Box display="flex" gap={1}>
        <Box flexGrow={1} mt={-0.2}>
          <Typography variant="h5" fontWeight={"bold"}>
            Sprint complete
          </Typography>
          <Typography variant="body2" color="text.secondary" lineHeight={1.2} mb={1.5} mt={-0.3}>
            Congrats to all, keep up the great work!
          </Typography>
        </Box>
        <Box mt={-1} mr={-1}>
          <IconButton size="small" onClick={handleClearSprint}>
            <Close fontSize="small" />
          </IconButton>
        </Box>
      </Box>
      <Stack spacing={0.5}>
        {sortedParticipants.map((p, index) => (
          <Stack
            key={p.id}
            direction="row"
            spacing={1}
            alignItems="center"
            sx={{
              bgcolor: index === 0 ? "success.main" : index < 3 ? "action.hover" : "transparent",
              p: 0.5, pr: 1,
              borderRadius: 1,
            }}
          >
            {index < 3 && (
              <EmojiEvents sx={{ color: getMedalColor(index), fontSize: 20 }} />
            )}
            {index >= 3 && (
              <Typography
                variant="caption"
                sx={{
                  width: 20,
                  textAlign: "center",
                  color: "text.secondary",
                }}
              >
                {index + 1}
              </Typography>
            )}
            <Avatar
              src={p.avatarURL}
              sx={{
                width: 24,
                height: 24,
                background: generateDarkGradient(p.id),
                color: "#ffffff",
                fontWeight: "bold",
                fontSize: "0.75rem",
              }}
              variant="rounded"
            >
              {p.displayName.charAt(0)}
            </Avatar>
            <Typography variant="body2" sx={{ flexGrow: 1, color: index === 0 ? "white" : "inherit" }}>
              {p.displayName}
            </Typography>
            <Typography variant="body2" sx={{ fontWeight: "bold", color: index === 0 ? "white" : "inherit" }}>
              {p.words}
            </Typography>
          </Stack>
        ))}
      </Stack>
    </Box>
  );
}
