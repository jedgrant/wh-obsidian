/**
 * ThemeProvider — Obsidian Plugin
 *
 * Detects Obsidian's active theme (theme-dark / theme-light class on <body>)
 * and applies the matching MUI palette. Falls back to prefers-color-scheme
 * if neither class is present.
 *
 * Reacts to live theme changes via MutationObserver so toggling Obsidian's
 * appearance setting updates the plugin UI immediately.
 *
 * Renders inside a Shadow DOM (passed via shadowRoot prop) and creates an
 * Emotion cache that targets the shadow root so MUI styles are injected inside
 * the shadow DOM — fully isolated from Obsidian's global CSS.
 */

import React, { useEffect, useMemo, useState } from "react";
import CssBaseline from "@mui/material/CssBaseline";
import { ThemeProvider, createTheme } from "@mui/material";
import { CacheProvider } from "@emotion/react";
import createCache from "@emotion/cache";
import { buildPresetTheme, setTypography } from "@writinghabit/static-data";

const FIGTREE = "'Figtree', sans-serif";

function buildTheme(mode: "light" | "dark") {
  const base = buildPresetTheme("default", mode)!;
  const typography = setTypography(base);
  return createTheme(base, {
    typography: {
      ...typography,
      fontFamily: FIGTREE,
    },
  });
}

/** Read the current Obsidian theme from document.body classList. */
function getObsidianMode(): "light" | "dark" {
  if (typeof document === "undefined") return "light";
  if (document.body.classList.contains("theme-dark")) return "dark";
  if (document.body.classList.contains("theme-light")) return "light";
  return window.matchMedia?.("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

interface WHThemeProviderProps {
  children: React.ReactNode;
  shadowRoot?: ShadowRoot;
}

export function WHThemeProvider({ children, shadowRoot }: WHThemeProviderProps) {
  const [mode, setMode] = useState<"light" | "dark">(getObsidianMode);

  useEffect(() => {
    const observer = new MutationObserver(() => setMode(getObsidianMode()));
    observer.observe(document.body, { attributes: true, attributeFilter: ["class"] });

    const mq = window.matchMedia?.("(prefers-color-scheme: dark)");
    const mqHandler = () => setMode(getObsidianMode());
    mq?.addEventListener("change", mqHandler);

    return () => {
      observer.disconnect();
      mq?.removeEventListener("change", mqHandler);
    };
  }, []);

  // disablePortal makes MUI modals/popovers/poppers render in-place in the
  // React tree instead of portaling to document.body. Combined with
  // transform:translateZ(0) on the shadow root mount point, position:fixed
  // children anchor to the sidebar rather than the viewport, so MUI backdrops
  // can't escape the shadow DOM or cover Obsidian's UI.
  const theme = useMemo(() => {
    const base = buildTheme(mode);
    return createTheme(base, {
      components: {
        MuiModal: { defaultProps: { disablePortal: true } },
        MuiPopover: { defaultProps: { disablePortal: true } },
        MuiPopper: { defaultProps: { disablePortal: true } },
      },
    });
  }, [mode]);

  // When rendering inside a Shadow DOM, inject Emotion styles into the shadow
  // root so they are scoped and cannot be overridden by Obsidian's global CSS.
  const emotionCache = useMemo(
    () =>
      createCache({
        key: "wh",
        container: (shadowRoot as unknown as HTMLElement | undefined) ?? document.head,
        prepend: true,
      }),
    [shadowRoot]
  );

  return (
    <CacheProvider value={emotionCache}>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        {children}
      </ThemeProvider>
    </CacheProvider>
  );
}
