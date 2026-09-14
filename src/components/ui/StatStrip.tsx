import { Box, Typography } from "@mui/material";
import type { ReactNode } from "react";

type Stat = { label: string; value: ReactNode; color?: string };

type StatStripProps = {
  stats: Stat[];
};

/** Borderless stat row — replaces nested Card grids for summary metrics. */
export const StatStrip = ({ stats }: StatStripProps) => (
  <Box sx={{ display: "flex", gap: 0, overflow: "auto" }}>
    {stats.map((stat, i) => (
      <Box
        key={stat.label}
        sx={{
          flex: 1,
          minWidth: 80,
          px: 1.5,
          py: 1,
          borderRight: i < stats.length - 1 ? 1 : 0,
          borderColor: "divider",
          textAlign: "center",
        }}
      >
        <Typography variant="caption" color="text.secondary" sx={{ fontSize: "0.65rem", display: "block", mb: 0.25 }}>
          {stat.label}
        </Typography>
        <Typography variant="body2" sx={{ fontWeight: 700, fontSize: "0.9rem", color: stat.color || "text.primary" }}>
          {stat.value}
        </Typography>
      </Box>
    ))}
  </Box>
);
