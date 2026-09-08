import {
  Button,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  useMediaQuery,
  useTheme,
} from "@mui/material";

type ConfirmDialogProps = {
  open: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  /** Destructive confirm styling (red). */
  danger?: boolean;
  pending?: boolean;
  onCancel: () => void;
  onConfirm: () => void | Promise<void>;
};

/** Accessible replacement for window.confirm. Safe default focus is Cancel. */
export const ConfirmDialog = ({
  open,
  title,
  message,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  danger = false,
  pending = false,
  onCancel,
  onConfirm,
}: ConfirmDialogProps) => {
  const theme = useTheme();
  const fullScreen = useMediaQuery(theme.breakpoints.down("sm"));
  return (
    <Dialog open={open} onClose={onCancel} fullScreen={fullScreen} maxWidth="xs" fullWidth>
      <DialogTitle sx={{ fontWeight: 700 }}>{title}</DialogTitle>
      <DialogContent>
        <DialogContentText>{message}</DialogContentText>
      </DialogContent>
      <DialogActions
        sx={{
          p: 2,
          gap: 1,
          flexDirection: { xs: "column-reverse", sm: "row" },
          justifyContent: { sm: "flex-end" },
          "& .MuiButton-root": { width: { xs: "100%", sm: "auto" } },
        }}
        className="safe-area-bottom"
      >
        <Button onClick={onCancel} disabled={pending} autoFocus>
          {cancelLabel}
        </Button>
        <Button
          variant="contained"
          color={danger ? "error" : "primary"}
          onClick={onConfirm}
          disabled={pending}
        >
          {pending ? <CircularProgress size={20} color="inherit" /> : confirmLabel}
        </Button>
      </DialogActions>
    </Dialog>
  );
};
