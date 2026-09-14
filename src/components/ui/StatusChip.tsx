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

const STATUS_CONFIG: Record<StatusKind, { color: "success" | "warning" | "error" | "info" | "default"; bgKey: string }> = {
  success: { color: "success", bgKey: "success.light" },
  warning: { color: "warning", bgKey: "warning.light" },
  error: { color: "error", bgKey: "error.light" },
  info: { color: "info", bgKey: "info.light" },
  pending: { color: "warning", bgKey: "warning.light" },
  inactive: { color: "default", bgKey: "grey.200" },
  default: { color: "default", bgKey: "grey.200" },
};

type StatusChipProps = {
  status: StatusKind;
  label: ReactNode;
  icon?: React.ReactElement;
};

/** Single consistent status indicator with filled 15%-opacity background. */
export const StatusChip = ({ status, label, icon }: StatusChipProps) => {
  const cfg = STATUS_CONFIG[status];
  return (
    <Chip
      label={label}
      icon={icon}
      color={cfg.color}
      size="small"
      sx={{
        height: 22,
        fontSize: "0.7rem",
        fontWeight: 600,
        bgcolor: cfg.bgKey,
        border: "none",
        "& .MuiChip-label": { px: 0.75 },
      }}
    />
  );
};
