/**
 * NavigationProvider — Obsidian Plugin
 * Direct copy of apps/word-addin/src/context/NavigationProvider.tsx.
 */

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useRef,
  useMemo,
  useCallback,
  type ReactNode,
} from "react";

export type ViewName =
  | "dashboard"
  | "projectDetail"
  | "leaderboard"
  | "preferences"
  | "subscription";

interface NavigationContextValue {
  currentView: ViewName;
  navigate: (view: ViewName) => void;
  navigateToProject: (projectId: string) => void;
  projectId: string | null;
  projectTitle: string | null;
  hasActiveProject: boolean;
}

const NavigationContext = createContext<NavigationContextValue | null>(null);

export function useNavigation() {
  const ctx = useContext(NavigationContext);
  if (!ctx) throw new Error("useNavigation must be used within NavigationProvider");
  return ctx;
}

interface NavigationProviderProps {
  children: ReactNode;
  projectId: string | null;
  projectTitle: string | null;
  projectExists: boolean;
}

export function NavigationProvider({
  children,
  projectId,
  projectTitle,
  projectExists,
}: NavigationProviderProps) {
  const [currentView, setCurrentView] = useState<ViewName>("dashboard");
  const manualNavigationRef = useRef(false);

  useEffect(() => {
    if (manualNavigationRef.current) return;
    if (projectExists && currentView !== "projectDetail") {
      setCurrentView("projectDetail");
    } else if (!projectExists && currentView === "projectDetail") {
      setCurrentView("dashboard");
    }
  }, [projectExists, currentView]);

  useEffect(() => {
    manualNavigationRef.current = false;
  }, [projectId]);

  const navigate = useCallback((view: ViewName) => {
    manualNavigationRef.current = true;
    setCurrentView(view);
  }, []);

  const navigateToProject = useCallback((_projectId: string) => {
    manualNavigationRef.current = true;
    setCurrentView("projectDetail");
  }, []);

  const value = useMemo<NavigationContextValue>(
    () => ({
      currentView,
      navigate,
      navigateToProject,
      projectId,
      projectTitle,
      hasActiveProject: projectExists,
    }),
    [currentView, navigate, navigateToProject, projectId, projectTitle, projectExists]
  );

  return (
    <NavigationContext.Provider value={value}>{children}</NavigationContext.Provider>
  );
}
