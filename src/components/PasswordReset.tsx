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
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import { sendPasswordReset } from "../lib/auth";

interface PasswordResetProps {
  onBack: () => void;
}

export function PasswordReset({ onBack }: PasswordResetProps) {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const emailRef = useRef<HTMLInputElement>(null);

  const validateEmail = (v: string) => v.includes("@") && v.includes(".");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSuccess(false);

    if (!validateEmail(email)) {
      setError("Please enter a valid email address");
      emailRef.current?.focus();
      return;
    }

    setLoading(true);
    try {
      const result = await sendPasswordReset(email);
      if ("error" in result) {
        setError(result.error);
      } else {
        setSuccess(true);
        setEmail("");
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <Box>
      <Box sx={{ display: "flex", alignItems: "center", mb: 2 }}>
        <Button startIcon={<ArrowBackIcon />} onClick={onBack} size="small">
          Back
        </Button>
      </Box>

      <Typography variant="body1" fontWeight="bold" gutterBottom>
        Reset Password
      </Typography>

      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
        Enter your email address and we'll send you a link to reset your
        password.
      </Typography>

      {success ? (
        <Alert severity="success" sx={{ mb: 2 }}>
          Password reset email sent! Check your inbox (and spam folder).
        </Alert>
      ) : (
        <Box component="form" onSubmit={handleSubmit}>
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
            autoFocus
          />

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
          >
            {loading ? "Sending..." : "Send Reset Link"}
          </Button>
        </Box>
      )}

      {success && (
        <Box sx={{ textAlign: "center", mt: 2 }}>
          <Link
            component="button"
            type="button"
            variant="body2"
            onClick={onBack}
            sx={{ cursor: "pointer" }}
          >
            Return to sign in
          </Link>
        </Box>
      )}
    </Box>
  );
}
