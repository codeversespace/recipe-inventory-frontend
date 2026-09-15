import { Chip } from "@mui/material";
import type { ReactNode } from "react";

export type StatusKind =
  | "success"
  | "warning"
  | "error"
  | "info"
  | "pending"
  | "inactive"
  | "default";

type StatusChipProps = {
  status: StatusKind;
  label: ReactNode;
  icon?: React.ReactElement;
};

/** Single consistent status indicator with visible filled background. */
export const StatusChip = ({ status, label, icon }: StatusChipProps) => {
  const config: Record<StatusKind, { bg: string; text: string; chipColor: "success" | "warning" | "error" | "info" | "default" }> = {
    success: { bg: "#166534", text: "#bbf7d0", chipColor: "success" },
    warning: { bg: "#92400e", text: "#fef3c7", chipColor: "warning" },
    error: { bg: "#991b1b", text: "#fecaca", chipColor: "error" },
    info: { bg: "#1e40af", text: "#dbeafe", chipColor: "info" },
    pending: { bg: "#92400e", text: "#fef3c7", chipColor: "warning" },
    inactive: { bg: "#404040", text: "#d4d4d4", chipColor: "default" },
    default: { bg: "#404040", text: "#d4d4d4", chipColor: "default" },
  };
  const cfg = config[status];

  return (
    <Chip
      label={label}
      icon={icon}
      size="small"
      sx={{
        height: 22,
        fontSize: "0.7rem",
        fontWeight: 600,
        bgcolor: cfg.bg,
        color: cfg.text,
        border: "none",
        "& .MuiChip-label": { px: 0.75, color: cfg.text },
        "& .MuiChip-icon": { color: cfg.text, fontSize: "0.85rem" },
      }}
    />
  );
};
