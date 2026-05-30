/**
 * Solo Active Panel - PvE Sprint UI for Chrome Extension
 *
 * Matches web app's SoloActive.tsx component exactly
 * Shows monster battle or simple timer based on sprint.monsterBattle
 */

import React, { useState } from "react";
import { Theme } from "@mui/material";
import { useTheme } from "@mui/material/styles";
import { useSprint } from "../../context/SprintContext";
import { useGlobalData } from "../../context/GlobalDataProvider";
import { deleteSprint } from "../../lib/sprintManager";
import monsters, { Monster } from "../../static-data/monsters";
import SoloMonster from "./SoloMonster";
import SoloTimer from "./SoloTimer";
import SoloVictory from "./SoloVictory";
import SoloDefeat from "./SoloDefeat";

const getMonsterById = (monsterId?: string): Monster => {
  if (monsterId) {
    const monster = monsters.find((m: Monster) => m.id === monsterId);
    if (monster) return monster;
  }
  return monsters[Math.floor(Math.random() * monsters.length)];
};

export default function SoloActivePanel() {
  const { user } = useGlobalData();
  const { sprint, sprintComplete, setSprintComplete } = useSprint();
  const theme = useTheme() as Theme;

  const [monster] = useState(() => getMonsterById(sprint?.monsterId));
  const [minimized, setMinimized] = useState(false);

  // Only show if there's an active or completed sprint
  if (!user || (!sprint && !sprintComplete)) return null;

  const handleQuit = () => {
    if (sprint?.id) {
      deleteSprint(sprint.id);
    }
    setMinimized(false);
  };

  const handleClearSprint = () => {
    setSprintComplete(null);
  };

  // Get participant data
  const participant = sprint
    ? sprint[user.id]
    : sprintComplete
      ? sprintComplete[user.id]
      : null;

  
      // Show minimized timer if minimized
  if (minimized && sprint?.pve) {
    return (
      <SoloTimer
        handleQuit={handleQuit}
        minimized={minimized}
        setMinimized={setMinimized}
      />
    );
  }

  // Victory condition: sprint complete and goal reached
  if (sprintComplete && participant?.words >= sprintComplete.goal) {
    return <SoloVictory />;
  }

  // Defeat condition: sprint complete but goal not reached
  if (sprintComplete && participant?.words < sprintComplete.goal) {
    return <SoloDefeat />;
  }

  // Active sprint UI
  if (sprint?.monsterBattle) {
    return <SoloMonster handleQuit={handleQuit} monster={monster} />;
  } else if (sprint) {
    return (
      <SoloTimer
        handleQuit={handleQuit}
        minimized={minimized}
        setMinimized={setMinimized}
      />
    );
  }

  return <>SHOULD NOT HAPPEN</>;
}
