/**
 * Leaderboard Page for Word Add-in
 *
 * Ported from chrome-ext — no chrome deps.
 * Removed: useRenderTracker (dev utility only)
 */

import React, { useState, useEffect } from "react";
import {
  Box,
  Typography,
  Tabs,
  Tab,
  Stack,
  Button,
  Alert,
  ButtonGroup,
  Divider,
  Fade,
} from "@mui/material";
import { useGlobalData } from "../context/GlobalDataProvider";
import { getUserLeaderboard, getUserLeaderboardRank } from "../lib/leaderboard";
import { getUsers } from "../lib/users";
import { UserLeaderboard, User } from "@writinghabit/models";
import UserCard from "../components/Leaderboard/UserCard";
import CombinedLeaderboard from "../components/Leaderboard/CombinedLeaderboard";
import { LeaderboardRank, SkeletonLeaderboardItem } from "@writinghabit/ui";
import dayjs from "dayjs";
import {
  getDocs,
  query,
  collectionGroup,
  where,
  orderBy,
  limit,
  DocumentSnapshot,
} from "firebase/firestore";
import { db } from "../config/firebase";
import {
  getDailyLeaderboardAroundWordCount,
  loadMoreDailyLeaderboard,
} from "@writinghabit/store";
import { getSubDetails } from "@writinghabit/utils";
import { LeaderboardFree } from "./LeaderboardFree";

type TabValue = "day" | "month" | "year";

