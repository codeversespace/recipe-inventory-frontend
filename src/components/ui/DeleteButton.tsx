import { Button, Tooltip } from "@mui/material";
import DeleteOutlineRoundedIcon from "@mui/icons-material/DeleteOutlineRounded";
import { useState } from "react";
import { ConfirmDialog } from "./ConfirmDialog";

type DeleteButtonProps = {
  /** Accessible name. Required especially for icon-only usage. */
  label?: string;
  /** Item name interpolated into the default confirm copy. */
  itemName?: string;
  confirmTitle?: string;
  confirmMessage?: string;
  iconOnly?: boolean;
  size?: "small" | "medium";
  disabled?: boolean;
  /** The destructive mutation. Button disables + confirms around it. */
  onDelete: () => void | Promise<void>;
};

/** One consistent destructive button: 44px target, confirm sheet, pending lock. */
export const DeleteButton = ({
  label = "Delete",
  itemName,
  confirmTitle,
  confirmMessage,
  iconOnly = false,
  size = "small",
  disabled = false,
  onDelete,
}: DeleteButtonProps) => {
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [pending, setPending] = useState(false);
  const title = confirmTitle ?? `Delete${itemName ? ` "${itemName}"` : ""}?`;
  const message =
    confirmMessage ?? "This cannot be undone. Related history linked to this item will also be removed.";
  const run = async () => {
    setPending(true);
    try {
      await onDelete();
      setConfirmOpen(false);
    } finally {
      setPending(false);
    }
  };
  const button = (
    <Button
      size={size}
      color="error"
      variant="outlined"
      disabled={disabled || pending}
      aria-label={label}
      onClick={() => setConfirmOpen(true)}
      startIcon={iconOnly ? undefined : <DeleteOutlineRoundedIcon fontSize="small" />}
      sx={{ minHeight: 44, minWidth: iconOnly ? 44 : undefined, px: iconOnly ? 0 : undefined }}
    >
      {iconOnly ? <DeleteOutlineRoundedIcon fontSize="small" /> : label}
    </Button>
  );
  return (
    <>
      {iconOnly ? <Tooltip title={label}>{button}</Tooltip> : button}
      <ConfirmDialog
        open={confirmOpen}
        title={title}
        message={message}
        confirmLabel={label}
        danger
        pending={pending}
        onCancel={() => setConfirmOpen(false)}
        onConfirm={run}
      />
    </>
  );
};
