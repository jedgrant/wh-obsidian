import {
  Box,
  Checkbox,
  FormControlLabel,
  FormGroup,
  Typography,
} from "@mui/material";
import { useGlobalData } from "../../context/GlobalDataProvider";
import React from "react";

interface EmailPreferencesProps {
  handlePreferenceChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
}

export default function EmailPreferences({ handlePreferenceChange }: EmailPreferencesProps) {
  const { user } = useGlobalData();
  
  if (!user) return null;
  
  return (
    <Box>
      <Typography variant="body1" mt={2} sx={{ fontWeight: "bold" }} id="email">
        Email notifications
      </Typography>
      <FormGroup>
        <FormControlLabel
          control={
            <Checkbox
              name={"marketingEmails"}
              value={user.preferences?.marketingEmails ?? true}
              checked={user.preferences?.marketingEmails ?? true}
              onChange={handlePreferenceChange}
              sx={{ py: 0.5 }}
            />
          }
          label={<Box>Promotional or onboarding</Box>}
        />
      </FormGroup>
      <FormGroup>
        <FormControlLabel
          control={
            <Checkbox
              name={"featureUpdates"}
              value={user.preferences?.featureUpdates ?? true}
              checked={user.preferences?.featureUpdates ?? true}
              onChange={handlePreferenceChange}
              sx={{ py: 0.5 }}
            />
          }
          label={<Box>Feature updates</Box>}
        />
      </FormGroup>
    </Box>
  );
}
