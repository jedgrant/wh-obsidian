import { useState, useEffect, useCallback, useRef } from "react";
import { Box, CircularProgress } from "@mui/material";
import { onAuthStateChanged } from "firebase/auth";
import type { App as ObsidianApp, TFile } from "obsidian";
import { auth } from "./config/firebase";
import { SetupWizard } from "./components/SetupWizard";
import { useVaultDetection } from "./hooks/useVaultDetection";
import { useFileTracking } from "./hooks/useFileTracking";
import { useWordTracking } from "./hooks/useWordTracking";
import type { WordChangeEvent } from "./lib/wordTracker";
import { filePathToChapterId } from "./hooks/useVaultDetection";
import {
  NavigationProvider,
  useNavigation,
} from "./context/NavigationProvider";
import { GlobalDataProvider, useGlobalData } from "./context/GlobalDataProvider";
import { ErrorProvider } from "./context/ErrorContext";
import { WHThemeProvider } from "./context/ThemeProvider";
import { Dashboard } from "./pages/Dashboard";
import { ProjectDetail } from "./pages/ProjectDetail";
import { Leaderboard } from "./pages/Leaderboard";
import { Preferences } from "./pages/Preferences";
import { Subscription } from "./pages/Subscription";
import { ErrorBoundary } from "@writinghabit/ui";
import { Layout } from "./components/Layout";
import { ensureProjectExists, updateSession } from "./lib/sessionManager";
import type { UpdateSessionParams } from "./lib/sessionManager";
import { getAllCounts } from "@writinghabit/utils";
import dayjs from "dayjs";

// ─── Provider shell ───────────────────────────────────────────────────────────

function ProvidedApp({
  userId,
  obsidianApp,
}: {
  userId: string;
  obsidianApp: ObsidianApp;
}) {
  const [projectExists, setProjectExistsOuter] = useState(false);
  const { projectId, projectTitle, chapterTitle, chapterId, activeFile } = useVaultDetection(obsidianApp);

  return (
    <NavigationProvider
      projectId={projectId}
      projectTitle={projectTitle}
      projectExists={projectExists}
    >
      <GlobalDataProvider userId={userId}>
        <ErrorProvider>
          <MainAppWithBridge
            userId={userId}
            obsidianApp={obsidianApp}
            projectId={projectId}
            projectTitle={projectTitle}
            chapterId={chapterId}
            activeFile={activeFile}
            onProjectExistsChange={setProjectExistsOuter}
          />
        </ErrorProvider>
      </GlobalDataProvider>
    </NavigationProvider>
  );
}

