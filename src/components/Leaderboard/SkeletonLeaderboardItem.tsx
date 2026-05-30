import { Box, Skeleton, Paper } from "@mui/material";

export default function SkeletonLeaderboardItem() {
  return (
    <Paper sx={{ mb: 1 }}>
      <Box display="flex" alignItems="center" p={1.5}>
        <Skeleton variant="rectangular" width={40} height={40} sx={{ mr: 2, borderRadius: 1 }} />
        <Box flex={1}>
          <Skeleton width="60%" height={24} />
          <Skeleton width="40%" height={20} />
        </Box>
        <Skeleton width={60} height={32} />
      </Box>
    </Paper>
  );
}
