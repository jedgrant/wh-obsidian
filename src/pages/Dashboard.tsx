/**
 * Dashboard Page for Word Add-in
 *
 * Adapted from chrome-ext:
 * - Removed useRenderTracker (dev utility)
 * - Replaced TrackProjectConfirmation with inline CTA Button
 * - Removed updateProjectCount (not available)
 * - Uses word-addin RecentProjects (no chrome.tabs)
 */

import { useState, useEffect } from "react";
import { loadPluginDataKey, savePluginDataKey } from "../lib/pluginData";
import {
  Box,
  Fade,
  Stack,
  Paper,
  Typography,
  Button,
  CircularProgress,
} from "@mui/material";
import { RecentProjects } from "../components/RecentProjects";
import { useRecentProjects } from "../hooks/useRecentProjects";
import {
  Streak,
  WordCompare,
  TotalWordsPerDay,
  TotalMinutesPerDay,
  ErrorBoundary,
} from "@writinghabit/ui";
import { useGlobalData } from "../context/GlobalDataProvider";
import { useTheme } from "@mui/material/styles";
import { getSubDetails } from "@writinghabit/utils";
import { useNavigation } from "../context/NavigationProvider";
import { Article, Lock } from "@mui/icons-material";
import { FREE_PROJECTS } from "../components/freeTierValues";
import { updateProjectCount } from "../lib/updateProjectCount";

interface DashboardProps {
  showConfirmation: boolean;
  documentTitle?: string;
  onCreateProject?: () => Promise<void>;
  userId: string;
}

export function Dashboard({
  showConfirmation,
  documentTitle,
  onCreateProject,
  userId,
}: DashboardProps) {
  const { navigate } = useNavigation();
  const { user, setProject, combinedLeaderboard } = useGlobalData();
  const { isSubscribedOrTrialing } = getSubDetails(user);
  const canCreateProject =
    isSubscribedOrTrialing || (user?.projectCount ?? 0) < FREE_PROJECTS;
  const theme = useTheme();
  const [showPasted, setShowPasted] = useState(false);

  useEffect(() => {
    loadPluginDataKey("showPasted", false).then(setShowPasted);
  }, []);
  const [creatingProject, setCreatingProject] = useState(false);

  const { projects: fetchedProjects, loading } = useRecentProjects({
    userId,
    enabled: true,
    setProject,
  });

  const [projects, setProjects] = useState(fetchedProjects);

  useEffect(() => {
    setProjects(fetchedProjects);
  }, [fetchedProjects]);

  const handleCreateProject = async () => {
    if (!onCreateProject) return;
    setCreatingProject(true);
    try {
      await onCreateProject();
      try {
        await updateProjectCount(userId);
      } catch (err) {
        console.error("Failed to update project count:", err);
      }
    } catch (err) {
      console.error("Failed to create project:", err);
    } finally {
      setCreatingProject(false);
    }
  };

  const handlePastedToggle = (checked: boolean) => {
    savePluginDataKey("showPasted", checked);
    setShowPasted(checked);
  };

  const handleProjectDeleted = (projectId: string) => {
    setProjects((prev) => prev.filter((p) => p.id !== projectId));
  };

  return (
    <Fade in={true} timeout={700}>
      <Stack spacing={1}>
        {/* Inline CTA: Track this Word document */}
        {showConfirmation && documentTitle && onCreateProject && (
          <Paper elevation={2} sx={{ p: 2 }}>
            <Box sx={{ display: "flex", alignItems: "flex-start", gap: 1.5 }}>
              {canCreateProject ? (
                <Article color="primary" sx={{ mt: 0.25 }} />
              ) : (
                <Lock color="warning" sx={{ mt: 0.25 }} />
              )}
              <Box flex={1}>
                <Typography variant="body1" fontWeight="bold" noWrap>
                  {documentTitle}
                </Typography>
                {canCreateProject ? (
                  <>
                    <Typography
                      variant="body2"
                      color="text.secondary"
                      sx={{ mb: 1.5 }}
                    >
                      Start tracking this vault to record your writing
                      progress.
                    </Typography>
                    <Button
                      variant="contained"
                      size="small"
                      onClick={handleCreateProject}
                      disabled={creatingProject}
                      startIcon={
                        creatingProject ? <CircularProgress size={14} /> : null
                      }
                    >
                      {creatingProject ? "Starting..." : "Start Tracking"}
                    </Button>
                  </>
                ) : (
                  <>
                    <Typography
                      variant="body2"
                      color="text.secondary"
                      sx={{ mb: 1.5 }}
                    >
                      You've reached the free plan limit of {FREE_PROJECTS}{" "}
                      tracked document. Subscribe to track unlimited documents.
                    </Typography>
                    <Button
                      variant="contained"
                      size="small"
                      color="warning"
                      onClick={() => navigate("subscription")}
                      startIcon={<Lock />}
                    >
                      Upgrade to Track
                    </Button>
                  </>
                )}
              </Box>
            </Box>
          </Paper>
        )}

        {/* Writing Streak */}
        {combinedLeaderboard && (
          <ErrorBoundary type="Streak">
            <Streak
              currentStreakEnd={
                combinedLeaderboard.currentStreakEnd || undefined
              }
              currentStreak={combinedLeaderboard.currentStreak || 0}
              longestStreak={combinedLeaderboard.longestStreak || 0}
              monthStreak={
                (combinedLeaderboard as any)[
                  `monthStreak${new Date().getMonth() + 1 < 10 ? "0" : ""}${new Date().getMonth() + 1}`
                ] || 0
              }
              lifetimeWritingDays={combinedLeaderboard.lifetimeWritingDays || 0}
              combinedLeaderboard={combinedLeaderboard}
              isSubscribedOrTrialing={isSubscribedOrTrialing}
              onSubClick={() => navigate("subscription")}
            />
          </ErrorBoundary>
        )}
        {/* Word Comparison */}
        {combinedLeaderboard && (
          <ErrorBoundary type="WordCompare">
            <WordCompare
              dailyWords={combinedLeaderboard as any}
              dailyNetWords={combinedLeaderboard?.dailyNetWordsTotal}
              useNetWords={false}
              palette={theme.palette}
            />
          </ErrorBoundary>
        )}
        {/* Recent projects list */}
        <ErrorBoundary type="RecentProjects">
          <RecentProjects
            projects={projects}
            loading={loading}
            userId={userId}
            onProjectDeleted={handleProjectDeleted}
          />
        </ErrorBoundary>
        {/* Total Words Per Day */}
        {combinedLeaderboard?.projectCounts && (
          <ErrorBoundary type="TotalWordsPerDay">
            <TotalWordsPerDay
              projectCounts={combinedLeaderboard.projectCounts as any}
              showPasted={showPasted}
              onPastedToggle={handlePastedToggle}
              palette={theme.palette}
            />
          </ErrorBoundary>
        )}

        {/* Total Minutes Per Day */}
        {combinedLeaderboard?.projectCounts && (
          <ErrorBoundary type="TotalMinutesPerDay">
            <TotalMinutesPerDay
              projectCounts={combinedLeaderboard.projectCounts as any}
              palette={theme.palette}
            />
          </ErrorBoundary>
        )}
      </Stack>
    </Fade>
  );
}
