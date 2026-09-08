import { Alert, Button, CircularProgress, DialogActions } from "@mui/material";

type FormActionsProps = {
  onCancel: () => void;
  cancelLabel?: string;
  submitLabel: string;
  onSubmit: () => void;
  /** Bind to the TanStack mutation's isPending — no duplicate state. */
  pending?: boolean;
  disabled?: boolean;
  error?: string;
};

/** Sticky, safe-area-aware dialog actions with a single pending contract. */
export const FormActions = ({
  onCancel,
  cancelLabel = "Cancel",
  submitLabel,
  onSubmit,
  pending = false,
  disabled = false,
  error,
}: FormActionsProps) => (
  <>
    {error && (
      <Alert severity="error" sx={{ mx: 2, mb: 1 }}>
        {error}
      </Alert>
    )}
    <DialogActions
      sx={{
        p: 2,
        gap: 1,
        position: "sticky",
        bottom: 0,
        bgcolor: "background.paper",
        borderTop: 1,
        borderColor: "divider",
        flexDirection: { xs: "column-reverse", sm: "row" },
        justifyContent: { sm: "flex-end" },
        alignItems: { xs: "stretch", sm: "center" },
        paddingBottom: { xs: "calc(16px + env(safe-area-inset-bottom))", sm: 2 },
      }}
    >
      <Button onClick={onCancel} disabled={pending}>
        {cancelLabel}
      </Button>
      <Button variant="contained" onClick={onSubmit} disabled={disabled || pending}>
        {pending ? <CircularProgress size={20} color="inherit" /> : submitLabel}
      </Button>
    </DialogActions>
  </>
);
