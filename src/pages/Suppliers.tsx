import { Alert, Box, Button, Card, CardContent, CircularProgress, Dialog, DialogActions, DialogContent, DialogTitle, TextField, Typography } from "@mui/material";
import { useState, useMemo } from "react";
import { useAddSupplier, useSupplier, useSuppliers } from "../hooks/useApi";

export const Suppliers = () => {
  const { data: suppliers = [], isLoading } = useSuppliers();
  const [selectedId, setSelectedId] = useState(0);
  const { data: profile } = useSupplier(selectedId);
  const addSupplier = useAddSupplier();
  const [open, setOpen] = useState(false);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [form, setForm] = useState({ name: "", phone: "", email: "", address: "", tax_id: "", notes: "" });

  const filtered = useMemo(() => {
    if (!search.trim()) return suppliers;
    const q = search.toLowerCase();
    return suppliers.filter((s: any) => s.name.toLowerCase().includes(q) || (s.phone || "").toLowerCase().includes(q) || (s.email || "").toLowerCase().includes(q));
  }, [suppliers, search]);

  const saveSupplier = async () => {
    if (!form.name.trim()) return setError("Supplier name is required.");
    try { await addSupplier.mutateAsync(form); setOpen(false); setForm({ name: "", phone: "", email: "", address: "", tax_id: "", notes: "" }); setError(""); }
    catch (e: any) { setError(e.response?.data?.detail || "Could not save supplier."); }
  };

  return <Box>
    <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 2 }}>
      <Typography variant="h4" sx={{ fontSize: { xs: "1.5rem", sm: "2rem" }, fontWeight: 700 }}>Suppliers</Typography>
      <Button variant="contained" size="small" onClick={() => setOpen(true)} sx={{ fontSize: { xs: "0.75rem", sm: "0.875rem" } }}>Add supplier</Button>
    </Box>
    {isLoading ? <Box sx={{ display: "flex", justifyContent: "center", py: 8 }}><CircularProgress /></Box> : <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", md: "260px 1fr" }, gap: { xs: 1, sm: 2 }, height: { xs: "auto", md: "calc(100vh - 160px)" } }}>
      {/* Left panel - supplier list */}
      <Card sx={{ overflow: "hidden", display: "flex", flexDirection: "column", height: { xs: "auto", md: "100%" } }}>
        <CardContent sx={{ p: 1, "&:last-child": { pb: 1 } }}>
          <TextField size="small" placeholder="Search..." fullWidth value={search} onChange={(e) => setSearch(e.target.value)} sx={{ mb: 1, "& .MuiInputBase-root": { fontSize: "0.875rem" } }} />
          <Box sx={{ overflowY: "auto", maxHeight: { xs: 200, md: "calc(100vh - 240px)" } }}>
            {filtered.map((supplier: any) => <Button key={supplier.id} fullWidth sx={{ justifyContent: "flex-start", py: 0.75, minHeight: 40, fontSize: "0.85rem", color: supplier.id === selectedId ? "primary.main" : "text.primary", bgcolor: supplier.id === selectedId ? "action.selected" : "transparent" }} onClick={() => setSelectedId(supplier.id)}>{supplier.name}</Button>)}
            {filtered.length === 0 && <Typography variant="body2" color="text.secondary" sx={{ p: 1, fontSize: "0.8rem" }}>No suppliers found</Typography>}
          </Box>
        </CardContent>
      </Card>
      {/* Right panel - details */}
      <Card sx={{ overflow: "auto", height: { xs: "auto", md: "100%" } }}>
        <CardContent sx={{ p: { xs: 1.5, sm: 2 }, "&:last-child": { pb: { xs: 1.5, sm: 2 } } }}>
          {profile ? <>
            <Typography variant="h5" sx={{ fontSize: { xs: "1.25rem", sm: "1.5rem" }, fontWeight: 700 }}>{profile.name}</Typography>
            <Typography color="text.secondary" sx={{ mb: 2, fontSize: { xs: "0.75rem", sm: "0.875rem" } }}>{profile.phone || "No phone"} · {profile.email || "No email"}</Typography>
            <Box sx={{ display: "grid", gridTemplateColumns: { xs: "repeat(3, 1fr)", sm: "repeat(3, 1fr)" }, gap: { xs: 1, sm: 2 }, mb: 2 }}>
              <Card sx={{ bgcolor: "grey.50" }}><CardContent sx={{ p: 1, "&:last-child": { pb: 1 } }}><Typography variant="caption" sx={{ fontSize: "0.65rem", color: "text.secondary" }}>Purchases</Typography><Typography variant="subtitle2" sx={{ fontSize: { xs: "0.85rem", sm: "1rem" }, fontWeight: 700 }}>₹{profile.total_purchases.toFixed(0)}</Typography></CardContent></Card>
              <Card sx={{ bgcolor: "success.50" }}><CardContent sx={{ p: 1, "&:last-child": { pb: 1 } }}><Typography variant="caption" sx={{ fontSize: "0.65rem", color: "text.secondary" }}>Paid</Typography><Typography variant="subtitle2" sx={{ fontSize: { xs: "0.85rem", sm: "1rem" }, fontWeight: 700, color: "success.main" }}>₹{profile.total_paid.toFixed(0)}</Typography></CardContent></Card>
              <Card sx={{ bgcolor: "error.50" }}><CardContent sx={{ p: 1, "&:last-child": { pb: 1 } }}><Typography variant="caption" sx={{ fontSize: "0.65rem", color: "text.secondary" }}>Due</Typography><Typography variant="subtitle2" sx={{ fontSize: { xs: "0.85rem", sm: "1rem" }, fontWeight: 700, color: "error.main" }}>₹{profile.balance_due.toFixed(0)}</Typography></CardContent></Card>
            </Box>
            <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 700 }}>Transactions</Typography>
            {profile.purchases.map((purchase: any) => <Box key={`p-${purchase.id}`} sx={{ py: 0.75, borderBottom: 1, borderColor: "divider" }}><Typography variant="body2" sx={{ fontSize: { xs: "0.8rem", sm: "0.875rem" } }}>{purchase.item_name}</Typography><Typography variant="caption" sx={{ fontSize: "0.7rem", color: "text.secondary" }}>{purchase.quantity} {purchase.unit} · ₹{purchase.total_amount.toFixed(2)}</Typography></Box>)}
          </> : <Box sx={{ py: 4, textAlign: "center" }}><Typography color="text.secondary" sx={{ fontSize: "0.9rem" }}>Select a supplier to view transactions.</Typography></Box>}
        </CardContent>
      </Card>
    </Box>}
    <Dialog open={open} onClose={() => setOpen(false)} maxWidth="xs" fullWidth>
      <DialogTitle sx={{ fontSize: "1.1rem", fontWeight: 700 }}>Add supplier</DialogTitle>
      <DialogContent sx={{ p: 2 }}>
        {error && <Alert severity="error" sx={{ mb: 1, fontSize: "0.8rem" }}>{error}</Alert>}
        {Object.keys(form).map((key) => <TextField key={key} margin="dense" label={key.replace("_", " ")} fullWidth size="small" value={(form as any)[key]} onChange={(e) => setForm({ ...form, [key]: e.target.value })} sx={{ "& .MuiInputBase-root": { fontSize: "0.875rem" } }} />)}
      </DialogContent>
      <DialogActions sx={{ p: 2, pt: 0 }}><Button onClick={() => setOpen(false)} size="small">Cancel</Button><Button onClick={saveSupplier} variant="contained" size="small" disabled={addSupplier.isPending}>{addSupplier.isPending ? <CircularProgress size={18} /> : "Save"}</Button></DialogActions>
    </Dialog>
  </Box>;
};
