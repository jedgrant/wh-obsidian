/**
 * Free Leaderboard Page for Word Add-in
 * Shown when user doesn't have access to premium leaderboards.
 * Ported from chrome-ext — no chrome deps.
 */

import React, { useCallback, useState } from "react";
import { Box, Fade } from "@mui/material";
import {
  FreeLeaderboardContent,
  MonthLeaderboardLineGraph,
} from "@writinghabit/ui";
import { useGlobalData } from "../context/GlobalDataProvider";
import { useNavigation } from "../context/NavigationProvider";
import {
  getCombinedLeaderboardRank,
  getUserLeaderboard,
} from "../lib/leaderboard";
import {
  getDocs,
  orderBy,
  query,
  collectionGroup,
  limit,
  startAfter,
  where,
} from "firebase/firestore";
import dayjs from "dayjs";
import { CombinedLeaderboard } from "@writinghabit/models";
import { db } from "../config/firebase";

export function LeaderboardFree() {
  const { navigate } = useNavigation();
  const { user } = useGlobalData();
  const [lastResult, setLastResult] = useState<any>(null);
  const pageSize = 10;

  const handleSignUp = useCallback(() => {
    window.open("https://writinghabit.app/create-account", "_blank");
  }, []);

  const handlePricing = useCallback(() => {
    window.open("https://writinghabit.app/pricing", "_blank");
  }, []);

  const handleSubscribe = useCallback(() => {
    navigate("subscription");
  }, [navigate]);

  const getCombinedLeaderboardRankWrapper = useCallback(
    async (params: { words: number; prop: string; year: string }) => {
      const userId = user?.id;
      if (!userId) return 0;
      const month = params.prop.replace("month", "").replace("Net", "");
      const useNetWords = params.prop.includes("Net");
      try {
        const result = await getCombinedLeaderboardRank({
          userId,
          period: "combinedLeaderboard",
          year: params.year,
          month: month || null,
          useNetWords,
        });
        return result;
      } catch (error) {
        console.error("Error getting leaderboard rank:", error);
        return 0;
      }
    },
    [user]
  );

  const getLeaderboardData = useCallback(
    async (loadMore: boolean) => {
      const month = dayjs().format("MM");
      const queryProp = `month${month}`;

      let q = query(
        collectionGroup(db, "combinedLeaderboard"),
        where("id", "==", dayjs().format("YYYY")),
        where(queryProp, ">", 0),
        orderBy(queryProp, "desc"),
        limit(3)
      );

      if (loadMore && lastResult !== undefined) {
        q = query(q, startAfter(lastResult));
      }

      const docSnapshot = await getDocs(q);
      const docList = docSnapshot.docs.map((doc) => ({
        ...doc.data(),
        id: doc.id,
      })) as CombinedLeaderboard[];

      setLastResult(docSnapshot.docs[docSnapshot.docs.length - 1]);
      const endOfResult = docList.length < pageSize;

      return { docList, endOfResult };
    },
    [lastResult]
  );

  return (
    <Fade in={true} timeout={700}>
      <Box sx={{ flexGrow: 1, overflowY: "auto", pt: 2 }}>
        <FreeLeaderboardContent
          user={user}
          mobile={false}
          width={800}
          onSignUpClick={handleSignUp}
          onPricingClick={handlePricing}
          onSubscribeClick={handleSubscribe}
          getCombinedLeaderboardRank={getCombinedLeaderboardRankWrapper}
          getUserLeaderboard={getUserLeaderboard}
          getLeaderboardData={getLeaderboardData}
          MonthLeaderboardLineGraphComponent={MonthLeaderboardLineGraph}
        />
      </Box>
    </Fade>
  );
}
