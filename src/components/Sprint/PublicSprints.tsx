/**
 * Public Sprints List - Shows available public sprints
 */

import React from "react";
import { Timestamp } from "firebase/firestore";
import dayjs from "dayjs";
import { PublicSprints as SharedPublicSprints } from "@writinghabit/ui";
import { useSprint } from "../../context/SprintContext";
import { useGlobalData } from "../../context/GlobalDataProvider";
import {
  leaveSprint,
  deleteSprint,
  updateSprint,
} from "../../lib/sprintManager";
import { SprintModel } from "@writinghabit/models";

interface Props {
  onJoin?: (code: string) => void | Promise<void>;
}

export default function PublicSprints({ onJoin }: Props) {
  const { publicSprints } = useSprint();
  const { user } = useGlobalData();

  if (!publicSprints || publicSprints.length < 1) return null;

  const handleJoin = (code: string) => {
    onJoin?.(code);
  };

  const handleEndEarly = (id: string) => {
    deleteSprint(id);
  };

  const handleStart = async (sprint: SprintModel) => {
    await updateSprint(sprint.id!, {
      started: true,
      startTime: Timestamp.fromDate(new Date()),
      endTime: Timestamp.fromDate(
        dayjs().add(sprint.duration, "minutes").toDate(),
      ),
      active: true,
    });
  };

  const handleLeave = (sprint: SprintModel) => {
    if (user) leaveSprint(sprint, user);
  };

  return (
    <SharedPublicSprints
      publicSprints={publicSprints}
      user={user!}
      onJoin={handleJoin}
      onEndEarly={handleEndEarly}
      onStart={handleStart}
      onLeave={handleLeave}
    />
  );
}

