/**
 * Start Sprint Component - Start new sprint or join existing one
 */

import React, { useState, useEffect } from "react";
import {
  Alert,
  Box,
  Button,
  TextField,
  Typography,
} from "@mui/material";
import dayjs from "dayjs";
import { useSprint } from "../../context/SprintContext";
import { useGlobalData } from "../../context/GlobalDataProvider";
import { useNavigation } from "../../context/NavigationProvider";
import { joinSprint, getSprintsSinceDate } from "../../lib/sprintManager";
import PublicSprints from "./PublicSprints";
import CreateSprintSettingsDialog from "./CreateSprintSettingsDialog";
import { getSubDetails } from "@writinghabit/utils";
import { FREE_SPRINTS } from "../freeTierValues";

interface Props {
  handleClose?: () => void;
  onCreateStart?: () => void;
}

export default function StartSprint({ handleClose, onCreateStart }: Props) {
  const { user, isOnline } = useGlobalData();
  const { sprint } = useSprint();
  const { navigate } = useNavigation();
  const [notFound, setNotFound] = useState(false);
  const [joinCode, setJoinCode] = useState("");
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [hitLimit, setHitLimit] = useState(false);
  const [sprintCount, setSprintCount] = useState<number>(0);

  const { isSubscribedOrTrialing } = getSubDetails(user);

  // Helper function to get start of current week (Sunday 12:00 AM)
  const getStartOfWeek = () => {
    const now = dayjs();
    // Get the day of week (0 = Sunday, 1 = Monday, etc.)
    const dayOfWeek = now.day();
    // Subtract days to get to previous Sunday, then set to start of day
    return now.subtract(dayOfWeek, "day").startOf("day").toDate();
  };

  // Helper function to get start of next week (one week after current week start)
  const getNextWeekStart = () => {
    return dayjs(getStartOfWeek()).add(1, "week").toDate();
  };

  const weekStartDate = getStartOfWeek();
  const nextWeekStartDate = getNextWeekStart();

  const handleJoinCodeChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setJoinCode(event.target.value);
  };

  const checkSprintLimit = async (): Promise<boolean> => {
    if (!user?.id) return false;
    if (isSubscribedOrTrialing) return true;

    try {
      const count = await getSprintsSinceDate(user.id, weekStartDate);
      setSprintCount(count);
      if (count >= FREE_SPRINTS) {
        setHitLimit(true);
        return false;
      }
      return true;
    } catch (error) {
      console.error("[StartSprint] Error checking sprint limit:", error);
      return false;
    }
  };

  const handleJoin = async () => {
    if (!user) return;

    // Check sprint limit for free users
    const canJoin = await checkSprintLimit();
    if (!canJoin) return;

    try {
      const result = await joinSprint(joinCode, user);
      if (result.notFound) {
        setNotFound(true);
      } else {
        setNotFound(false);
        setJoinCode("");
        handleClose?.();
      }
    } catch (error) {
      console.error("[StartSprint] Error joining sprint:", error);
      setNotFound(true);
    }
  };

  const handleCreateStart = async () => {
    // Check sprint limit for free users
    const canCreate = await checkSprintLimit();
    if (!canCreate) return;
    if (onCreateStart) {
      onCreateStart();
    } else {
      setSettingsOpen(true);
    }
  };

  const handleSettingsClose = () => {
    setSettingsOpen(false);
    handleClose?.();
  };

  const handlePublicJoin = async (code: string) => {
    if (!user) return;
    const canJoin = await checkSprintLimit();
    if (!canJoin) return;
    try {
      const result = await joinSprint(code, user);
      if (!result.notFound) {
        handleClose?.();
      }
    } catch (error) {
      console.error("[StartSprint] Error joining public sprint:", error);
    }
  };

  return (
    <Box>
      <Typography component="div" variant="body1" mb={2}>
        Compete with fellow writers, race the clock, or fight a monster to
        supercharge your productivity.
      </Typography>
      {!sprint && user && !hitLimit && (
        <>
          <Button onClick={handleCreateStart} variant="contained" fullWidth size="large" disableElevation>
            Start your own
          </Button>
          <Box display="flex" mt={2} alignItems="center">
            <TextField
              size="small"
              placeholder="Or enter a code"
              sx={{ mr: 1, minWidth: "auto" }}
              name="code"
              value={joinCode}
              onChange={handleJoinCodeChange}
              autoComplete="off"
              disabled={!isOnline}
            />
            <Button
              onClick={handleJoin}
              variant="contained"
              color="inherit"
              size="large"
              disableElevation
              disabled={!isOnline}
            >
              Join
            </Button>
          </Box>
          {!isOnline && (
            <Alert severity="info" sx={{ mt: 2 }}>
              Joining sprints requires an internet connection.
            </Alert>
          )}
          {!isSubscribedOrTrialing && (
            <Alert severity="info" sx={{ mt: 2 }}>
              Free users get {FREE_SPRINTS} sprints per week. Your sprints reset every Sunday
              at 12:00 AM.
            </Alert>
          )}
        </>
      )}
      {!user && (
        <Alert severity="info">Please sign in to use writing sprints</Alert>
      )}
      {notFound && (
        <Alert severity="error" sx={{ mt: 2 }}>
          Unable to find a sprint with that Code
        </Alert>
      )}
      {sprint && (
        <Alert severity="info">
          You cannot create a new sprint when you have an active sprint. If you
          do not wish to complete the sprint you're currently in, you can remove
          yourself.
        </Alert>
      )}
      {!sprint && user && !isSubscribedOrTrialing && hitLimit && (
        <Alert severity="warning" sx={{ mt: 2 }}>
          <Box mb={1}>
            You've used {sprintCount}/{FREE_SPRINTS} free sprints this week. This will reset{" "}
            <strong>{dayjs(nextWeekStartDate).format("dddd, MMMM D")}</strong>.
          </Box>
          <Button
            color="inherit"
            size="small"
            variant="contained"
            disableElevation
            onClick={() => {
              navigate("subscription");
              handleSettingsClose();
            }}
          >
            Subscribe
          </Button>
        </Alert>
      )}
      {isOnline && <PublicSprints onJoin={handlePublicJoin} />}

      <CreateSprintSettingsDialog
        open={settingsOpen}
        onClose={handleSettingsClose}
      />
    </Box>
  );
}
