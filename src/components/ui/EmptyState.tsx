import { Box, Button, Typography } from "@mui/material";
import type { ReactNode } from "react";

type EmptyStateProps = {
  title: string;
  message?: string;
  icon?: ReactNode;
  actionLabel?: string;
  onAction?: () => void;
};

/** Loaded successfully, but there is no data. Always pairs copy with an action when one exists. */
export const EmptyState = ({ title, message, icon, actionLabel, onAction }: EmptyStateProps) => (
  <Box sx={{ py: 4, px: 2, textAlign: "center" }}>
    {icon && <Box sx={{ color: "text.secondary", mb: 1 }}>{icon}</Box>}
    <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
      {title}
    </Typography>
    {message && (
      <Typography color="text.secondary" sx={{ fontSize: "0.8125rem", mt: 0.5 }}>
        {message}
      </Typography>
    )}
    {actionLabel && onAction && (
      <Button variant="contained" onClick={onAction} sx={{ mt: 2 }}>
        {actionLabel}
      </Button>
    )}
  </Box>
);
