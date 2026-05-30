import { useState, useRef } from "react";
import {
  Box,
  Button,
  TextField,
  Typography,
  Alert,
  CircularProgress,
  Link,
} from "@mui/material";
import { signInWithEmail, createAccountWithEmail } from "../lib/auth";

interface EmailPasswordAuthProps {
  onSuccess: () => void;
  onPasswordReset: () => void;
}

export function EmailPasswordAuth({
  onSuccess,
  onPasswordReset,
}: EmailPasswordAuthProps) {
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const emailRef = useRef<HTMLInputElement>(null);
  const passwordRef = useRef<HTMLInputElement>(null);
  const confirmPasswordRef = useRef<HTMLInputElement>(null);
  const displayNameRef = useRef<HTMLInputElement>(null);

  const validateEmail = (v: string) => v.includes("@") && v.includes(".");
  const validatePassword = (v: string) => v.length >= 6;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!validateEmail(email)) {
      setError("Please enter a valid email address");
      emailRef.current?.focus();
      return;
    }
    if (!validatePassword(password)) {
      setError("Password must be at least 6 characters long");
      passwordRef.current?.focus();
      return;
    }
    if (mode === "signup") {
      if (password !== confirmPassword) {
        setError("Passwords do not match");
        confirmPasswordRef.current?.focus();
        return;
      }
      if (!displayName.trim()) {
        setError("Please enter your name");
        displayNameRef.current?.focus();
        return;
      }
    }

    setLoading(true);
    try {
      const result =
        mode === "signin"
          ? await signInWithEmail(email, password)
          : await createAccountWithEmail(email, password, displayName);

      if ("error" in result) {
        setError(result.error);
      } else {
        onSuccess();
      }
    } finally {
      setLoading(false);
    }
  }

  function toggleMode() {
    setMode(mode === "signin" ? "signup" : "signin");
    setError(null);
    setPassword("");
    setConfirmPassword("");
    setDisplayName("");
  }

  return (
    <Box>
      <Box component="form" onSubmit={handleSubmit}>
        {mode === "signup" && (
          <TextField
            fullWidth
            label="Your Name"
            name="displayName"
            type="text"
            autoComplete="name"
            size="small"
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            inputRef={displayNameRef}
            sx={{ mb: 1.5 }}
            disabled={loading}
          />
        )}

        <TextField
          required
          fullWidth
          label="Email Address"
          name="email"
          type="email"
          autoComplete="email"
          size="small"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          inputRef={emailRef}
          sx={{ mb: 1.5 }}
          disabled={loading}
        />

        <TextField
          required
          fullWidth
          label="Password"
          name="password"
          type="password"
          autoComplete={mode === "signin" ? "current-password" : "new-password"}
          size="small"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          inputRef={passwordRef}
          sx={{ mb: mode === "signup" ? 1.5 : 1 }}
          disabled={loading}
          helperText={mode === "signup" ? "At least 6 characters" : undefined}
        />

        {mode === "signup" && (
          <TextField
            required
            fullWidth
            label="Confirm Password"
            name="confirmPassword"
            type="password"
            autoComplete="new-password"
            size="small"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            inputRef={confirmPasswordRef}
            sx={{ mb: 1 }}
            disabled={loading}
          />
        )}

        {error && (
          <Alert severity="error" sx={{ mb: 1.5 }}>
            {error}
          </Alert>
        )}

        <Button
          type="submit"
          fullWidth
          variant="contained"
          size="large"
          disabled={loading}
          startIcon={loading ? <CircularProgress size={20} /> : undefined}
          sx={{ mb: 1.5 }}
        >
          {loading
            ? mode === "signin"
              ? "Signing in..."
              : "Creating account..."
            : mode === "signin"
              ? "Sign In"
              : "Create Account"}
        </Button>
      </Box>

      {mode === "signin" && (
        <Box sx={{ textAlign: "center", mb: 1 }}>
          <Link
            component="button"
            type="button"
            variant="body2"
            onClick={onPasswordReset}
            sx={{ cursor: "pointer" }}
          >
            Forgot password?
          </Link>
        </Box>
      )}

      <Typography variant="body2" align="center" color="text.secondary">
        {mode === "signin" ? "Don't have an account?" : "Already have an account?"}{" "}
        <Link
          component="button"
          type="button"
          variant="body2"
          onClick={toggleMode}
          sx={{ cursor: "pointer" }}
        >
          {mode === "signin" ? "Sign up" : "Sign in"}
        </Link>
      </Typography>
    </Box>
  );
}
