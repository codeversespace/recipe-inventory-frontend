import { Box, Typography } from "@mui/material";
import type { ReactNode } from "react";

type PageHeaderProps = {
  title: string;
  subtitle?: string;
  /** Primary/secondary actions. Stacked full-width on xs, row on sm+. */
  actions?: ReactNode;
};

/** Standard page header: title + subtitle left, actions right (stacked on mobile). */
export const PageHeader = ({ title, subtitle, actions }: PageHeaderProps) => (
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
        sx={{ fontSize: { xs: "1.25rem", sm: "1.5rem" }, fontWeight: 700, letterSpacing: "-0.02em" }}
      >
        {title}
      </Typography>
      {subtitle && (
        <Typography color="text.secondary" sx={{ fontSize: { xs: "0.8125rem", sm: "0.875rem" }, mt: 0.5 }}>
          {subtitle}
        </Typography>
      )}
    </Box>
    {actions && (
      <Box
        sx={{
          display: "flex",
          gap: 1,
          alignItems: "center",
          flexDirection: { xs: "column", sm: "row" },
          alignSelf: { xs: "stretch", sm: "center" },
          "& .MuiButton-root": { width: { xs: "100%", sm: "auto" } },
        }}
      >
        {actions}
      </Box>
    )}
  </Box>
);
