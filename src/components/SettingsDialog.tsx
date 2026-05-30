import React, { useState } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Box,
  Typography,
} from "@mui/material";
import { Project } from "@writinghabit/models";
import { doc, updateDoc, Timestamp } from "firebase/firestore";
import { db } from "../config/firebase";

interface SettingsDialogProps {
  open: boolean;
  onClose: () => void;
  project: Project;
  onOptimisticUpdate?: (updates: Partial<Project>) => void;
}

export function SettingsDialog({
  open,
  onClose,
  project,
  onOptimisticUpdate,
}: SettingsDialogProps) {
  const [dailyGoal, setDailyGoal] = useState(project.dailyGoal || 1000);
  const [totalGoal, setTotalGoal] = useState(project.totalGoal || 80000);
  const [color, setColor] = useState(project.color || "#6366f1");
  const [deadline, setDeadline] = useState(
    project.completionDeadline
      ? new Date(
          typeof project.completionDeadline.toMillis === "function"
            ? project.completionDeadline.toMillis()
            : project.completionDeadline.seconds * 1000,
        )
          .toISOString()
          .split("T")[0]
      : "",
  );
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSave = async () => {
    setSaving(true);
    setError(null);

    try {
      const projectRef = doc(db, `projects/${project.id}`);
      const updates: any = {
        dailyGoal: Number(dailyGoal),
        totalGoal: Number(totalGoal),
        color: color,
      };

      if (deadline) {
        const deadlineDate = new Date(deadline);
        updates.completionDeadline = Timestamp.fromDate(deadlineDate);
      } else {
        updates.completionDeadline = null;
      }

      // Optimistically update local state before Firestore write
      onOptimisticUpdate?.(updates);

      await updateDoc(projectRef, updates);
      onClose();
    } catch (err) {
      console.error("Failed to update project settings:", err);
      setError("Failed to save settings. Please try again.");
      // Revert optimistic update on error
      onOptimisticUpdate?.(project);
    } finally {
      setSaving(false);
    }
  };

  const handleClose = () => {
    if (!saving) {
      // Reset to current project values
      setDailyGoal(project.dailyGoal || 1000);
      setTotalGoal(project.totalGoal || 80000);
      setColor(project.color || "#6366f1");
      setDeadline(
        project.completionDeadline
          ? new Date(
              typeof project.completionDeadline.toMillis === "function"
                ? project.completionDeadline.toMillis()
                : project.completionDeadline.seconds * 1000,
            )
              .toISOString()
              .split("T")[0]
          : "",
      );
      setError(null);
      onClose();
    }
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
      <DialogTitle>Doc settings</DialogTitle>
      <DialogContent>
        <Box sx={{ display: "flex", flexDirection: "column", gap: 2, pt: 1 }}>
          <TextField
            label="Daily goal (words)"
            type="number"
            value={dailyGoal}
            onChange={(e) => setDailyGoal(Number(e.target.value))}
            fullWidth
            disabled={saving}
            inputProps={{ min: 0, step: 100 }}
          />

          <TextField
            label="Total goal (words)"
            type="number"
            value={totalGoal}
            onChange={(e) => setTotalGoal(Number(e.target.value))}
            fullWidth
            disabled={saving}
            inputProps={{ min: 0, step: 1000 }}
          />

          <Box>
            <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
              <TextField
                label="Project Color"
                type="color"
                value={color}
                onChange={(e) => setColor(e.target.value)}
                disabled={saving}
                sx={{ width: 100 }}
                slotProps={{
                  htmlInput: { style: { height: 40, cursor: "pointer" } }
                }}
              />
              <TextField
                label="Hexcode"
                type="text"
                value={color}
                onChange={(e) => {
                  const val = e.target.value;
                  if (/^#[0-9A-Fa-f]{0,6}$/.test(val) || val === "") {
                    setColor(val);
                  }
                }}
                disabled={saving}
                placeholder="#6366f1"
                sx={{ flex: 1 }}
              />
            </Box>
          </Box>

          <Box>
            <TextField
              label="Completion deadline"
              type="date"
              value={deadline}
              onChange={(e) => setDeadline(e.target.value)}
              fullWidth
              disabled={saving}
              slotProps={{
                inputLabel: { shrink: true },
                htmlInput: { placeholder: "DD/MM/YYYY" }
              }}
            />
            <Typography fontSize={".7rem"} lineHeight={1} pt={0.5} color="textSecondary">
              Fill to get words needed per day to reach your goal.
            </Typography>
          </Box>
          {error && (
            <Typography color="error" variant="body2">
              {error}
            </Typography>
          )}
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={handleClose} disabled={saving}>
          Cancel
        </Button>
        <Button onClick={handleSave} variant="contained" disabled={saving}>
          {saving ? "Saving..." : "Save"}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
