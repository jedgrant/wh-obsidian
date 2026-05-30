import React from "react";
import { UserCard as SharedUserCard } from "@writinghabit/ui";
import { User, LeaderboardPeriod, UserLeaderboard } from "@writinghabit/models";
import { useGlobalData } from "../../context/GlobalDataProvider";

interface UserCardProps {
  userLeaderboard: UserLeaderboard;
  profile: User | null;
  rank: number;
  period?: LeaderboardPeriod;
  admin?: boolean;
  wordField?: "words" | "netWords";
}

export default function UserCard({
  userLeaderboard,
  profile,
  rank,
  period = "dailyLeaderboard",
  admin,
  wordField = "words",
}: UserCardProps) {
  const { user } = useGlobalData();

  // Extension doesn't support profile navigation yet
  const handleProfileClick = (userName: string, userId: string) => {
    console.log("Profile click not yet supported in extension:", userName, userId);
  };

  return (
    <SharedUserCard
      userLeaderboard={userLeaderboard}
      profile={profile}
      rank={rank}
      currentUserId={user?.id}
      period={period}
      onProfileClick={handleProfileClick}
      admin={admin}
      wordField={wordField}
    />
  );
}

