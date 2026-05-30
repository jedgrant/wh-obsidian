/**
 * Preferences Page for Word Add-in
 *
 * Adapted from chrome-ext:
 * - Replaced chrome.runtime.sendMessage with direct updateUserProp calls
 */

import React from "react";
import { Box, Stack, Divider, Typography, Fade } from "@mui/material";
import { useGlobalData } from "../context/GlobalDataProvider";
import DisplaySettings from "../components/Settings/DisplaySettings";
import LeaderboardSettings from "../components/Settings/LeaderboardSettings";
import NotificationSettings from "../components/Settings/NotificationSettings";
import { updateUserProp } from "../lib/users";

function useDebounce<T extends (...args: any[]) => any>(
  callback: T,
  delay: number,
): T {
  const timeoutRef = React.useRef<NodeJS.Timeout | null>(null);
  const cancelledRef = React.useRef(false);

  React.useEffect(() => {
    cancelledRef.current = false;
    return () => {
      cancelledRef.current = true;
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, []);

  return React.useCallback(
    ((...args: Parameters<T>) => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      timeoutRef.current = setTimeout(() => {
        if (!cancelledRef.current) callback(...args);
      }, delay);
    }) as T,
    [callback, delay],
  );
}

export function Preferences() {
  const { user } = useGlobalData();

  const handleSave = useDebounce(async (data: any) => {
    if (!user?.id) return;
    try {
      await updateUserProp(user.id, data);
    } catch (err) {
      console.error("[Preferences] Failed to save:", err);
    }
  }, 500);

  const handlePreferenceChange = async (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    if (!user) return;
    const name = event.target.name;
    const value =
      event.target.type === "checkbox"
        ? event.target.checked
        : event.target.value;

    await handleSave({
      preferences: { ...user.preferences, [name]: value },
    });
  };

  if (!user) {
    return (
      <Box p={2}>
        <Typography>Loading preferences...</Typography>
      </Box>
    );
  }

  return (
    <Fade in timeout={700}>
      <Box>
        <Typography variant="h4" mb={3}>
          Preferences
        </Typography>
        <Stack gap={3}>
          <DisplaySettings
            handleSave={handleSave}
            handlePreferenceChange={handlePreferenceChange}
            isExtension={true}
          />
          <Divider />
          <LeaderboardSettings
            handlePreferenceChange={handlePreferenceChange}
          />
          {/* <Divider />
          <NotificationSettings
            handlePreferenceChange={handlePreferenceChange}
          /> */}
        </Stack>
      </Box>
    </Fade>
  );
}
