import React from "react";
import {
  Box,
  Typography,
  FormGroup,
  FormControlLabel,
  Checkbox,
} from "@mui/material";
import { useGlobalData } from "../../context/GlobalDataProvider";
import ThemeSelection from "./ThemeSelection";
import { Draw } from "@mui/icons-material";

interface DisplaySettingsProps {
  handleSave: (data: any) => void;
  handlePreferenceChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
  isExtension?: boolean;
}

export default function DisplaySettings({
  handleSave,
  handlePreferenceChange,
  isExtension = false,
}: DisplaySettingsProps) {
  const { user } = useGlobalData();

  if (!user) return null;

  return (
    <Box id="display" py={2}>
      <Box display="flex" alignItems="center" mb={2} gap={1}>
        <Typography variant="h5" fontWeight="bold">
          Display & theme
        </Typography>
        <Draw fontSize="small" />
      </Box>
      <ThemeSelection
        handleSave={handleSave}
        handlePreferenceChange={handlePreferenceChange}
      />

      {/* Privacy & Visibility Settings */}
      <Typography variant="body1" mt={2} sx={{ fontWeight: "bold" }}>
        Privacy & visibility
      </Typography>
      {!isExtension && (
        <FormGroup>
          <FormControlLabel
            control={
              <Checkbox
                name="hideExploreWidget"
                value={user.preferences?.hideExploreWidget ?? false}
                checked={user.preferences?.hideExploreWidget ?? false}
                onChange={handlePreferenceChange}
                sx={{ py: 0.5 }}
              />
            }
            label={<Box>Hide Feature Explorer widget (on dashboard)</Box>}
          />
        </FormGroup>
      )}
      <FormGroup>
        <FormControlLabel
          control={
            <Checkbox
              name="publicProfile"
              value={user.preferences?.publicProfile ?? true}
              checked={user.preferences?.publicProfile ?? true}
              onChange={handlePreferenceChange}
              sx={{ py: 0.5 }}
            />
          }
          label={<Box>Public profile</Box>}
        />
      </FormGroup>
    </Box>
  );
}
