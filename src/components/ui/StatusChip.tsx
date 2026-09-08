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

const KIND_TO_COLOR: Record<StatusKind, "success" | "warning" | "error" | "info" | "default"> = {
  success: "success",
  warning: "warning",
  error: "error",
  info: "info",
  pending: "warning",
  inactive: "default",
  default: "default",
};

type StatusChipProps = {
  status: StatusKind;
  label: ReactNode;
  icon?: React.ReactElement;
};

/** Single consistent status indicator. Never color-only text. */
export const StatusChip = ({ status, label, icon }: StatusChipProps) => (
  <Chip
    label={label}
    icon={icon}
    color={KIND_TO_COLOR[status]}
    variant="outlined"
    size="small"
    sx={{ height: 24, fontSize: "0.75rem", fontWeight: 600 }}
  />
);
