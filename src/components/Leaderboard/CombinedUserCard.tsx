import React from "react";
import { CombinedUserCard as SharedCombinedUserCard } from "@writinghabit/ui";
import { CombinedLeaderboard, LeaderboardPeriod } from "@writinghabit/models";
import { useGlobalData } from "../../context/GlobalDataProvider";
import { Typography } from "@mui/material";

interface Props {
  userLeaderboard: CombinedLeaderboard;
  rank: number;
  value: number;
  secondaryValue: number;
  period?: LeaderboardPeriod;
  admin?: boolean;
}

export default function CombinedUserCard({
  userLeaderboard,
  rank,
  value,
  secondaryValue,
  period = "monthlyLeaderboard",
  admin,
}: Props) {
  const { user } = useGlobalData();

  // Extension doesn't support profile navigation yet
  const handleProfileClick = (userName: string, userId: string) => {
    console.log("Profile click not yet supported in extension:", userName, userId);
  };

  return (
    <SharedCombinedUserCard
      userLeaderboard={userLeaderboard}
      rank={rank}
      value={value}
      secondaryValue={secondaryValue}
      currentUserId={user?.id}
      period={period}
      onProfileClick={handleProfileClick}
      admin={admin}
      renderValueDisplay={(props) => (
        <Typography
          variant="body2"
          pl={2}
          mt={-1}
          color="text.secondary"
          component="div"
        >
          {props.value?.toLocaleString()} words
        </Typography>
      )}
    />
  );
}