function MainAppWithBridge({
  userId,
  obsidianApp,
  projectId,
  projectTitle,
  chapterId,
  activeFile,
  onProjectExistsChange,
}: {
  userId: string;
  obsidianApp: ObsidianApp;
  projectId: string | null;
  projectTitle: string | null;
  chapterId: string | null;
  activeFile: TFile | null;
  onProjectExistsChange: (v: boolean) => void;
}) {
  const { setProject, patchProjectCounts } = useGlobalData();
  const { navigate, currentView, projectId: navProjectId } = useNavigation();
  const { user } = useGlobalData();

  const [projectExists, setProjectExists] = useState(false);
  const [projectChecked, setProjectChecked] = useState(false);

  const sessionDataRef = useRef<any>(null);
  const projectRef = useRef<any>(null);
  // Reactive mirror of projectRef so useFileTracking re-renders when mode changes.
  const [projectState, setProjectState] = useState<any>(null);
  // Serial queue for updateSession calls: prevents concurrent calls from
  // overwriting sessionDataRef with stale/incomplete session data.
  const pendingUpdateRef = useRef<Promise<void>>(Promise.resolve());

  // Per-file tracking mode for the currently active file
  const { mode: activeFileMode, setMode: setActiveFileMode } = useFileTracking(
    projectId,
    chapterId,
    projectState,
    (updated) => {
      projectRef.current = updated;
      setProjectState(updated);
      setProject(projectId!, updated);
    }
  );

  const handleProjectExistsChange = useCallback(
    (v: boolean) => {
      setProjectExists(v);
      onProjectExistsChange(v);
    },
    [onProjectExistsChange]
  );

  // Word tracking → session update
  // Calls are serialised via pendingUpdateRef to prevent concurrent updates from
  // overwriting sessionDataRef with stale/incomplete session data when the user
  // switches documents quickly.
  const handleWordChange = useCallback(
    (event: WordChangeEvent) => {
      if (!projectId || !projectTitle || !user) return;

      // Derive chapterId from the event's file to avoid stale closure bugs.
      const fileChapterId = filePathToChapterId(event.file.path);

      // Check per-file tracking mode from project.chapterTracking (default "full").
      const currentProject: any = projectRef.current;
      const mode =
        (currentProject?.chapterTracking?.[fileChapterId] as string | undefined) ?? "full";
      if (mode === "ignore") return;

      // Capture the event payload now; session data is read inside the chain so
      // each update sees the result of the previous one.
      const capturedEvent = event;
      const capturedFileChapterId = fileChapterId;

      pendingUpdateRef.current = pendingUpdateRef.current.then(async () => {
        if (!user || !projectId || !projectTitle) return;
        const params: UpdateSessionParams = {
          userId,
          projectId,
          documentTitle: projectTitle,
          chapterTitle: capturedEvent.file.basename,
          totalWordCount: capturedEvent.totalWords,
          content: capturedEvent.content,
          sessionChange: capturedEvent.sessionChange,
          sessionData: sessionDataRef.current ?? undefined,
          project: projectRef.current ?? undefined,
          user,
          chapterId: capturedFileChapterId,
        };
        try {
          const result = await updateSession(params);
          if (result.session && result.allSessions) {
            sessionDataRef.current = result.allSessions;
            const counts = getAllCounts(result.allSessions);
            const todayYMD = dayjs().format("YYYYMMDD");
            patchProjectCounts(
              projectId,
              todayYMD,
              counts.dayWords,
              counts.dayNetWords,
              counts.yearWords,
              counts.yearNetWords
            );
          }
          if (result.updatedProject) {
            projectRef.current = result.updatedProject;
            setProjectState(result.updatedProject);
            setProject(projectId, result.updatedProject);
          }
        } catch (err) {
          console.error("[App] updateSession failed:", err);
        }
      });
    },
    [projectId, projectTitle, user, userId, setProject, patchProjectCounts]
  );

  const handleFileChange = useCallback(
    (_newFile: TFile | null, _prevFile: TFile | null) => {
      // File switch handled by wordTracker internally (flushes pending state).
      // We can optionally re-check project here if vault file changes.
    },
    []
  );

  useWordTracking({
    obsidianApp,
    enabled: true,
    onChange: handleWordChange,
    onFileChange: handleFileChange,
  });

  // Check project when projectId changes
  useEffect(() => {
    // Reset the session data and serial-update queue when the project changes
    // so stale queued updates don't run against the new project.
    sessionDataRef.current = null;
    pendingUpdateRef.current = Promise.resolve();

    if (!projectId || !userId) {
      handleProjectExistsChange(false);
      setProjectChecked(true);
      return;
    }
    let cancelled = false;
    const check = async () => {
      try {
        const { getProject } = await import("./store/project");
        const existing = await getProject(projectId);

        if (!cancelled) {
          handleProjectExistsChange(!!existing);
          if (existing) {
            projectRef.current = existing;
            setProjectState(existing);
            setProject(projectId, existing);
          }
          setProjectChecked(true);
        }
      } catch {
        if (!cancelled) {
          handleProjectExistsChange(false);
          setProjectChecked(true);
        }
      }
    };
    check();
    return () => {
      cancelled = true;
    };
  }, [projectId, userId]);

  const handleCreateProject = useCallback(async () => {
    if (!projectId || !projectTitle || !userId) return;
    const project = await ensureProjectExists(projectId, projectTitle, userId);
    setProject(projectId, project);
    handleProjectExistsChange(true);
    navigate("projectDetail");
  }, [projectId, projectTitle, userId, setProject, navigate, handleProjectExistsChange]);

  if (!projectChecked) {
    return (
      <Box
        sx={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          height: "60vh",
        }}
      >
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Layout
      onNavigate={navigate}
      activeFile={activeFile}
      activeFileMode={activeFileMode}
      onActiveFileModeChange={setActiveFileMode}
      wrongAccount={
        !!projectRef.current?.userId &&
        !!userId &&
        projectRef.current.userId !== userId
      }
    >
      {currentView === "dashboard" && (
        <ErrorBoundary type="Dashboard">
          <Dashboard
            showConfirmation={!!projectId && !projectExists}
            documentTitle={projectTitle ?? undefined}
            onCreateProject={handleCreateProject}
            userId={userId}
          />
        </ErrorBoundary>
      )}
      {currentView === "projectDetail" && navProjectId && (
        <ErrorBoundary type="ProjectDetail">
          <ProjectDetail projectId={navProjectId} userId={userId} chapterId={chapterId} />
        </ErrorBoundary>
      )}
      {currentView === "leaderboard" && (
        <ErrorBoundary type="Leaderboard">
          <Leaderboard />
        </ErrorBoundary>
      )}
      {currentView === "preferences" && (
        <ErrorBoundary type="Preferences">
          <Preferences />
        </ErrorBoundary>
      )}
      {currentView === "subscription" && (
        <ErrorBoundary type="Subscription">
          <Subscription />
        </ErrorBoundary>
      )}
    </Layout>
  );
}

// ─── Root: handles auth gate ──────────────────────────────────────────────────

interface AppProps {
  obsidianApp: ObsidianApp;
  shadowRoot?: ShadowRoot;
}

export function App({ obsidianApp, shadowRoot }: AppProps) {
  const [userId, setUserId] = useState<string | null>(null);
  const [authReady, setAuthReady] = useState(false);
  const [showSetup, setShowSetup] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      if (firebaseUser) {
        setUserId(firebaseUser.uid);
        setShowSetup(false);
      } else {
        setUserId(null);
        setShowSetup(true);
      }
      setAuthReady(true);
    }, (err) => {
      console.error("[WH] onAuthStateChanged error:", err);
      setAuthReady(true);
    });
    return unsubscribe;
  }, []);

  // WHThemeProvider wraps EVERYTHING (including SetupWizard) so that all
  // content gets the Emotion cache scoped to the shadow root.
  return (
    <ErrorBoundary type="App">
      <WHThemeProvider shadowRoot={shadowRoot}>
        {!authReady && (
          <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", height: "100vh" }}>
            <CircularProgress />
          </Box>
        )}
        {authReady && (showSetup || !userId) && (
          <ErrorBoundary type="SetupWizard">
            <SetupWizard onComplete={() => setShowSetup(false)} />
          </ErrorBoundary>
        )}
        {authReady && userId && (
          <ProvidedApp userId={userId} obsidianApp={obsidianApp} />
        )}
      </WHThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
