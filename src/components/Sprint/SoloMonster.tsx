/**
 * Solo Monster - Monster battle UI for PvE sprints
 * Matches web app's SoloMonster.tsx component exactly
 */

import React, { useEffect, useState, useRef } from "react";
import {
  Avatar,
  Box,
  LinearProgress,
  Stack,
  Typography,
  Link as MUILink,
  Theme,
  Paper,
} from "@mui/material";
import { amber, pink } from "@mui/material/colors";
import { useTheme } from "@mui/material/styles";
import { useSprint } from "../../context/SprintContext";
import { useGlobalData } from "../../context/GlobalDataProvider";
import { updateSprint } from "../../lib/sprintManager";
import { Monster } from "@writinghabit/static-data";
import dayjs from "dayjs";
import duration from "dayjs/plugin/duration";
dayjs.extend(duration);

interface Props {
  handleQuit: () => void;
  monster: Monster;
}

export default function SoloMonster({ handleQuit, monster }: Props) {
  const { user } = useGlobalData();
  const { sprint, sprintComplete, setSprintComplete } = useSprint();
  const theme = useTheme() as Theme;
  const [time, setTime] = useState("");

  const [uiData, setUIData] = useState({
    swingTimerSeconds: 0,
    mobHealth: 100,
    playerHealth: 100,
    goalProgress: 0,
    mobHealthPercentage: 100,
    swingProgress: 0,
  });

  const {
    swingTimerSeconds,
    mobHealth,
    playerHealth,
    goalProgress,
    mobHealthPercentage,
    swingProgress,
  } = uiData;

  const participant = sprint
    ? sprint[user?.id!]
    : sprintComplete
      ? sprintComplete[user?.id!]
      : null;

  const totalHealth = 100;
  const hitDamage = 5;
  const size = 54;

  // Swing progress bar opacity settings
  const SWING_MAX_OPACITY = 0.15;
  const SWING_FADE_AMOUNT = 0.05;
  const swingOpacity =
    swingProgress <= 50
      ? SWING_MAX_OPACITY -
        SWING_FADE_AMOUNT +
        (swingProgress / 50) * SWING_FADE_AMOUNT
      : SWING_MAX_OPACITY;

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
        let minutes = dur.minutes();
        let seconds = dur.seconds();
        let milliseconds = dur.milliseconds();

        const segments = totalHealth / hitDamage;
        const swingTimerSeconds = (currentSprint.duration * 60) / segments;

        const wordsPerSegment = currentSprint.goal / segments;
        const segmentsComplete = Math.floor(
          currentParticipant.words / wordsPerSegment,
        );
        const missingMobHealth = segmentsComplete * hitDamage;
        const mobHealth = totalHealth - missingMobHealth;

        const totalSeconds = currentSprint.duration * 60;
        const remainingSeconds = minutes * 60 + seconds + milliseconds / 1000;
        const timeElapsed = totalSeconds - remainingSeconds;
        const playerHealthHits = Math.floor(timeElapsed / swingTimerSeconds);
        const playerHealthLost = playerHealthHits * hitDamage;
        const playerHealth =
          totalHealth - playerHealthLost <= 0
            ? 0
            : totalHealth - playerHealthLost;
        const goalProgress = Math.round(
          (currentParticipant.words / currentSprint.goal) * 100,
        );
        const mobHealthPercentage = 100 - goalProgress;
        const secondsSinceLastHit = timeElapsed % swingTimerSeconds;
        const swingProgress = (secondsSinceLastHit / swingTimerSeconds) * 100;

        setUIData({
          swingTimerSeconds,
          swingProgress,
          mobHealth,
          playerHealth,
          goalProgress,
          mobHealthPercentage,
        });

        if ((minutes <= 0 && seconds <= 0) || mobHealth <= 0) {
          if (intervalId) clearInterval(intervalId);
          setSprintComplete({
            ...currentSprint,
            complete: true,
            active: false,
            mobHealth: { total: totalHealth, remaining: mobHealth },
            playerHealth: {
              total: totalHealth,
              remaining: mobHealth > 0 ? 0 : playerHealth,
            },
          });
          setTime(`00:00`);
          if (currentSprint.id) {
            updateSprint(currentSprint.id, {
              complete: true,
              active: false,
              mobHealth: { total: totalHealth, remaining: mobHealth },
              playerHealth: { total: totalHealth, remaining: playerHealth },
            });
          }
        } else {
          let formattedMinutes = minutes < 10 ? `0${minutes}` : minutes;
          let formattedSeconds = seconds < 10 ? `0${seconds}` : seconds;
          setTime(`${formattedMinutes}:${formattedSeconds}`);
        }
      } else if (currentSprintComplete) {
        setUIData({
          swingTimerSeconds: 0,
          swingProgress: 0,
          mobHealth: uiData.mobHealth,
          playerHealth: uiData.playerHealth,
          goalProgress: 0,
          mobHealthPercentage: 100,
        });
      } else {
        if (intervalId) clearInterval(intervalId);
        setUIData({
          swingTimerSeconds: 0,
          swingProgress: 0,
          mobHealth: 100,
          playerHealth: 100,
          goalProgress: 0,
          mobHealthPercentage: 100,
        });
      }
    };

    intervalId = setInterval(() => {
      updateSprintData();
    }, 100);
    updateSprintData();

    return () => {
      if (intervalId) clearInterval(intervalId);
    };
  }, []); // Empty dependency - only run once on mount

  const background = theme.palette.background.paper;
  const text = theme.palette.text;

  return (
    <Box component={Paper} p={1}>
      <Stack
        direction="row"
        sx={{
          containerType: "inline-size",
          gap: 1,
          "@container (min-width: 400px)": {
            gap: 2,
          },
        }}
      >
        <Stack direction="row" spacing={1} alignItems="top" flexGrow={1}>
          <Avatar
            variant="rounded"
            sx={{
              bgcolor: amber[500],
              background: `linear-gradient(45deg, ${pink[500]} 30%, ${amber[500]} 90%)`,
              width: 32,
              height: 32,
              "@container (min-width: 400px)": {
                width: 54,
                height: 54,
              },
            }}
            src={user?.avatarURL}
          />
          <Box flexGrow={1}>
            <Typography
              component={Box}
              variant="button"
              sx={{
                fontWeight: "bold",
                width: "110px",
                mt: -0.5,
                "@container (min-width: 400px)": {
                  mt: 0,
                },
              }}
              mb={-0.75}
              noWrap
            >
              {user?.displayName}
            </Typography>
            <Stack direction="row" spacing={1} alignItems="center" mb={-0.75}>
              <LinearProgress
                sx={{ height: 8, borderRadius: 3, flexGrow: 1 }}
                variant="determinate"
                color={
                  playerHealth > 70
                    ? "success"
                    : playerHealth > 40
                      ? "warning"
                      : "error"
                }
                value={playerHealth}
              />
              <Typography
                variant="caption"
                sx={{ color: text.secondary, fontSize: 12 }}
              >
                {playerHealth}/{totalHealth}
              </Typography>
            </Stack>
            <Stack direction="row" spacing={1} alignItems="center" mb={0.1}>
              <LinearProgress
                color="primary"
                variant="determinate"
                value={goalProgress}
                sx={{ height: 8, flexGrow: 1, borderRadius: 3 }}
              />
              <Typography variant="caption" sx={{ color: text.secondary }}>
                {participant?.words}/{sprint?.goal}
              </Typography>
            </Stack>
            <Stack direction="row" spacing={1}>
              <Typography variant="body2" component="div">
                {time}
              </Typography>
              <MUILink
                component="div"
                variant="body2"
                onClick={handleQuit}
                sx={{ cursor: "pointer" }}
              >
                Quit
              </MUILink>
            </Stack>
          </Box>
        </Stack>
        <Typography
          color="text.error"
          sx={{
            fontWeight: "800",
            fontSize: "1rem",
            fontFamily: "system-ui",
            letterSpacing: -0.8,
            "@container (min-width: 400px)": {
              fontSize: "2rem",
            },
          }}
        >
          VS
        </Typography>
        <Stack direction="row" spacing={1} alignItems="top" flexGrow={1}>
          <Avatar
            variant="rounded"
            sx={{
              bgcolor: amber[500],
              background: `linear-gradient(45deg, ${pink[500]} 30%, ${amber[500]} 90%)`,
              width: 32,
              height: 32,
              "@container (min-width: 400px)": {
                width: 54,
                height: 54,
              },
            }}
          >
            <Box
              component="img"
              alt={monster.name}
              src={monster.image}
              sx={{
                width: 28,
                height: 28,
                "@container (min-width: 400px)": {
                  width: 50,
                  height: 50,
                },
              }}
            />
          </Avatar>
          <Box flexGrow={1}>
            <Typography
              component={Box}
              variant="button"
              sx={{
                fontWeight: "bold",
                width: "auto",
                mt: -0.5,
                "@container (min-width: 400px)": {
                  mt: 0,
                  width: 110,
                },
              }}
              mb={-0.75}
            >
              {monster.name}
            </Typography>
            <Stack direction="row" spacing={1} alignItems="center" mb={-0.75}>
              <LinearProgress
                sx={{ height: 8, borderRadius: 3, flexGrow: 1 }}
                variant="determinate"
                color={
                  mobHealthPercentage > 70
                    ? "success"
                    : mobHealthPercentage > 40
                      ? "warning"
                      : "error"
                }
                value={mobHealth}
              />
              <Typography
                variant="caption"
                sx={{ color: text.secondary, fontSize: 12 }}
              >
                {mobHealth}
              </Typography>
            </Stack>
            <Box mt={0.75}>
              <LinearProgress
                color="inherit"
                variant="determinate"
                value={swingProgress}
                sx={{
                  height: 8,
                  opacity: swingOpacity,
                  flexGrow: 1,
                  borderRadius: 3,
                  transition: "opacity 0.1s linear",
                  "& .MuiLinearProgress-bar": {
                    transition: "transform 0.1s linear",
                  },
                }}
              />
            </Box>
          </Box>
        </Stack>
      </Stack>
    </Box>
  );
}
