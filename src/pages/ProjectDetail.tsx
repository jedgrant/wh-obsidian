/**
 * Project Detail Page for Word Add-in
 *
 * Adapted from chrome-ext:
 * - Removed useRenderTracker (dev utility)
 * - Removed useCurrentTab, extractTabIdFromUrl (chrome-specific)
 * - Removed WidgetWarningDialog (no widget in Word)
 * - Removed chrome.runtime.sendMessage for stretch goal — no-op stub
 * - Removed chrome.runtime.onMessage widget status listeners
 * - chapterId == projectId (single chapter per Word document)
 */

import React, { useEffect, useState, useCallback } from "react";
import {
  Box,
  CircularProgress,
  Alert,
  Stack,
  useTheme,
  Button,
  Fade,
} from "@mui/material";
import {
  DailyStatsWidget,
  OverallStatsWidget,
  CompetitorWidget,
  ErrorBoundary,
} from "@writinghabit/ui";
import { SessionProvider, useSession } from "../context/SessionContext";
import { SprintProvider } from "../context/SprintContext";
import SprintWidget from "../components/Sprint/SprintWidget";
import { useGlobalData } from "../context/GlobalDataProvider";
import { getChapterStats } from "../lib/chapterUtils";
import { SettingsDialog } from "../components/SettingsDialog";
import { listenToUsersLeaderboard } from "../lib/leaderboard";
import { db } from "../config/firebase";
import type { Theme, UserLeaderboard } from "@writinghabit/models";
import { useNavigation } from "../context/NavigationProvider";
import dayjs from "dayjs";
import { getSubDetails } from "@writinghabit/utils";

function ProjectDetailContent({ chapterId }: { chapterId?: string | null }) {
  const { navigate } = useNavigation();
  const theme = useTheme() as Theme;
  const {
    sessionData,
    project,
    sessionLoading,
    projectLoading,
    stretchGoalProps,
    updateProject,
  } = useSession();
  const { user, combinedLeaderboard } = useGlobalData();
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [userLeaderboard, setUserLeaderboard] = useState<UserLeaderboard | null>(null);

  // No-op stretch goal handler in Word add-in (no background worker)
  const handleCheckStretchGoal = useCallback(
    async (_wordCount: number, _date: string, _goal: number) => {
      // In Word add-in, stretch goals are handled server-side via session updates
    },
    []
  );

  // Listen to user's leaderboard data
  useEffect(() => {
    if (!user?.id) return;
    const unsubscribe = listenToUsersLeaderboard(user.id, (userData) => {
      setUserLeaderboard(userData);
    });
    return () => unsubscribe();
  }, [user?.id]);

  const loading = sessionLoading || projectLoading;

  if (loading) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", p: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (!project) {
    return (
      <Box sx={{ p: 1 }}>
        <Alert severity="info">
          {projectLoading ? "Loading project..." : "No project data available."}
        </Alert>
      </Box>
    );
  }

  const todaySessions = sessionData.today || [];

  const chapterData = chapterId
    ? getChapterStats(project?.chapterWords || {}, project?.chapterMinutes || {}, chapterId)
    : undefined;

  const { isSubscribedOrTrialing } = getSubDetails(user);

  const today = dayjs().format("YYYYMMDD");
  const projectCounts = combinedLeaderboard?.projectCounts?.[project.id];
  const todaysTypedWords = projectCounts?.daily?.[today] || 0;
  const todaysNetWords = projectCounts?.dailyNet?.[today] || 0;
  const todaysHourlyWords: Record<string, number> = projectCounts?.dailyHourlyWords?.[today] || {};
  const totalTypedWords = projectCounts?.total || 0;
  const totalNetWords = projectCounts?.netTotal || 0;

  return (
    <Fade in={true} timeout={700}>
      <Stack spacing={2}>
        <ErrorBoundary type="DailyStatsWidget">
          <DailyStatsWidget
            sessions={todaySessions}
            typedWords={todaysTypedWords}
            netWords={todaysNetWords}
            project={project}
            chapterData={chapterData}
            open={false}
            palette={theme.palette}
            stretchGoalProps={stretchGoalProps}
            onCheckStretchGoal={handleCheckStretchGoal}
            hourlyWords={todaysHourlyWords}
          />
        </ErrorBoundary>
        <ErrorBoundary type="OverallStatsWidget">
          <OverallStatsWidget 
            sessions={sessionData.flattened}
            typedWords={totalTypedWords}
            netWords={totalNetWords}
            project={project}
            chapterData={chapterData}
            open={false}
            palette={theme.palette}
            onNavigateToSettings={() => setSettingsOpen(true)}
            chartLibrary="nivo"
          />
        </ErrorBoundary>
        {user && (
          <ErrorBoundary type="CompetitorWidget">
            <CompetitorWidget
              userLeaderboard={userLeaderboard}
              db={db}
              userName={user.userName}
              hasAccess={isSubscribedOrTrialing}
              excludeManual={user.preferences?.excludeManualTracking ?? false}
              onSubscribeClick={() => navigate("subscription")}
            />
          </ErrorBoundary>
        )}
        <SprintWidget />
        <Button
          onClick={() => setSettingsOpen(true)}
          variant="contained"
          disableElevation
          color="inherit"
        >
          Settings
        </Button>

        {project && (
          <SettingsDialog
            open={settingsOpen}
            onClose={() => setSettingsOpen(false)}
            project={project}
            onOptimisticUpdate={updateProject}
          />
        )}
      </Stack>
    </Fade>
  );
}

interface ProjectDetailProps {
  projectId: string;
  userId: string;
  chapterId?: string | null;
}

export function ProjectDetail({ projectId, userId, chapterId }: ProjectDetailProps) {
  const { getProject } = useGlobalData();
  const cachedProject = getProject(projectId);
  return (
    <SprintProvider userId={userId}>
      <SessionProvider
        projectId={projectId}
        userId={userId}
        enabled={true}
        initialProject={cachedProject || undefined}
      >
        <ProjectDetailContent chapterId={chapterId} />
      </SessionProvider>
    </SprintProvider>
  );
}