export function Leaderboard() {
  const { user, userLoading } = useGlobalData();
  const [tab, setTab] = useState<TabValue>("day");
  const [loading, setLoading] = useState(true);
  const [usersLeaderboard, setLeaderboardDocs] = useState<UserLeaderboard[]>(
    [],
  );
  const [users, setUserDocs] = useState<User[]>([]);
  const [userRank, setUserRank] = useState<number>(0);
  const [viewMode, setViewMode] = useState<"top10" | "around-me">("top10");
  const [lastDocCursor, setLastDocCursor] = useState<DocumentSnapshot | null>(
    null,
  );
  const [hasMore, setHasMore] = useState(false);
  const [endOfResult, setEndOfResult] = useState(false);
  const [userLeaderboardData, setUserLeaderboardData] =
    useState<UserLeaderboard | null>(null);

  const period = "dailyLeaderboard" as const;
  const currentYear = dayjs().format("YYYY");
  const currentMonth = dayjs().format("MM");
  const excludeManualTracking =
    user?.preferences?.excludeManualTracking ?? false;
  const preferredViewMode = user?.preferences?.leaderboardViewMode ?? "top10";
  const useNetWords = user?.preferences?.wordCountDisplay === "net";
  const wordField = useNetWords ? "netWords" : "words";

  useEffect(() => {
    setViewMode(preferredViewMode);
  }, [preferredViewMode]);

  const handleLoadMore = async () => {
    if (!user || !lastDocCursor || !hasMore) return;
    try {
      const date = dayjs().format("YYYY-M-D");
      const result = await loadMoreDailyLeaderboard({
        db,
        date,
        period,
        field: wordField,
        lastDoc: lastDocCursor,
        pageSize: 10,
        excludeManual: excludeManualTracking,
      });
      const userNameArray = result.users
        .map((obj) => obj.userName)
        .filter((u) => u !== undefined);
      const profileList = await getUsers(userNameArray, "userName");
      setLeaderboardDocs((prev) => [...prev, ...result.users]);
      setUserDocs((prev) => [...prev, ...profileList]);
      setLastDocCursor(result.lastDoc);
      setHasMore(result.hasMore);
      setEndOfResult(!result.hasMore);
    } catch (error) {
      console.error("[Leaderboard] Error loading more:", error);
    }
  };

  useEffect(() => {
    async function loadLeaderboard() {
      if (!user || tab !== "day") return;
      setLoading(true);
      try {
        const date = dayjs().format("YYYY-M-D");

        if (viewMode === "around-me") {
          const userLeaderboard = await getUserLeaderboard(
            user.id,
            period,
            date,
          );
          const userWordCount = userLeaderboard?.[wordField] ?? 0;
          if (userLeaderboard && userWordCount > 0) {
            const rank = await getUserLeaderboardRank({
              words: userWordCount,
              field: wordField,
              period,
              date,
              excludeManual: excludeManualTracking,
            });
            setUserRank(rank);
            const result = await getDailyLeaderboardAroundWordCount({
              db,
              date,
              period,
              userWordCount,
              field: wordField,
              beforeCount: 3,
              afterCount: 6,
              excludeManual: excludeManualTracking,
            });
            setLeaderboardDocs(result.users);
            setLastDocCursor(result.lastDoc);
            setHasMore(result.hasMore);
            setEndOfResult(!result.hasMore);
            const userNameArray = result.users
              .map((obj) => obj.userName)
              .filter((u) => u !== undefined);
            const profileList = await getUsers(userNameArray, "userName");
            setUserDocs(profileList);
            setLoading(false);
            return;
          }
          setUserRank(0);
        }

        const constraints = [
          where("id", "==", date),
          where(wordField, ">", 0),
          ...(excludeManualTracking
            ? [where("manuallyTracked", "==", false)]
            : []),
          orderBy(wordField, "desc"),
          limit(10),
        ];
        const topQuery = query(collectionGroup(db, period), ...constraints);
        const snapshot = await getDocs(topQuery);
        const docList = snapshot.docs.map((d) => ({
          ...d.data(),
          id: d.id,
        })) as UserLeaderboard[];
        const userNameArray = docList
          .map((obj) => obj.userName)
          .filter((u) => u !== undefined);
        const profileList = await getUsers(userNameArray, "userName");
        setLeaderboardDocs(docList);
        setUserDocs(profileList);
        setLastDocCursor(snapshot.docs[snapshot.docs.length - 1] || null);
        setHasMore(snapshot.docs.length >= 10);
        setEndOfResult(snapshot.docs.length < 10);

        if (user && viewMode === "top10") {
          const userLeaderboard = await getUserLeaderboard(
            user.id,
            period,
            date,
          );
          const userWordCount = userLeaderboard?.[wordField] ?? 0;
          if (userWordCount > 0) {
            const rank = await getUserLeaderboardRank({
              words: userWordCount,
              field: wordField,
              period,
              date,
              excludeManual: excludeManualTracking,
            });
            setUserRank(rank);
            setUserLeaderboardData(userLeaderboard);
          } else {
            setUserRank(0);
            setUserLeaderboardData(null);
          }
        }
      } catch (error) {
        console.error("[Leaderboard] Error loading leaderboard:", error);
      } finally {
        setLoading(false);
      }
    }
    loadLeaderboard();
  }, [tab, user, excludeManualTracking, viewMode, wordField]);

  if (userLoading) {
    return (
      <Box sx={{ p: 2 }}>
        <Typography>Loading leaderboard...</Typography>
      </Box>
    );
  }

  const handleTabChange = (_event: React.SyntheticEvent, newValue: TabValue) =>
    setTab(newValue);
  const handleViewModeChange = (newMode: "top10" | "around-me") =>
    setViewMode(newMode);

  const { isSubscribedOrTrialing } = getSubDetails(user);

  if (!isSubscribedOrTrialing) {
    return <LeaderboardFree />;
  }

  return (
    <Fade in={true} timeout={700}>
      <Box>
        <Box display="flex" alignItems="center" mb={1}>
          <Typography variant="h4" flexGrow={1}>
            Leaderboard
          </Typography>
          <ButtonGroup size="small">
            <Button
              variant={viewMode === "top10" ? "contained" : "outlined"}
              onClick={() => handleViewModeChange("top10")}
            >
              Top 10
            </Button>
            <Button
              variant={viewMode === "around-me" ? "contained" : "outlined"}
              onClick={() => handleViewModeChange("around-me")}
            >
              You
            </Button>
          </ButtonGroup>
        </Box>

        <Tabs variant={"contained" as any} value={tab} onChange={handleTabChange}>
          <Tab label="Day" value="day" />
          <Tab label="Month" value="month" />
          <Tab label="Year" value="year" />
        </Tabs>
        <Stack spacing={2}>
          {tab === "day" && (
            <>
              {userRank > 0 &&
                viewMode === "top10" &&
                userRank > 10 &&
                user &&
                userLeaderboardData && (
                  <>
                    <LeaderboardRank
                      userLeaderboard={userLeaderboardData}
                      leaderboard={{
                        words: userLeaderboardData[wordField],
                        rank: userRank,
                        progress: 0,
                      }}
                      profileUser={user}
                      period={period}
                      wordField={wordField}
                      currentUserId={user.id}
                    />
                    <Box mb={1}>
                      <Divider />
                    </Box>
                  </>
                )}

              {loading ? (
                <Stack spacing={1}>
                  {[...Array(5)].map((_, i) => (
                    <SkeletonLeaderboardItem key={i} />
                  ))}
                </Stack>
              ) : usersLeaderboard.length === 0 ? (
                <Alert severity="info">
                  No leaderboard data available yet. Start writing to appear on
                  the leaderboard!
                </Alert>
              ) : (
                <Stack spacing={1}>
                  {usersLeaderboard.map((userLeaderboard, index) => {
                    const profile =
                      users?.find(
                        (u) => u.userName === userLeaderboard.userName,
                      ) || null;
                    let rank = index + 1;
                    if (viewMode === "around-me" && userRank > 10)
                      rank = userRank - 3 + index;
                    return (
                      <UserCard
                        key={userLeaderboard.userId || index}
                        userLeaderboard={userLeaderboard}
                        profile={profile}
                        rank={rank}
                        period={period}
                        wordField={wordField}
                      />
                    );
                  })}
                  {usersLeaderboard.length < 10 &&
                    !hasMore &&
                    [...Array(10 - usersLeaderboard.length)].map((_, i) => {
                      const lastActualRank =
                        viewMode === "around-me" && userRank > 10
                          ? userRank - 3 + usersLeaderboard.length - 1
                          : usersLeaderboard.length;
                      return (
                        <SkeletonLeaderboardItem
                          key={`skeleton-${i}`}
                          lastRank={lastActualRank + i}
                          index={i}
                          challenge={false}
                          period={period}
                          words={0}
                        />
                      );
                    })}
                  {hasMore && (
                    <Button color="inherit" onClick={handleLoadMore} fullWidth>
                      Load more
                    </Button>
                  )}
                  {endOfResult && usersLeaderboard.length > 10 && (
                    <Alert severity="info">You've reached the end!</Alert>
                  )}
                </Stack>
              )}
            </>
          )}

          {tab === "month" && (
            <CombinedLeaderboard
              period="monthlyLeaderboard"
              year={currentYear}
              month={currentMonth}
              viewMode={viewMode}
            />
          )}

          {tab === "year" && (
            <CombinedLeaderboard
              period="yearlyLeaderboard"
              year={currentYear}
              month={null}
              viewMode={viewMode}
            />
          )}
        </Stack>
      </Box>
    </Fade>
  );
}
