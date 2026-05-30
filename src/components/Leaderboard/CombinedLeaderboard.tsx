/**
 * CombinedLeaderboard Component
 * 
 * Displays monthly and yearly leaderboards in the chrome extension
 * Uses collectionGroup queries to fetch cross-user leaderboard data
 */

import React, { useState, useEffect } from 'react';
import { Stack, Alert, Box, Divider, Button } from '@mui/material';
import { useGlobalData } from '../../context/GlobalDataProvider';
import { db } from '../../config/firebase';
import { getCombinedLeaderboardRank } from '../../lib/leaderboard';
import { CombinedLeaderboard as CombinedLeaderboardType, LeaderboardPeriod } from '@writinghabit/models';
import { getCombinedLeaderboardAroundWordCount, loadMoreCombinedLeaderboard } from '@writinghabit/store';
import { DocumentSnapshot, collectionGroup, query, where, orderBy, limit, getDocs, doc, getDoc } from 'firebase/firestore';
import CombinedUserCard from './CombinedUserCard';
import { SkeletonLeaderboardItem, LeaderboardRank } from '@writinghabit/ui';

interface Props {
  period: LeaderboardPeriod;
  year: string;
  month: string | null;
  viewMode: 'top10' | 'around-me';
}

export default function CombinedLeaderboard({ period, year, month, viewMode }: Props) {
  const { user } = useGlobalData();
  const [loading, setLoading] = useState(true);
  const [leaderboard, setLeaderboard] = useState<CombinedLeaderboardType[]>([]);
  const [userRank, setUserRank] = useState<number>(0);
  const [lastDocCursor, setLastDocCursor] = useState<DocumentSnapshot | null>(null);
  const [hasMore, setHasMore] = useState(false);
  const [endOfResult, setEndOfResult] = useState(false);
  const [userLeaderboardData, setUserLeaderboardData] = useState<CombinedLeaderboardType | null>(null);

  const excludeManualTracking = user?.preferences?.excludeManualTracking ?? false;
  const useNetWords = user?.preferences?.wordCountDisplay === 'net';

  // Determine which property to query on based on period and preferences
  let queryProp = useNetWords ? "totalNetWords" : "totalWords";
  if (period === "monthlyLeaderboard" && month) {
    queryProp = `month${month}`;
    if (useNetWords) {
      queryProp += "Net";
    }
  }

  useEffect(() => {
    loadLeaderboard();
  }, [period, year, month, viewMode, user, excludeManualTracking, useNetWords]);

  const handleLoadMore = async () => {
    if (!user || !lastDocCursor || !hasMore) return;

    try {
      const result = await loadMoreCombinedLeaderboard({
        db,
        year,
        prop: queryProp as keyof CombinedLeaderboardType,
        lastDoc: lastDocCursor,
        pageSize: 10,
        excludeManual: excludeManualTracking,
      });

      setLeaderboard((prev) => [...prev, ...result.users]);
      setLastDocCursor(result.lastDoc);
      setHasMore(result.hasMore);
      setEndOfResult(!result.hasMore);
    } catch (error) {
      console.error('[CombinedLeaderboard] Error loading more:', error);
    }
  };

  async function loadLeaderboard() {
    if (!user) return;
    
    // Validate queryProp
    if (!queryProp || queryProp.length === 0) {
      console.error('Invalid queryProp:', queryProp);
      setLoading(false);
      return;
    }
    
    setLoading(true);
    
    try {
      if (viewMode === 'around-me') {
        // Get user's rank and word count first
        const rank = await getCombinedLeaderboardRank({
          userId: user.id,
          period,
          year,
          month,
          excludeManualTracking,
          useNetWords,
        });

        // Get user's word count from their document
        const userDocRef = doc(db, `userLeaderboard/${user.id}/combinedLeaderboard/${year}`);
        const userDocSnap = await getDoc(userDocRef);
        const userData = userDocSnap.exists() ? userDocSnap.data() : null;
        const userWordCount = userData?.[queryProp] || 0;

        if (rank && rank > 0 && userWordCount > 0) {
          setUserRank(rank);

          // Get leaderboard around user using shared utility
          const result = await getCombinedLeaderboardAroundWordCount({
            db,
            userWordCount,
            year,
            prop: queryProp as any,
            beforeCount: 3,
            afterCount: 6,
            excludeManual: excludeManualTracking,
          });

          setLeaderboard(result.users);
          setLastDocCursor(result.lastDoc);
          setHasMore(result.hasMore);
        } else {
          // User has no data, show top 10
          setUserRank(0);
          
          const constraints = [
            where('id', '==', year),
            where(queryProp, '>', 0),
            ...(excludeManualTracking ? [where('manuallyTracked', '==', false)] : []),
            orderBy(queryProp, 'desc'),
            limit(10),
          ];

          const topQuery = query(collectionGroup(db, 'combinedLeaderboard'), ...constraints);
          const snapshot = await getDocs(topQuery);

          const docList = snapshot.docs.map((doc) => ({
            ...doc.data(),
            id: doc.id,
          })) as CombinedLeaderboardType[];

          setLeaderboard(docList);
          setLastDocCursor(snapshot.docs[snapshot.docs.length - 1] || null);
          setHasMore(snapshot.docs.length === 10);
        }
      } else {
        // Top 10 view - use traditional query
        const constraints = [
          where('id', '==', year),
          where(queryProp, '>', 0),
          ...(excludeManualTracking ? [where('manuallyTracked', '==', false)] : []),
          orderBy(queryProp, 'desc'),
          limit(10),
        ];

        const topQuery = query(collectionGroup(db, 'combinedLeaderboard'), ...constraints);
        const snapshot = await getDocs(topQuery);

        const docList = snapshot.docs.map((doc) => ({
          ...doc.data(),
          id: doc.id,
        })) as CombinedLeaderboardType[];

        setLeaderboard(docList);
        setLastDocCursor(snapshot.docs[snapshot.docs.length - 1] || null);
        setHasMore(snapshot.docs.length === 10);

        // Get user's rank and leaderboard data if not in top 10
        const rank = await getCombinedLeaderboardRank({
          userId: user.id,
          period,
          year,
          month,
          excludeManualTracking,
          useNetWords,
        });
        setUserRank(rank || 0);
        
        // Get user's leaderboard data
        const userDocRef = doc(db, `userLeaderboard/${user.id}/combinedLeaderboard/${year}`);
        const userDocSnap = await getDoc(userDocRef);
        if (userDocSnap.exists()) {
          setUserLeaderboardData(userDocSnap.data() as CombinedLeaderboardType);
        }
      }
    } catch (error) {
      console.error('Error loading combined leaderboard:', error);
      console.error('Debug info:', { period, year, month, queryProp, viewMode });
      // Set empty state on error
      setLeaderboard([]);
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <Stack spacing={1}>
        {[...Array(5)].map((_, i) => (
          <SkeletonLeaderboardItem key={i} />
        ))}
      </Stack>
    );
  }

  if (leaderboard.length === 0) {
    return (
      <Alert severity="info">
        No leaderboard data available yet for this period. Start writing to appear!
      </Alert>
    );
  }

  return (
    <>
      {userRank > 0 && viewMode === 'top10' && userRank > 10 && user && userLeaderboardData && (
        <>
          <LeaderboardRank
            userLeaderboard={userLeaderboardData}
            leaderboard={{ 
              words: userLeaderboardData[queryProp as keyof CombinedLeaderboardType] || 0, 
              rank: userRank, 
              progress: 0 
            }}
            profileUser={user}
            period={period}
            wordField={queryProp as keyof CombinedLeaderboardType}
            currentUserId={user.id}
          />
          <Box mb={1}>
            <Divider />
          </Box>
        </>
      )}
      
      <Stack spacing={1}>
        {leaderboard.map((item, index) => {
          // Calculate actual rank
          let rank = index + 1;
          if (viewMode === 'around-me' && userRank > 10) {
            rank = userRank - 3 + index;
          }

          return (
            <CombinedUserCard
              key={item.userId || index}
              userLeaderboard={item}
              rank={rank}
              value={item[queryProp as keyof CombinedLeaderboardType] || 0}
              secondaryValue={item.totalWords || 0}
              period={period}
            />
          );
        })}
        {/* Show skeleton items if fewer than 10 results AND no more data */}
        {(() => {
          const skeletonCount = 10 - leaderboard.length;
          return leaderboard.length < 10 && !hasMore &&
            [...Array(skeletonCount)].map((_, i) => {
              // Calculate what the last actual rank was
              const lastActualRank = viewMode === 'around-me' && userRank > 10
                ? userRank - 3 + leaderboard.length - 1
                : leaderboard.length;
              
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
            });
        })()}
        {/* Load more button */}
        {hasMore && (
          <Button color="inherit" onClick={handleLoadMore} fullWidth>
            Load more
          </Button>
        )}
        {endOfResult && leaderboard.length > 10 && (
          <Alert severity="info">You've reached the end!</Alert>
        )}
      </Stack>
    </>
  );
}
