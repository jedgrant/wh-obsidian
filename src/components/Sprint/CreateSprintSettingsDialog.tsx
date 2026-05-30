/**
 * Create Sprint Settings Dialog - Configure sprint parameters
 */

import React, { useState, useEffect } from "react";
import {
  Box,
  Button,
  Collapse,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControl,
  FormControlLabel,
  Radio,
  RadioGroup,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import {
  SprintModel,
  initializeSprint,
  generateRandomCode,
} from "@writinghabit/models";
import { Timestamp } from "firebase/firestore";
import dayjs from "dayjs";
import { Alert } from "@mui/material";
import { useGlobalData } from "../../context/GlobalDataProvider";
import { createSprint } from "../../lib/sprintManager";
import {
  getSprintSettings,
  saveSprintSettings,
  SprintSettings,
} from "../../lib/sprintSettings";
import monsters from "../../static-data/monsters";

interface Props {
  open: boolean;
  onClose: () => void;
}

export default function CreateSprintSettingsDialog({ open, onClose }: Props) {
  const { user, isOnline: contextOnline } = useGlobalData();
  // Re-read navigator.onLine every render so the dialog reflects true current state
  // even if the context event listener missed an offline/online transition.
  const isOnline = contextOnline && navigator.onLine;
  const [sprintSettings, setSprintSettings] = useState<SprintSettings | null>(
    null,
  );
  const [sprint, setSprint] = useState<SprintModel | null>(null);

  useEffect(() => {
    async function loadSettings() {
      if (!user) return;
      const settings = await getSprintSettings();
      setSprintSettings(settings);
      const sprintData = { ...initializeSprint(user), ...settings };
      setSprint(sprintData);
    }
    loadSettings();
  }, [user]);

  const getMonster = () => {
    return monsters[Math.floor(Math.random() * monsters.length)];
  };

  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (!sprint) return;

    let update = {};
    let value: string | boolean | number = event.target.value;

    if (
      event.target.name === "pve" ||
      event.target.name === "publicSprint" ||
      event.target.name === "monsterBattle"
    ) {
      value = event.target.value === "true";
    }

    if (event.target.name === "duration") {
      value = parseFloat(event.target.value);
      if (isNaN(value)) {
        value = 0;
      }
    }

    if (event.target.name === "goal") {
      value = parseInt(event.target.value, 10);
      if (isNaN(value)) {
        value = 0;
      }
    }

    update = { [event.target.name]: value };

    if (event.target.name === "pve" && value === true) {
      update = {
        ...update,
        publicSprint: false,
      };
    }

    if (event.target.name === "monsterBattle" && value === true) {
      update = {
        ...update,
        winCondition: "either",
      };
    }

    setSprint((prevState) => ({
      ...prevState!,
      ...update,
    }));
  };

  const handleCreateSprint = async () => {
    if (!sprint || !user) return;
    if (!isOnline && !sprint.pve) return; // Guard: multiplayer requires online

    let updated = { ...sprint };

    if (sprint.pve) {
      const selectedMonster = sprint.monsterBattle ? getMonster() : undefined;
      updated = {
        ...sprint,
        started: true,
        publicSprint: false,
        startTime: Timestamp.fromDate(new Date()),
        endTime: Timestamp.fromDate(
          dayjs().add(sprint.duration, "minutes").toDate(),
        ),
        ...(selectedMonster && { monsterId: selectedMonster.id }),
      };
    } else {
      updated = {
        ...sprint,
        started: false,
        startTime: Timestamp.fromDate(new Date()),
        code: generateRandomCode(),
        endTime: Timestamp.fromDate(dayjs().add(30, "minutes").toDate()),
      };
    }

    const settings = {
      duration: updated.duration,
      goal: updated.goal,
      monsterBattle: updated.monsterBattle,
      publicSprint: updated.publicSprint,
      winCondition: updated.winCondition,
    };

    await saveSprintSettings(settings);
    await createSprint(updated);
    onClose();
  };

  if (!sprint) return null;

  return (
    <Dialog open={open} onClose={onClose}>
      <DialogTitle>Start a writing sprint</DialogTitle>
      <DialogContent>
        <Box>
          <Typography sx={{ fontWeight: "bold" }}>Participants</Typography>
          <FormControl>
            <RadioGroup
              row
              aria-labelledby="pve"
              name="pve"
              value={sprint.pve}
              onChange={handleChange}
            >
              <FormControlLabel
                value={true}
                control={<Radio />}
                label="Solo"
              />
              <FormControlLabel
                value={false}
                control={<Radio />}
                label="Multiplayer"
              />
            </RadioGroup>
          </FormControl>
        </Box>

        <Collapse in={!sprint.pve} timeout={300}>
          <Box mt={2}>
            <Typography sx={{ fontWeight: "bold" }}>Visibility</Typography>
            <FormControl>
              <RadioGroup
                row
                aria-labelledby="publicSprint"
                name="publicSprint"
                value={sprint.publicSprint}
                onChange={handleChange}
              >
                <FormControlLabel
                  value={true}
                  control={<Radio />}
                  label="Public"
                />
                <FormControlLabel
                  value={false}
                  control={<Radio />}
                  label="Private"
                />
              </RadioGroup>
            </FormControl>
          </Box>
        </Collapse>

        <Collapse in={!sprint.pve} timeout={300}>
          <Box my={2}>
            <Typography sx={{ fontWeight: "bold" }}>Win condition</Typography>
            <FormControl>
              <RadioGroup
                row
                aria-labelledby="winCondition"
                name="winCondition"
                value={sprint.winCondition}
                onChange={handleChange}
              >
                <FormControlLabel
                  value={"time"}
                  control={<Radio />}
                  label="Words at the end of time"
                />
                <FormControlLabel
                  value={"words"}
                  control={<Radio />}
                  label="First to goal"
                />
              </RadioGroup>
            </FormControl>
          </Box>
        </Collapse>

        <Collapse in={sprint.pve} timeout={300}>
          <FormControl sx={{ my: 2, display: "block" }}>
            <RadioGroup
              row
              aria-labelledby="monsterBattle"
              name="monsterBattle"
              value={sprint.monsterBattle}
              onChange={handleChange}
            >
              <FormControlLabel
                value={false}
                control={<Radio />}
                label="Timed"
              />
              <FormControlLabel
                value={true}
                control={<Radio />}
                label="Monster Battle"
              />
            </RadioGroup>
          </FormControl>
        </Collapse>

        <Collapse in={sprint.pve && !sprint.monsterBattle} timeout={300}>
          <Box my={2}>
            <Typography sx={{ fontWeight: "bold" }}>End condition</Typography>
            <FormControl>
              <RadioGroup
                row
                aria-labelledby="winCondition"
                name="winCondition"
                value={sprint.winCondition}
                onChange={handleChange}
              >
                <FormControlLabel
                  value={"either"}
                  control={<Radio />}
                  label="Either"
                />
                <FormControlLabel
                  value={"time"}
                  control={<Radio />}
                  label="Time expires"
                />
                <FormControlLabel
                  value={"words"}
                  control={<Radio />}
                  label="Goal reached"
                />
              </RadioGroup>
            </FormControl>
          </Box>
        </Collapse>

        <Stack direction="row" spacing={2} sx={{ my: 2, mt: 1 }}>
          <TextField
            value={sprint.duration}
            name="duration"
            label="Duration (minutes)"
            placeholder="Duration"
            onChange={handleChange}
            type="number"
            required
            fullWidth
          />
          <TextField
            value={sprint.goal}
            name="goal"
            label={`Word goal`}
            onChange={handleChange}
            type="number"
            required
            fullWidth
          />
        </Stack>
        {!isOnline && !sprint.pve && (
          <Alert severity="error" sx={{ mt: 1 }}>
            You're offline. Multi-person sprints require an internet connection.
          </Alert>
        )}
      </DialogContent>
      <DialogActions>
        <Button size="small" color="inherit" onClick={onClose}>
          Close
        </Button>
        <Button
          disableElevation
          size="small"
          variant="contained"
          onClick={handleCreateSprint}
          disabled={!isOnline && !sprint.pve}
        >
          Create sprint
        </Button>
      </DialogActions>
    </Dialog>
  );
}
