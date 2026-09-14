import { Box, Typography } from "@mui/material";
import type { ReactNode } from "react";

type PageHeaderProps = {
  title: string;
  subtitle?: string;
  /** Primary action (e.g. "Record sale") — full-width on mobile. */
  primaryAction?: ReactNode;
  /** Secondary actions (menus, icon buttons) — keep natural size. */
  secondaryActions?: ReactNode;
  /** @deprecated Use primaryAction/secondaryActions instead. Kept for backward compat. */
  actions?: ReactNode;
};

export const PageHeader = ({ title, subtitle, primaryAction, secondaryActions, actions }: PageHeaderProps) => (
  <Box
    sx={{
      display: "flex",
      justifyContent: "space-between",
      alignItems: { xs: "stretch", sm: "center" },
      flexDirection: { xs: "column", sm: "row" },
      gap: 1.5,
      mb: 2,
    }}
  >
    <Box sx={{ minWidth: 0 }}>
      <Typography
        variant="h4"
        sx={{ fontSize: { xs: "1.05rem", sm: "1.5rem" }, fontWeight: 700, letterSpacing: "-0.02em" }}
      >
        {title}
      </Typography>
      {subtitle && (
        <Typography color="text.secondary" sx={{ fontSize: { xs: "0.75rem", sm: "0.875rem" }, mt: 0.5 }}>
          {subtitle}
        </Typography>
      )}
    </Box>
    {(primaryAction || secondaryActions || actions) && (
      <Box
        sx={{
          display: "flex",
          gap: 1,
          alignItems: "center",
          flexDirection: { xs: "column", sm: "row" },
          alignSelf: { xs: "stretch", sm: "center" },
        }}
      >
        {primaryAction && (
          <Box sx={{ width: { xs: "100%", sm: "auto" }, display: "flex", gap: 1, alignItems: "center" }}>
            {primaryAction}
            {secondaryActions}
          </Box>
        )}
        {!primaryAction && actions}
        {!primaryAction && secondaryActions}
      </Box>
    )}
  </Box>
);
