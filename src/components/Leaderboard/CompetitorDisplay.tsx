import React, { useEffect, useState } from "react";
import { Link, Typography } from "@mui/material";

interface CompetitorDisplayProps {
  competitor: {
    displayName: string;
    wordDiff: number;
    rank: number;
    position: "ahead" | "behind";
  } | null;
}

const CompetitorDisplay: React.FC<CompetitorDisplayProps> = ({ competitor }) => {
  if (!competitor) {
    return (
      <Typography variant="body2" color="text.secondary">
        No leaderboard competitor found
      </Typography>
    );
  }
  
  return (
    <Typography variant="body2" color="text.secondary">
      {competitor.wordDiff === 0 ? (
        `Currently tied with ${competitor.displayName}`
      ) : (
        <>
          <strong>#{competitor.rank}</strong> {competitor.displayName} is{" "}
          {competitor.wordDiff} words {competitor.position}
        </>
      )}
    </Typography>
  );
};

export default React.memo(CompetitorDisplay);
