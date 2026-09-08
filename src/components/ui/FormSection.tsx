import { Box, Typography } from "@mui/material";
import type { ReactNode } from "react";

type FormSectionProps = {
  title: string;
  description?: string;
  children: ReactNode;
};

/** Titled group inside long dialogs/forms. */
export const FormSection = ({ title, description, children }: FormSectionProps) => (
  <Box sx={{ mt: 2 }}>
    <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 0.5 }}>
      {title}
    </Typography>
    {description && (
      <Typography color="text.secondary" sx={{ fontSize: "0.8125rem", mb: 1 }}>
        {description}
      </Typography>
    )}
    {children}
  </Box>
);
