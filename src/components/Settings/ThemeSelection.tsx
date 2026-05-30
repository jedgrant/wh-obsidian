import {
  Alert,
  Box,
  Chip,
  Stack,
  Typography,
} from "@mui/material";
import { useGlobalData } from "../../context/GlobalDataProvider";
import React from "react";
import { FALLBACK_COLORS } from "@writinghabit/static-data";
import { ThemePresetPicker } from "@writinghabit/ui";

interface Props {
  handleSave: (data: any) => void;
  handlePreferenceChange?: (event: React.ChangeEvent<HTMLInputElement>) => void;
}

const ThemeSelection: React.FC<Props> = ({ handleSave }) => {
  const { user } = useGlobalData();

  if (!user) return null;

  const colors = user.preferences?.colors || FALLBACK_COLORS;
  const activePreset = user.preferences?.themePreset ?? null;
  const useCustomColors = !!user.preferences?.customColors;

  const handlePresetChange = async (presetId: string | null) => {
    await handleSave({
      preferences: { ...user.preferences, themePreset: presetId },
    });
  };

  const handleDarkModeChange = async (value: string) => {
    await handleSave({
      preferences: { ...user.preferences, darkMode: value },
    });
  };

  const handleAppearanceModeChange = async (isCustom: boolean) => {
    await handleSave({
      preferences: { ...user.preferences, customColors: isCustom },
    });
  };

  const handleColorChange = async (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    await handleSave({
      preferences: {
        ...user.preferences,
        colors: {
          ...(user.preferences?.colors || {}),
          [event.target.name]: event.target.value,
        },
      },
    });
  };

  function isColorLight(hex: string): boolean {
    hex = hex.replace(/^#/, "");
    const r = parseInt(hex.substring(0, 2), 16);
    const g = parseInt(hex.substring(2, 4), 16);
    const b = parseInt(hex.substring(4, 6), 16);
    return (299 * r + 587 * g + 114 * b) / 1000 > 70;
  }

  const goodTextBackgroundContract = (() => {
    const backgroundIsLight = isColorLight(colors.background);
    if (backgroundIsLight && user.preferences?.darkMode === "light")
      return true;
    if (!backgroundIsLight && user.preferences?.darkMode === "dark")
      return true;
    return false;
  })();

  return (
    <ThemePresetPicker
      activePreset={activePreset}
      onPresetChange={handlePresetChange}
      darkMode={user.preferences?.darkMode || "none"}
      onDarkModeChange={handleDarkModeChange}
      useCustomColors={useCustomColors}
      onAppearanceModeChange={handleAppearanceModeChange}
      customColorsContent={
        <Box>
            <Box
              p={2}
              display="flex"
              gap={3}
              flexWrap="wrap"
              sx={{ bgcolor: "background.tertiary" }}
            >
              <Stack gap={1}>
                <Typography variant="body2" sx={{ fontWeight: "bold" }}>
                  Website colors
                </Typography>
                <Box display="flex" gap={1} alignItems="center">
                  <input
                    name="background"
                    type="color"
                    value={colors.background || "#000000"}
                    onChange={handleColorChange}
                  />
                  <Typography variant="body2">Background</Typography>
                </Box>
                <Box display="flex" gap={1} alignItems="center">
                  <input
                    name="text"
                    type="color"
                    value={colors.text || "#000000"}
                    onChange={handleColorChange}
                  />
                  <Typography variant="body2">Text</Typography>
                </Box>
                <Box display="flex" gap={1} alignItems="center">
                  <input
                    name="primary"
                    type="color"
                    value={colors.primary || "#000000"}
                    onChange={handleColorChange}
                  />
                  <Typography variant="body2">Primary</Typography>
                </Box>
                <Box display="flex" gap={1} alignItems="center">
                  <input
                    name="secondary"
                    type="color"
                    value={colors.secondary || "#000000"}
                    onChange={handleColorChange}
                  />
                  <Typography variant="body2">Accent</Typography>
                </Box>
              </Stack>
              <Stack gap={1}>
                <Typography variant="body2" sx={{ fontWeight: "bold" }}>
                  Tag colors
                </Typography>
                <Box display="flex" gap={1} alignItems="center">
                  <input
                    name="characters"
                    type="color"
                    value={colors.characters}
                    onChange={handleColorChange}
                  />
                  <Chip color="character" size="small" label="Characters" />
                </Box>
                <Box display="flex" gap={1} alignItems="center">
                  <input
                    name="emotions"
                    type="color"
                    value={colors.emotions}
                    onChange={handleColorChange}
                  />
                  <Chip color="emotion" size="small" label="Emotions" />
                </Box>
                <Box display="flex" gap={1} alignItems="center">
                  <input
                    name="settings"
                    type="color"
                    value={colors.settings}
                    onChange={handleColorChange}
                  />
                  <Chip color="setting" size="small" label="Settings" />
                </Box>
                <Box display="flex" gap={1} alignItems="top">
                  <input
                    name="structure"
                    type="color"
                    value={colors.structure}
                    onChange={handleColorChange}
                  />
                  <Chip color="structural" size="small" label="Structural" />
                </Box>
                <Box display="flex" gap={1} alignItems="center">
                  <input
                    name="pov"
                    type="color"
                    value={colors.pov}
                    onChange={handleColorChange}
                  />
                  <Chip color="pov" size="small" label="POV" />
                </Box>
              </Stack>
              <Box>
                <Typography variant="body2" color="text.secondary">
                  <strong>Note</strong>: Choosing light or dark mode will have
                  an effect. If you're using a dark background, select the{" "}
                  <strong>Dark</strong> theme when customizing your colors.
                </Typography>
                {!goodTextBackgroundContract && (
                  <Alert severity="warning" sx={{ mt: 1 }}>
                    Your background color and color theme selection may need
                    adjusted.
                  </Alert>
                )}
              </Box>
            </Box>
        </Box>
      }
    />
  );
};

export default ThemeSelection;
