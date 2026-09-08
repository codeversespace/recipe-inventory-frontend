import { Alert, Box, Button, Card, CardContent, CircularProgress, Dialog, DialogActions, DialogContent, DialogTitle, FormControl, InputLabel, LinearProgress, MenuItem, Select, TextField, Typography } from "@mui/material";
import { Autocomplete } from "@mui/material";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import { useState, useMemo } from "react";
import { useAddSupplier, useSupplier, useSuppliers } from "../hooks/useApi";
import { PieChart, Pie, Cell, Tooltip as RechartsTooltip, ResponsiveContainer, Legend } from "recharts";
import { formatDate } from "../utils/formatDate";
import { formatMoney } from "../utils/formatNumber";

const COLORS = ["#1976d2", "#388e3c", "#f57c00", "#d32f2f", "#7b1fa2", "#00796b"];

const CustomTooltip = ({ active, payload }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <Card sx={{ p: 1, boxShadow: 3 }}>
      <Typography variant="caption" sx={{ fontWeight: 700 }}>{payload[0].name}</Typography>
      <Typography variant="caption" sx={{ display: "block" }}>{formatMoney(payload[0].value)}</Typography>
    </Card>
  );
};

export const Suppliers = () => {
  const { data: suppliers = [], isLoading } = useSuppliers();
  const [selectedId, setSelectedId] = useState(0);
  const { data: profile, isLoading: profileLoading, isFetching: profileFetching } = useSupplier(selectedId);
  const addSupplier = useAddSupplier();
  const [open, setOpen] = useState(false);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [txnSearch, setTxnSearch] = useState("");
  const [datePreset, setDatePreset] = useState("all");
  const [customStart, setCustomStart] = useState("");
  const [customEnd, setCustomEnd] = useState("");
  const [form, setForm] = useState({ name: "", phone: "", email: "", address: "", tax_id: "", notes: "" });

  const dateRange = useMemo(() => {
    const now = new Date();
    let end = new Date(now);
    let start = new Date(now);
    if (datePreset === "today") { start.setHours(0, 0, 0, 0); }
    else if (datePreset === "last7") { start.setDate(start.getDate() - 6); start.setHours(0, 0, 0, 0); }
    else if (datePreset === "thisMonth") { start.setDate(1); start.setHours(0, 0, 0, 0); }
    else if (datePreset === "lastMonth") { start.setMonth(start.getMonth() - 1, 1); start.setHours(0, 0, 0, 0); end.setDate(0); end.setHours(23, 59, 59, 999); }
    else if (datePreset === "thisYear") { start.setMonth(0, 1); start.setHours(0, 0, 0, 0); }
    else if (datePreset === "custom" && customStart) {
      start = new Date(customStart);
      start.setHours(0, 0, 0, 0);
      if (customEnd) {
        end = new Date(customEnd);
        end.setHours(23, 59, 59, 999);
      }
    }
    else { return null; }
    return { start, end };
  }, [datePreset, customStart, customEnd]);

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

  const spendingData = useMemo(() => {
    if (!profile?.purchases) return [];
    const byItem: Record<string, number> = {};
    profile.purchases.forEach((p: any) => {
      const item = p.item_name || "Other";
      byItem[item] = (byItem[item] || 0) + (p.total_amount || 0);
    });
    return Object.entries(byItem).map(([name, value]) => ({ name, value }));
  }, [profile]);

  const allTotals = useMemo(() => {
    if (!suppliers?.length) return { purchases: 0, paid: 0, due: 0 };
    return suppliers.reduce((acc: any, s: any) => ({
      purchases: acc.purchases + (s.total_purchases || 0),
      paid: acc.paid + (s.total_paid || 0),
      due: acc.due + (s.balance_due || 0),
    }), { purchases: 0, paid: 0, due: 0 });
  }, [suppliers]);

  const supplierOptions = useMemo(() => filtered.map((s: any) => ({ id: s.id, name: s.name, balance_due: s.balance_due, total_paid: s.total_paid })), [filtered]);

  const selectedSupplierObj = useMemo(() => {
    if (selectedId <= 0) return null;
    return supplierOptions.find((s) => s.id === selectedId) || null;
  }, [selectedId, supplierOptions]);

  const filteredPurchases = useMemo(() => {
    if (!profile?.purchases) return [];
    let result = profile.purchases;
    if (txnSearch.trim()) {
      const q = txnSearch.toLowerCase();
      result = result.filter((p: any) => p.item_name?.toLowerCase().includes(q) || p.reference?.toLowerCase().includes(q) || String(p.quantity).includes(q));
    }
    if (dateRange) {
      result = result.filter((p: any) => {
        const d = new Date(p.purchased_at);
        return d >= dateRange.start && d <= dateRange.end;
      });
    }
    return result;
  }, [profile, txnSearch, dateRange]);

  const filteredPayments = useMemo(() => {
    if (!profile?.payments) return [];
    let result = profile.payments;
    if (txnSearch.trim()) {
      const q = txnSearch.toLowerCase();
      result = result.filter((p: any) => p.method?.toLowerCase().includes(q) || p.reference?.toLowerCase().includes(q));
    }
    if (dateRange) {
      result = result.filter((p: any) => {
        const d = new Date(p.paid_at);
        return d >= dateRange.start && d <= dateRange.end;
      });
    }
    return result;
  }, [profile, txnSearch, dateRange]);

  const profileContent = profile ? (
    <>
      {profileFetching && <LinearProgress sx={{ mb: 1 }} />}
      <Typography variant="h5" sx={{ fontSize: { xs: "1.25rem", sm: "1.5rem" }, fontWeight: 700 }}>{profile.name}</Typography>
      <Typography color="text.secondary" sx={{ mb: 2, fontSize: { xs: "0.75rem", sm: "0.875rem" } }}>{profile.phone || "No phone"} · {profile.email || "No email"}</Typography>
      <Box sx={{ display: "grid", gridTemplateColumns: { xs: "repeat(3, 1fr)", sm: "repeat(3, 1fr)" }, gap: { xs: 1, sm: 2 }, mb: 2 }}>
        <Card sx={{ bgcolor: "grey.50" }}><CardContent sx={{ p: 1, "&:last-child": { pb: 1 } }}><Typography variant="caption" sx={{ fontSize: "0.65rem", color: "text.secondary" }}>Purchases</Typography><Typography variant="subtitle2" sx={{ fontSize: { xs: "0.85rem", sm: "1rem" }, fontWeight: 700 }}>{formatMoney(profile.total_purchases)}</Typography></CardContent></Card>
        <Card sx={{ bgcolor: "success.50" }}><CardContent sx={{ p: 1, "&:last-child": { pb: 1 } }}><Typography variant="caption" sx={{ fontSize: "0.65rem", color: "text.secondary" }}>Paid</Typography><Typography variant="subtitle2" sx={{ fontSize: { xs: "0.85rem", sm: "1rem" }, fontWeight: 700, color: "success.main" }}>{formatMoney(profile.total_paid)}</Typography></CardContent></Card>
        <Card sx={{ bgcolor: "error.50" }}><CardContent sx={{ p: 1, "&:last-child": { pb: 1 } }}><Typography variant="caption" sx={{ fontSize: "0.65rem", color: "text.secondary" }}>Due</Typography><Typography variant="subtitle2" sx={{ fontSize: { xs: "0.85rem", sm: "1rem" }, fontWeight: 700, color: "error.main" }}>{formatMoney(profile.balance_due)}</Typography></CardContent></Card>
      </Box>

      {spendingData.length > 0 && (
        <Card sx={{ mb: 2, bgcolor: "grey.50" }}>
          <CardContent sx={{ p: { xs: 1, sm: 1.5 }, "&:last-child": { pb: { xs: 1, sm: 1.5 } } }}>
            <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 700 }}>Spending by Item</Typography>
            <ResponsiveContainer width="100%" height={180}>
              <PieChart>
                <Pie data={spendingData} cx="50%" cy="50%" innerRadius={40} outerRadius={65} paddingAngle={2} dataKey="value">
                  {spendingData.map((_: any, index: number) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <RechartsTooltip content={<CustomTooltip />} />
                <Legend wrapperStyle={{ fontSize: 10 }} />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}

      <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 700 }}>Transactions</Typography>
      <Box sx={{ display: "flex", gap: 1, mb: 1.5, flexWrap: "wrap" }}>
        <TextField size="small" placeholder="Search transactions..." value={txnSearch} onChange={(e) => setTxnSearch(e.target.value)} sx={{ flex: "1 1 180px", "& .MuiInputBase-root": { fontSize: "0.8rem" } }} />
        <FormControl size="small" sx={{ minWidth: 130 }}>
          <InputLabel>Period</InputLabel>
          <Select value={datePreset} label="Period" onChange={(e) => setDatePreset(e.target.value)} sx={{ fontSize: "0.8rem" }}>
            <MenuItem value="all">All time</MenuItem>
            <MenuItem value="today">Today</MenuItem>
            <MenuItem value="last7">Last 7 days</MenuItem>
            <MenuItem value="thisMonth">This month</MenuItem>
            <MenuItem value="lastMonth">Last month</MenuItem>
            <MenuItem value="thisYear">This year</MenuItem>
            <MenuItem value="custom">Custom</MenuItem>
          </Select>
        </FormControl>
      </Box>
      {datePreset === "custom" && (
        <Box sx={{ display: "flex", gap: 1, mb: 1.5 }}>
          <TextField
            type="date"
            size="small"
            label="From"
            value={customStart}
            onChange={(e) => setCustomStart(e.target.value)}
            slotProps={{ inputLabel: { shrink: true } }}
            sx={{ flex: 1, "& .MuiInputBase-root": { fontSize: "0.8rem" } }}
          />
          <TextField
            type="date"
            size="small"
            label="To"
            value={customEnd}
            onChange={(e) => setCustomEnd(e.target.value)}
            slotProps={{ inputLabel: { shrink: true } }}
            sx={{ flex: 1, "& .MuiInputBase-root": { fontSize: "0.8rem" } }}
          />
        </Box>
      )}
      {filteredPurchases.length > 0 && filteredPurchases.map((purchase: any) => <Box key={`p-${purchase.id}`} sx={{ py: 0.75, borderBottom: 1, borderColor: "divider" }}><Typography variant="body2" sx={{ fontSize: { xs: "0.8rem", sm: "0.875rem" } }}>{purchase.item_name}</Typography><Typography variant="caption" sx={{ fontSize: "0.7rem", color: "text.secondary" }}>{purchase.quantity} {purchase.unit} · {formatMoney(purchase.total_amount)} · {formatDate(purchase.purchased_at)}</Typography></Box>)}
      {filteredPayments.length > 0 && <>
        <Typography variant="subtitle2" sx={{ mt: 1.5, mb: 1, fontWeight: 700 }}>Payments</Typography>
        {filteredPayments.map((pay: any) => <Box key={`pay-${pay.id}`} sx={{ py: 0.75, borderBottom: 1, borderColor: "divider" }}><Typography variant="body2" sx={{ fontSize: { xs: "0.8rem", sm: "0.875rem" }, color: "success.main" }}>Payment {formatMoney(pay.amount)}</Typography><Typography variant="caption" sx={{ fontSize: "0.7rem", color: "text.secondary" }}>{pay.method} · {formatDate(pay.paid_at)}</Typography></Box>)}
      </>}
      {filteredPurchases.length === 0 && filteredPayments.length === 0 && <Typography variant="body2" color="text.secondary" sx={{ fontSize: "0.8rem", py: 2, textAlign: "center" }}>No transactions found.</Typography>}
    </>
  ) : selectedId > 0 && profileLoading ? (
    <Box sx={{ py: 4, textAlign: "center" }}><CircularProgress /></Box>
  ) : (
    <Box sx={{ py: 4, textAlign: "center" }}>
      <Typography variant="h6" sx={{ mb: 2, fontWeight: 700, fontSize: { xs: "1rem", sm: "1.25rem" } }}>All Suppliers Overview</Typography>
      <Box sx={{ display: "grid", gridTemplateColumns: { xs: "repeat(3, 1fr)" }, gap: 1, mb: 2 }}>
        <Card sx={{ bgcolor: "grey.50" }}><CardContent sx={{ p: 1, "&:last-child": { pb: 1 } }}><Typography variant="caption" sx={{ fontSize: "0.65rem", color: "text.secondary" }}>Total Purchases</Typography><Typography variant="subtitle2" sx={{ fontSize: { xs: "0.85rem", sm: "1rem" }, fontWeight: 700 }}>{formatMoney(allTotals.purchases)}</Typography></CardContent></Card>
        <Card sx={{ bgcolor: "success.50" }}><CardContent sx={{ p: 1, "&:last-child": { pb: 1 } }}><Typography variant="caption" sx={{ fontSize: "0.65rem", color: "text.secondary" }}>Total Paid</Typography><Typography variant="subtitle2" sx={{ fontSize: { xs: "0.85rem", sm: "1rem" }, fontWeight: 700, color: "success.main" }}>{formatMoney(allTotals.paid)}</Typography></CardContent></Card>
        <Card sx={{ bgcolor: "error.50" }}><CardContent sx={{ p: 1, "&:last-child": { pb: 1 } }}><Typography variant="caption" sx={{ fontSize: "0.65rem", color: "text.secondary" }}>Total Due</Typography><Typography variant="subtitle2" sx={{ fontSize: { xs: "0.85rem", sm: "1rem" }, fontWeight: 700, color: "error.main" }}>{formatMoney(allTotals.due)}</Typography></CardContent></Card>
      </Box>
      <Typography color="text.secondary" sx={{ fontSize: "0.8rem" }}>Select a supplier for detailed view.</Typography>
    </Box>
  );

  const listContent = (
    <Card sx={{ overflow: "hidden", display: "flex", flexDirection: "column", height: { xs: "auto", md: "100%" } }}>
      <CardContent sx={{ p: 1, "&:last-child": { pb: 1 } }}>
        <TextField size="small" placeholder="Search..." fullWidth value={search} onChange={(e) => setSearch(e.target.value)} sx={{ mb: 1, "& .MuiInputBase-root": { fontSize: "0.875rem" } }} />
        <Box sx={{ overflowY: "auto", maxHeight: { xs: 200, md: "calc(100vh - 240px)" } }}>
          {filtered.map((supplier: any) => <Button key={supplier.id} fullWidth sx={{ justifyContent: "flex-start", py: 0.75, minHeight: 40, fontSize: "0.85rem", color: supplier.id === selectedId ? "primary.main" : "text.primary", bgcolor: supplier.id === selectedId ? "action.selected" : "transparent", textAlign: "left", textTransform: "none" }} onClick={() => setSelectedId(supplier.id)}>
            <Box sx={{ width: "100%" }}>
              <Typography sx={{ fontSize: "0.85rem", fontWeight: supplier.id === selectedId ? 700 : 400 }}>{supplier.name}</Typography>
              <Typography sx={{ fontSize: "0.7rem", color: "text.secondary" }}>Due: {formatMoney(supplier.balance_due || 0)} · Paid: {formatMoney(supplier.total_paid || 0)}</Typography>
            </Box>
          </Button>)}
          {filtered.length === 0 && <Typography variant="body2" color="text.secondary" sx={{ p: 1, fontSize: "0.8rem" }}>No suppliers found</Typography>}
        </Box>
      </CardContent>
    </Card>
  );

  return <Box>
    <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 2 }}>
      <Typography variant="h4" sx={{ fontSize: { xs: "1.5rem", sm: "2rem" }, fontWeight: 700 }}>Suppliers</Typography>
      <Button variant="contained" size="small" onClick={() => setOpen(true)} sx={{ fontSize: { xs: "0.75rem", sm: "0.875rem" } }}>Add supplier</Button>
    </Box>
    {isLoading ? <Box sx={{ display: "flex", justifyContent: "center", py: 8 }}><CircularProgress /></Box> : (
      <>
        {/* Mobile: xs */}
        <Box sx={{ display: { xs: "block", md: "none" } }}>
          {selectedId > 0 ? (
            <Box>
              <Button startIcon={<ArrowBackIcon />} onClick={() => { setSelectedId(0); }} sx={{ mb: 1, fontSize: "0.85rem", textTransform: "none" }}>Back to suppliers</Button>
              {profile ? (
                <Card sx={{ overflow: "auto" }}>
                  <CardContent sx={{ p: { xs: 1.5, sm: 2 }, "&:last-child": { pb: { xs: 1.5, sm: 2 } } }}>
                    {profileContent}
                  </CardContent>
                </Card>
              ) : <Box sx={{ display: "flex", justifyContent: "center", py: 4 }}><CircularProgress /></Box>}
            </Box>
          ) : (
            <Box>
              <Autocomplete
                options={supplierOptions}
                getOptionLabel={(option) => option.name}
                onChange={(_e, value) => { if (value) setSelectedId(value.id); }}
                isOptionEqualToValue={(option, value) => option.id === value.id}
                renderInput={(params) => <TextField {...params} label="Select supplier" placeholder="Search…" size="small" />}
                renderOption={(props, option) => (
                  <Box component="li" {...props} key={option.id}>
                    <Box>
                      <Typography sx={{ fontSize: "0.85rem", fontWeight: 700 }}>{option.name}</Typography>
                      <Typography sx={{ fontSize: "0.7rem", color: "text.secondary" }}>Due: {formatMoney(option.balance_due || 0)} · Paid: {formatMoney(option.total_paid || 0)}</Typography>
                    </Box>
                  </Box>
                )}
                sx={{ mb: 2 }}
              />
              <Card sx={{ overflow: "auto" }}>
                <CardContent sx={{ p: { xs: 1.5, sm: 2 }, "&:last-child": { pb: { xs: 1.5, sm: 2 } } }}>
                  {profileContent}
                </CardContent>
              </Card>
            </Box>
          )}
        </Box>

        {/* Desktop: md+ */}
        <Box sx={{ display: { xs: "none", md: "grid" }, gridTemplateColumns: "260px 1fr", gap: 2, height: "calc(100vh - 160px)" }}>
          {listContent}
          <Card sx={{ overflow: "auto", height: "100%" }}>
            <CardContent sx={{ p: { xs: 1.5, sm: 2 }, "&:last-child": { pb: { xs: 1.5, sm: 2 } } }}>
              {profileContent}
            </CardContent>
          </Card>
        </Box>
      </>
    )}
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
