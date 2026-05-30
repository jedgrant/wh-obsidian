/**
 * Create Sprint Dialog - Entry point for starting/joining sprints
 */

import React, { useState } from "react";
import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
} from "@mui/material";
import StartSprint from "./StartSprint";
import CreateSprintSettingsDialog from "./CreateSprintSettingsDialog";

export default function CreateSprintDialog() {
  const [open, setOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);

  const handleClose = () => {
    setOpen(false);
  };

  const handleOpen = () => {
    setOpen(true);
  };

  const handleCreateStart = () => {
    setOpen(false);
    setSettingsOpen(true);
  };

  const handleSettingsClose = () => {
    setSettingsOpen(false);
  };

  return (
    <>
      <Button onClick={handleOpen}>Start/Join</Button>
      <Dialog
        open={open}
        onClose={handleClose}
        aria-labelledby="alert-dialog-title"
        aria-describedby="alert-dialog-description"
      >
        <DialogTitle id="alert-dialog-title">Create or join a sprint</DialogTitle>
        <DialogContent>
          <StartSprint handleClose={handleClose} onCreateStart={handleCreateStart} />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClose}>Close</Button>
        </DialogActions>
      </Dialog>
      <CreateSprintSettingsDialog
        open={settingsOpen}
        onClose={handleSettingsClose}
      />
    </>
  );
}
