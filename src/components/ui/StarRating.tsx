import { Box, Rating, Typography } from "@mui/material";

/** Read-only star display with optional review count. */
export const StarDisplay = ({ value, count, size = "small" }: { value?: number | null; count?: number; size?: "small" | "medium" | "large" }) => {
  if (value == null) {
    return (
      <Typography variant="caption" color="text.secondary">
        No ratings yet
      </Typography>
    );
  }
  return (
    <Box sx={{ display: "inline-flex", alignItems: "center", gap: 0.5 }}>
      <Rating value={value} precision={0.5} readOnly size={size} />
      <Typography variant="caption" color="text.secondary" className="tnum">
        {value.toFixed(1)}{count != null ? ` (${count})` : ""}
      </Typography>
    </Box>
  );
};

/** Interactive 1–5 star input. */
export const StarInput = ({ value, onChange }: { value: number | null; onChange: (v: number | null) => void }) => (
  <Rating
    value={value}
    precision={1}
    max={5}
    onChange={(_, v) => onChange(v)}
    sx={{ fontSize: "2rem" }}
  />
);
