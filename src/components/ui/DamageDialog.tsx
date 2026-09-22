import { Alert, Box, Button, Dialog, DialogActions, DialogContent, DialogTitle, FormControl, InputLabel, MenuItem, Select, TextField, Typography } from "@mui/material";
import { useState } from "react";

export const DAMAGE_REASONS = ["damaged", "spoilt", "burnt", "expired", "broken", "other"] as const;

interface DamageDialogProps {
  open: boolean;
  onClose: () => void;
  title: string;
  unit?: string;
  maxQty?: number;
  pending?: boolean;
  error?: string;
  onSubmit: (payload: { qty: number; reason: string; notes?: string }) => Promise<void> | void;
}

/** Shared dialog for marking stock/batch qty as damaged, spoilt, burnt, etc. */
export const DamageDialog = ({ open, onClose, title, unit, maxQty, pending, error, onSubmit }: DamageDialogProps) => {
  const [qty, setQty] = useState("");
  const [reason, setReason] = useState<string>("damaged");
  const [notes, setNotes] = useState("");
  const [localError, setLocalError] = useState("");

  const close = () => {
    setQty("");
    setReason("damaged");
    setNotes("");
    setLocalError("");
    onClose();
  };

  const submit = async () => {
    const parsed = Number(qty);
    if (!Number.isFinite(parsed) || parsed <= 0) {
      setLocalError("Enter a quantity greater than zero.");
      return;
    }
    if (maxQty != null && parsed > maxQty + 1e-9) {
      setLocalError(`Only ${maxQty} ${unit || "units"} available.`);
      return;
    }
    setLocalError("");
    try {
      await onSubmit({ qty: parsed, reason, notes: notes.trim() || undefined });
    } catch {
      return;
    }
    close();
  };

  return (
    <Dialog open={open} onClose={close} maxWidth="xs" fullWidth>
      <DialogTitle sx={{ fontWeight: 700 }}>{title}</DialogTitle>
      <DialogContent>
        {(error || localError) && <Alert severity="error" sx={{ mb: 1 }}>{error || localError}</Alert>}
        {maxQty != null && (
          <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }} className="tnum">
            Available: {maxQty} {unit || ""}
          </Typography>
        )}
        <TextField
          autoFocus
          fullWidth
          margin="dense"
          label={`Quantity${unit ? ` (${unit})` : ""}`}
          type="number"
          value={qty}
          onChange={(e) => setQty(e.target.value)}
          slotProps={{ htmlInput: { min: 0, step: "any" } }}
        />
        <FormControl fullWidth margin="dense">
          <InputLabel>Reason</InputLabel>
          <Select value={reason} label="Reason" onChange={(e) => setReason(e.target.value)}>
            {DAMAGE_REASONS.map((r) => (
              <MenuItem key={r} value={r} sx={{ textTransform: "capitalize" }}>{r}</MenuItem>
            ))}
          </Select>
        </FormControl>
        <TextField
          fullWidth
          margin="dense"
          label="Notes (optional)"
          multiline
          minRows={2}
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
        />
        <Box sx={{ mt: 1 }}>
          <Typography variant="caption" color="text.secondary">
            Damaged quantity is deducted from live stock and recorded in the damage ledger.
          </Typography>
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={close}>Cancel</Button>
        <Button variant="contained" color="warning" onClick={submit} disabled={!!pending}>
          Mark damaged
        </Button>
      </DialogActions>
    </Dialog>
  );
};
