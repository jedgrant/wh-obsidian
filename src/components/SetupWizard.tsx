/**
 * SetupWizard — Obsidian Plugin
 *
 * Based on apps/word-addin/src/components/SetupWizard.tsx.
 * Adds a "Sign in with Google" button that calls signInWithPopup
 * (works in Obsidian's Electron renderer).
 *
 * Auth flow:
 *  Step 0 — sign in (Google OR email/password)
 *  Step 1 — username setup (if no userName yet)
 */

import { useState, useEffect } from "react";
import {
  Box,
  Button,
  CircularProgress,
  Divider,
  Stack,
  Typography,
  Alert,
} from "@mui/material";
import ErrorIcon from "@mui/icons-material/Error";
import { logoDataUri } from "../assets/logo";
import { EmailPasswordAuth } from "./EmailPasswordAuth";
import { PasswordReset } from "./PasswordReset";
import { UsernameSetup } from "./UsernameSetup";
import { auth, getFirestoreUser } from "../lib/auth";
import { onAuthStateChanged } from "firebase/auth";
import type { User } from "@writinghabit/models";

const WEB_APP_URL =
  process.env.VITE_ENV === "local"
    ? "http://localhost:3000"
    : process.env.VITE_ENV === "staging"
    ? process.env.VITE_STAGING_URL || "https://writinghabit-staging.web.app"
    : "https://writinghabit.app";

const OBSIDIAN_AUTH_URL = `${WEB_APP_URL}/obsidian-auth`;

interface SetupWizardProps {
  onComplete: () => void;
}

export function SetupWizard({ onComplete }: SetupWizardProps) {
  const [activeStep, setActiveStep] = useState(0);
  const [authChecking, setAuthChecking] = useState(true);
  const [showPasswordReset, setShowPasswordReset] = useState(false);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [needsUsername, setNeedsUsername] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [googleWaiting, setGoogleWaiting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        const user = await getFirestoreUser(firebaseUser.uid);
        setCurrentUser(user);
        setAuthChecking(false);

        if (!user?.userName || user.userName.trim() === "") {
          setNeedsUsername(true);
          setActiveStep(1);
        } else {
          onComplete();
        }
      } else {
        setCurrentUser(null);
        setAuthChecking(false);
      }
    });

    return unsubscribe;
  }, [onComplete]);

  function handleGoogleSignIn() {
    setError(null);
    // Open the web app's auth relay in the system default browser.
    // The relay page signs the user in with Google and redirects back to
    // obsidian://writing-habit-auth?token=... which is caught by main.ts.
    window.open(OBSIDIAN_AUTH_URL, "_blank");
    setGoogleWaiting(true);
    setGoogleLoading(false);
  }

  function handleUsernameSetupComplete(updatedUser: User) {
    setCurrentUser(updatedUser);
    setNeedsUsername(false);
    onComplete();
  }

  return (
    <Box maxWidth={300} sx={{ mx: "auto", p: 3 }}>
      <Stack alignItems="center" sx={{ mb: 3 }}>
        <img src={logoDataUri} alt="logo" height="64px" width="64px" />
        <Box
          sx={{
            pt: 1,
            fontSize: "1.5rem",
            fontFamily: "Raleway, Figtree, Arial, sans-serif",
          }}
        >
          <Box component="span" sx={{ fontWeight: "bold" }}>
            Writing
          </Box>
          Habit
        </Box>
        <Typography variant="body2" color="text.secondary" align="center" mt={-0.5}>
          Track your writing progress
        </Typography>
      </Stack>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }} icon={<ErrorIcon />}>
          {error}
        </Alert>
      )}

      {/* Step 0: Sign In */}
      {activeStep === 0 && (
        <Box>
          {authChecking ? (
            <Box sx={{ py: 4, textAlign: "center" }}>
              <CircularProgress size={40} />
              <Typography variant="body2" sx={{ mt: 2 }}>
                Checking authentication...
              </Typography>
            </Box>
          ) : showPasswordReset ? (
            <PasswordReset onBack={() => setShowPasswordReset(false)} />
          ) : (
            <Stack spacing={2}>
              {/* Google sign-in */}
              {googleWaiting ? (
                <Box sx={{ textAlign: "center", py: 1 }}>
                  <CircularProgress size={20} sx={{ mb: 1 }} />
                  <Typography variant="body2" color="text.secondary">
                    Waiting for sign-in in your browser…
                  </Typography>
                  <Button
                    size="small"
                    sx={{ mt: 1 }}
                    onClick={() => { setGoogleWaiting(false); setError(null); }}
                  >
                    Cancel
                  </Button>
                </Box>
              ) : (
                <Button
                variant="outlined"
                fullWidth
                onClick={handleGoogleSignIn}
                disabled={googleLoading}
                startIcon={
                  googleLoading ? (
                    <CircularProgress size={18} />
                  ) : (
                    <GoogleIcon />
                  )
                }
              >
                {googleLoading ? "Opening browser…" : "Sign in with Google"}
              </Button>
              )}

              <Divider>
                <Typography variant="caption" color="text.secondary">
                  or
                </Typography>
              </Divider>

              <EmailPasswordAuth
                onSuccess={() => {
                  /* onAuthStateChanged advances the flow */
                }}
                onPasswordReset={() => {
                  setShowPasswordReset(true);
                  setError(null);
                }}
              />
            </Stack>
          )}
        </Box>
      )}

      {/* Step 1: Username Setup */}
      {activeStep === 1 && needsUsername && currentUser && (
        <UsernameSetup user={currentUser} onComplete={handleUsernameSetupComplete} />
      )}
    </Box>
  );
}

/** Inline Google "G" logo (no external dependency) */
function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <path
        d="M17.64 9.205c0-.639-.057-1.252-.164-1.841H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908C16.456 14.013 17.64 11.8 17.64 9.205z"
        fill="#4285F4"
      />
      <path
        d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18z"
        fill="#34A853"
      />
      <path
        d="M3.964 10.71A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.042l3.007-2.332z"
        fill="#FBBC05"
      />
      <path
        d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58z"
        fill="#EA4335"
      />
    </svg>
  );
}
