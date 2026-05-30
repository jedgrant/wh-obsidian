import React from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Typography,
  Stack,
  Box,
  IconButton,
  Button,
  Divider,
  Chip,
  Alert,
} from "@mui/material";
import { Close } from "@mui/icons-material";

interface LeaderboardMetricInfoDialogProps {
  open: boolean;
  onClose: () => void;
}

export default function LeaderboardMetricInfoDialog({
  open,
  onClose,
}: LeaderboardMetricInfoDialogProps) {
  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle
        sx={{
          fontWeight: "bold",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        Leaderboard metric info
        <IconButton size="small" aria-label="close" onClick={onClose}>
          <Close fontSize="small" />
        </IconButton>
      </DialogTitle>
      <DialogContent>
        <Stack spacing={2} sx={{ mt: 1 }}>
          <Box>
            <Box display="flex" alignItems="center" gap={0.5} mb={0.5}>
              <Typography variant="body1" fontWeight={"bold"}>
                Words typed
              </Typography>
              <Chip size="small" label="Default" />
            </Box>
            <Typography variant="body2">
              This metric counts all words that you've written inside the
              WritingHabit application. It excludes any pasted content, and
              ignores cut content which gives your credit for all content you
              type without putting you at a disadvantage on the leaderboards
              when you're revising.
            </Typography>
            <Alert severity="info" sx={{ mt: 1 }}>
              <strong>Note:</strong> All WritingHabit Challenges use the "words
              typed" metric for fair comparison.
            </Alert>
          </Box>
          <Divider />
          <Box>
            <Typography variant="body1" fontWeight={"bold"} mb={0.5}>
              Total words produced
            </Typography>
            <Typography variant="body2">
              This metric shows the total number of words added to any of your
              projects on a given day, including both typed and pasted content.
            </Typography>
            <Alert severity="warning" sx={{ mt: 1 }}>
              <strong>Important:</strong> When using this metric, you may see
              negative values due to editing or cutting content during the
              revision process. This is normal and reflects the net change in
              your word count.
            </Alert>
          </Box>
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button
          onClick={onClose}
          variant="contained"
          color="inherit"
          disableElevation
        >
          Close
        </Button>
      </DialogActions>
    </Dialog>
  );
}
