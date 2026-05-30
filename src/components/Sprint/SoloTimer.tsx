/**
 * Solo Timer - Simple timer UI for PvE sprints (no monster)
 * Matches web app's SoloTimer.tsx component exactly
 */

import React, { useEffect, useState, useRef } from "react";
import {
  Avatar,
  Box,
  Stack,
  Typography,
  Button,
  Paper,
} from "@mui/material";
import { amber, blue, pink, red, teal, yellow } from "@mui/material/colors";
import { useSprint } from "../../context/SprintContext";
import { useGlobalData } from "../../context/GlobalDataProvider";
import { updateSprint } from "../../lib/sprintManager";
import { AccessTime, Close, KeyboardArrowDown } from "@mui/icons-material";
import SoloTimerMinimized from "./SoloTimerMinimized";
import { SurpassedColoredProgress, tierColor } from "@writinghabit/ui"; 
import dayjs from "dayjs";
import duration from "dayjs/plugin/duration";
dayjs.extend(duration);

interface Props {
  handleQuit: () => void;
  minimized: boolean;
  setMinimized: (minimized: boolean) => void;
}

export default function SoloTimer({
  handleQuit,
  minimized,
  setMinimized,
}: Props) {
  const { user } = useGlobalData();
  const { sprint, sprintComplete, setSprintComplete } = useSprint();
  const [time, setTime] = useState("");
  const [totalSeconds, setTotalSeconds] = useState(1000);

  const [uiData, setUIData] = useState({
    goalProgress: 0,
  });

  const { goalProgress } = uiData;

  const participant = sprint
    ? sprint[user?.id!]
    : sprintComplete
      ? sprintComplete[user?.id!]
      : null;

  const size = 52;

  // Use refs to avoid effect re-triggering on every sprint update
  const sprintRef = useRef(sprint);
  const participantRef = useRef(participant);
  const sprintCompleteRef = useRef(sprintComplete);

  // Update refs when values change
  useEffect(() => {
    sprintRef.current = sprint;
    participantRef.current = participant;
    sprintCompleteRef.current = sprintComplete;
  }, [sprint, participant, sprintComplete]);

  useEffect(() => {
    let intervalId: NodeJS.Timeout;

    const updateSprintData = () => {
      const currentSprint = sprintRef.current;
      const currentParticipant = participantRef.current;
      const currentSprintComplete = sprintCompleteRef.current;

      if (
        currentSprint &&
        currentSprint.endTime &&
        currentParticipant &&
        !currentSprintComplete
      ) {
        let startDate = dayjs();
        let endDate = dayjs(currentSprint.endTime.toDate());
        let dur = dayjs.duration(endDate.diff(startDate));
        let hours = dur.hours();
        let minutes = dur.minutes();
        let seconds = dur.seconds();
        const totalSec = hours * 60 * 60 + minutes * 60 + seconds;
        setTotalSeconds(totalSec);

        const goalProgress = Math.round(
          (currentParticipant.words / currentSprint.goal) * 100,
        );

        setUIData({
          goalProgress,
        });

        // Determine completion based on winCondition
        let shouldComplete = false;
        const winCondition = currentSprint.winCondition || "either";
        if (winCondition === "time") {
          shouldComplete = totalSec <= 0;
        } else if (winCondition === "words") {
          shouldComplete = currentParticipant.words >= currentSprint.goal;
        } else {
          // "either" or undefined defaults to current behavior
          shouldComplete = totalSec <= 0 || currentParticipant.words >= currentSprint.goal;
        }

        if (shouldComplete) {
          if (intervalId) clearInterval(intervalId);
          setSprintComplete({
            ...currentSprint,
            complete: true,
            active: false,
          });
          setTime(`00:00`);
          if (currentSprint.id) {
            updateSprint(currentSprint.id, {
              complete: true,
              active: false,
            });
          }
        } else {
          let formattedHours = hours < 10 ? `0${hours}` : hours;
          let formattedMinutes = minutes < 10 ? `0${minutes}` : minutes;
          let formattedSeconds = seconds < 10 ? `0${seconds}` : seconds;
          if (hours > 0) {
            setTime(
              `${formattedHours}:${formattedMinutes}:${formattedSeconds}`,
            );
          } else {
            setTime(`${formattedMinutes}:${formattedSeconds}`);
          }
        }
      } else if (currentSprintComplete) {
        setUIData({
          goalProgress: 0,
        });
      } else {
        if (intervalId) clearInterval(intervalId);
        setUIData({
          goalProgress: 0,
        });
      }
    };

    intervalId = setInterval(() => {
      updateSprintData();
    }, 1000);
    updateSprintData();

    return () => {
      if (intervalId) clearInterval(intervalId);
    };
  }, []); // Empty dependency - only run once on mount

  const color =
    totalSeconds < 60 ? "error" : totalSeconds < 120 ? "warning" : "primary";

  const gradients = {
    primary: `linear-gradient(45deg, ${teal[500]} 30%, ${blue[500]} 90%)`,
    error: `linear-gradient(45deg, ${red[500]} 30%, ${pink[800]} 90%)`,
    warning: `linear-gradient(45deg, ${amber[900]} 30%, ${yellow[800]} 90%)`,
  };

  if (minimized)
    return (
      <SoloTimerMinimized
        time={time}
        goalProgress={goalProgress}
        setMinimized={setMinimized}
        handleQuit={handleQuit}
        color={color}
      />
    );

  return (
    <Box component={Paper} p={1}>
      <Stack direction="row" spacing={1} alignItems="center">
        <Box>
          <Avatar
            variant="rounded"
            sx={{
              bgcolor: amber[500],
              background: gradients[color],
              width: size,
              height: size,
            }}
          >
            <AccessTime sx={{ fontSize: 30, color: "white" }} />
          </Avatar>
        </Box>
        <Box flexGrow={1}>
          <Box display="flex" alignItems="center" mb={0.2} flexGrow={1}>
            <Typography variant="button" flexGrow={1}>
              Sprint in progress
            </Typography>
              <Button
                color="inherit"
                size="small"
                onClick={handleQuit}
                sx={{ p: 0.5, minWidth: "auto" }}
              >
                <Close sx={{ fontSize: "1rem" }} />
              </Button>
              {/* Should probably minimize to a floating widget over the document */}
              {/* <Button
                size="small"
                color="inherit"
                onClick={() => setMinimized(!minimized)}
                sx={{ p: 0.5, minWidth: "auto" }}
              >
                <KeyboardArrowDown sx={{ fontSize: "1rem" }} />
              </Button> */}
          </Box>

          <SurpassedColoredProgress
            progress={goalProgress}
            hideTooltip
            sx={{ height: 8, flexGrow: 1, borderRadius: 3 }}
          />
          <Stack direction="row" spacing={1}>
            <Box flexGrow={1}>{time}</Box>
            {goalProgress >= 100 && (
              <Box
                fontWeight="bold"
                sx={{ color: `${tierColor[Math.min(Math.floor(goalProgress / 100) + 1, 8)]?.color}.main` }}
              >
                {Math.floor(goalProgress / 100) + 1}x
              </Box>
            )}
            <Box>
              {participant?.words}/{sprint?.goal}
            </Box>
          </Stack>
        </Box>
      </Stack>
    </Box>
  );
}
