import React from "react";
import {
  Box,
  Typography,
  FormGroup,
  FormControlLabel,
  Checkbox,
} from "@mui/material";
import { useGlobalData } from "../../context/GlobalDataProvider";
import EmailPreferences from "./EmailPreferences";
import { Notifications } from "@mui/icons-material";

interface NotificationSettingsProps {
  handlePreferenceChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
}

export default function NotificationSettings({
  handlePreferenceChange,
}: NotificationSettingsProps) {
  const { user } = useGlobalData();

  if (!user) return null;

  return (
    <Box id="notifications" py={2}>
      <Box display="flex" alignItems="center" mb={2} gap={1}>
        <Typography variant="h5" fontWeight="bold">
          Notifications
        </Typography>
        <Notifications fontSize="small" />
      </Box>
      {/* Privacy & Visibility Settings */}
      <Typography variant="body1" mt={2} sx={{ fontWeight: "bold" }}>
        App alerts, notifications and messages
      </Typography>
      <FormGroup>
        <FormControlLabel
          control={
            <Checkbox
              name="messages"
              value={user.preferences?.messages ?? true}
              checked={user.preferences?.messages ?? true}
              onChange={handlePreferenceChange}
            />
          }
          label={<Box>Allow direct messages</Box>}
        />
      </FormGroup>

      {/* Email Preferences */}
      <EmailPreferences handlePreferenceChange={handlePreferenceChange} />
    </Box>
  );
}
