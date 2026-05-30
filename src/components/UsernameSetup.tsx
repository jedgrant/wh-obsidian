import { useState, useRef, useEffect } from "react";
import {
  Box,
  Button,
  TextField,
  Typography,
  Alert,
  CircularProgress,
  Stack,
} from "@mui/material";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import type { User } from "@writinghabit/models";
import { getUserByUserName, updateUserProp } from "../lib/users";

interface UsernameSetupProps {
  user: User;
  onComplete: (updatedUser: User) => void;
}

export function UsernameSetup({ user, onComplete }: UsernameSetupProps) {
  const [userName, setUserName] = useState(user.userName || "");
  const [displayName, setDisplayName] = useState(user.displayName || "");
  const [userNameError, setUserNameError] = useState("");
  const [displayNameError, setDisplayNameError] = useState("");
  const [available, setAvailable] = useState(false);
  const [checking, setChecking] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const userNameRef = useRef<HTMLInputElement>(null);
  const displayNameRef = useRef<HTMLInputElement>(null);
  const checkTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (checkTimeoutRef.current) clearTimeout(checkTimeoutRef.current);
    };
  }, []);

  const handleUserNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const cleanName = e.target.value.replace(/ /g, "_").toLowerCase();
    setUserName(cleanName);
    setUserNameError("");
    setAvailable(false);

    if (checkTimeoutRef.current) clearTimeout(checkTimeoutRef.current);

    if (cleanName.length >= 3) {
      setChecking(true);
      checkTimeoutRef.current = setTimeout(async () => {
        const isAvailable = await checkUserNameAvailability(cleanName);
        setAvailable(isAvailable);
        setChecking(false);
      }, 700);
    } else {
      setChecking(false);
    }
  };

  const handleDisplayNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setDisplayName(e.target.value);
    setDisplayNameError("");
  };

  const checkUserNameAvailability = async (name: string): Promise<boolean> => {
    try {
      const existing = await getUserByUserName(name);
      if (existing && user.id !== existing.id) {
        setUserNameError("Username unavailable");
        return false;
      }
      return true;
    } catch (err) {
      console.error("Error checking username:", err);
      return false;
    }
  };

  const validateForm = (): boolean => {
    let isValid = true;
    if (!userName || userName.length < 3) {
      setUserNameError(
        userName.length === 0
          ? "A username is required"
          : "Usernames must be at least 3 characters"
      );
      isValid = false;
    }
    if (!displayName || displayName.trim().length === 0) {
      setDisplayNameError("A display name is required");
      isValid = false;
    }
    return isValid;
  };

  const handleSave = async () => {
    setError(null);
    if (!validateForm()) return;

    const isAvailable = await checkUserNameAvailability(userName);
    if (!isAvailable) {
      setUserNameError("Username unavailable");
      return;
    }

    setSaving(true);
    try {
      const success = await updateUserProp(user.id, {
        userName,
        displayName: displayName.trim(),
      });
      if (success) {
        onComplete({ ...user, userName, displayName: displayName.trim() });
      } else {
        setError("Failed to save username. Please try again.");
      }
    } catch (err) {
      console.error("Error saving username:", err);
      setError("An unexpected error occurred. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Box>
      <Typography variant="h6" gutterBottom fontWeight="bold" textAlign="center">
        Complete Your Profile
      </Typography>

      <Typography
        variant="body2"
        color="text.secondary"
        mb={3}
        textAlign="center"
      >
        Choose your display name and username for leaderboards
      </Typography>

      <Stack spacing={2}>
        <TextField
          fullWidth
          size="small"
          name="displayName"
          label="Name (what you go by)"
          value={displayName}
          onChange={handleDisplayNameChange}
          inputRef={displayNameRef}
          error={!!displayNameError}
          helperText={displayNameError}
          required
          slotProps={{ htmlInput: { maxLength: 22 } }}
          disabled={saving}
        />

        <Box display="flex" gap={1} alignItems="flex-start">
          <TextField
            fullWidth
            size="small"
            name="userName"
            label="Username"
            value={userName}
            onChange={handleUserNameChange}
            inputRef={userNameRef}
            error={!!userNameError}
            helperText={
              userNameError ||
              "Choose carefully. Your username is not easily editable later"
            }
            required
            slotProps={{ htmlInput: { maxLength: 22 } }}
            disabled={!!user.userName || saving}
          />
          <Box sx={{ pt: 1 }}>
            {checking ? (
              <CircularProgress size={20} />
            ) : available && userName.length >= 3 ? (
              <CheckCircleIcon color="success" />
            ) : null}
          </Box>
        </Box>

        {error && <Alert severity="error">{error}</Alert>}

        <Button
          variant="contained"
          fullWidth
          onClick={handleSave}
          disabled={saving || checking}
          startIcon={saving ? <CircularProgress size={20} /> : undefined}
        >
          {saving ? "Saving..." : "Save Profile"}
        </Button>
      </Stack>
    </Box>
  );
}
