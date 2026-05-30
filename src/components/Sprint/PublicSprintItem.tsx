/**
 * Public Sprint Item - Individual sprint in the public list
 */

import { Box, Button, Chip, Stack, Typography, Avatar } from "@mui/material";
import { SprintModel, Participant } from "@writinghabit/models";
import { useGlobalData } from "../../context/GlobalDataProvider";
import { joinSprint, deleteSprint } from "../../lib/sprintManager";

interface Props {
  sprint: SprintModel;
  onJoin?: () => void;
}

export default function PublicSprintItem({ sprint, onJoin }: Props) {
  const { user } = useGlobalData();
  const isOwner = user?.id === sprint.owner;
  const participants = Object.values(
    sprint.participants || {},
  ) as Participant[];

  const handleJoin = async () => {
    if (!sprint.code || !user) return;
    await joinSprint(sprint.code, user);
    onJoin?.();
  };

  const handleDelete = async () => {
    if (!sprint.id) return;
    await deleteSprint(sprint.id);
  };

  return (
    <Box
      sx={{
        p: 2,
        mb: 2,
        border: 1,
        borderColor: "divider",
        borderRadius: 1,
      }}
    >
      <Stack direction="row" spacing={2} alignItems="center">
        <Box flexGrow={1}>
          <Stack direction="row" spacing={1} alignItems="center">
            <Typography variant="body1" fontWeight="bold">
              {sprint.duration} min sprint
            </Typography>
            {sprint.started && (
              <Chip label="In Progress" size="small" color="warning" />
            )}
          </Stack>
          <Typography variant="body2" color="text.secondary">
            {sprint.goal} word goal • {participants.length} participant(s)
          </Typography>
        </Box>
        <Stack direction="row" spacing={1} alignItems="center">
          {participants.slice(0, 3).map((p, i) => (
            <Avatar key={i} src={p.avatarURL} sx={{ width: 32, height: 32 }} />
          ))}
        </Stack>
        {isOwner ? (
          <Button
            size="small"
            variant="outlined"
            color="error"
            onClick={handleDelete}
          >
            Delete
          </Button>
        ) : (
          <Button
            size="small"
            variant="contained"
            color={sprint.started ? "secondary" : "primary"}
            onClick={handleJoin}
          >
            Join
          </Button>
        )}
      </Stack>
    </Box>
  );
}
