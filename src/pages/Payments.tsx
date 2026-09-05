import { Alert, Autocomplete, Box, Button, Card, CardContent, Dialog, DialogActions, DialogContent, DialogTitle, MenuItem, Select, Tab, Tabs, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, TextField, Typography } from "@mui/material";
import { useMemo, useState } from "react";
import { useAddSupplierPaymentFromPayments, useCustomerPayment, useCustomers, usePaymentHistory, usePaymentsSales, useSuppliers, useSupplierPayments } from "../hooks/useApi";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, Legend } from "recharts";
import { VoiceInput } from "../components/VoiceInput";
import { bestMatch } from "../utils/fuzzy";

const cellSx = { py: 0.75, px: 1, fontSize: { xs: "0.7rem", sm: "0.8rem" } };

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <Card sx={{ p: 1, boxShadow: 3 }}>
      <Typography variant="caption" sx={{ fontWeight: 700 }}>{label}</Typography>
      {payload.map((entry: any, i: number) => (
        <Typography key={i} variant="caption" sx={{ display: "block", color: entry.color }}>
          {entry.name}: ₹{(entry.value || 0).toFixed(0)}
        </Typography>
      ))}
    </Card>
  );
};

export const Payments = () => {
  const { data: sales = [] } = usePaymentsSales();
  const { data: customers = [] } = useCustomers();
  const { data: suppliers = [] } = useSuppliers();
  const customerPayment = useCustomerPayment();
  const addSupplierPayment = useAddSupplierPaymentFromPayments();
  const [tab, setTab] = useState(0);
  const [search, setSearch] = useState("");
  const [customerOpen, setCustomerOpen] = useState(false);
  const [supplierOpen, setSupplierOpen] = useState(false);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [customer, setCustomer] = useState<any>(null);
  const [supplier, setSupplier] = useState<any>(null);
  const [amount, setAmount] = useState("");
  const [method, setMethod] = useState("CASH");
  const [reference, setReference] = useState("");
  const [notes, setNotes] = useState("");
  const [error, setError] = useState("");
  const { data: allHistory = [] } = usePaymentHistory(true);
  const { data: history = [], isFetching: historyLoading } = usePaymentHistory(historyOpen);
  const { data: supplierHistory = [] } = useSupplierPayments();

  const dueSales = sales.filter((sale: any) => sale.amount_due > 0);
  const matchingSales = useMemo(() => sales.filter((sale: any) => `${sale.id} ${sale.reference || ""} ${sale.customer_name || "Walk-in"}`.toLowerCase().includes(search.toLowerCase())), [sales, search]);
  const filtered = matchingSales.filter((sale: any) => sale.amount_due > 0);
  const totalDue = dueSales.reduce((sum: number, sale: any) => sum + sale.amount_due, 0);
  const filteredTotal = matchingSales.reduce((sum: number, sale: any) => sum + sale.total_amount, 0);
  const filteredPaid = matchingSales.reduce((sum: number, sale: any) => sum + sale.amount_paid, 0);
  const filteredDue = matchingSales.reduce((sum: number, sale: any) => sum + sale.amount_due, 0);

  const submitCustomerPayment = async () => {
    if (!customer || !Number.isFinite(Number(amount)) || Number(amount) <= 0) { setError("Select a customer and enter a valid payment amount."); return; }
    try {
      await customerPayment.mutateAsync({ customer_id: customer.id, amount: Number(amount), method, reference: reference || undefined });
      setCustomerOpen(false); setCustomer(null); setAmount(""); setReference(""); setError("");
    } catch (requestError: any) { setError(requestError.response?.data?.detail || "Could not allocate customer payment."); }
  };

  const submitSupplierPayment = async () => {
    if (!supplier || !Number.isFinite(Number(amount)) || Number(amount) <= 0) { setError("Select a supplier and enter a valid payment amount."); return; }
    try {
      await addSupplierPayment.mutateAsync({ supplierId: supplier.id, amount: Number(amount), method, reference: reference || undefined, notes: notes || undefined });
      setSupplierOpen(false); setSupplier(null); setAmount(""); setReference(""); setNotes(""); setError("");
    } catch (requestError: any) { setError(requestError.response?.data?.detail || "Could not record supplier payment."); }
  };

  const filteredSupplierPayments = useMemo(() => {
    if (!search.trim()) return supplierHistory;
    const q = search.toLowerCase();
    return supplierHistory.filter((p: any) => p.supplier_name.toLowerCase().includes(q) || (p.reference || "").toLowerCase().includes(q));
  }, [supplierHistory, search]);

  const handlePaymentVoice = (json: string) => {
    try {
      const parsed = JSON.parse(json);
      setAmount(String(parsed.amount || ""));
      setReference("");
      setNotes("");
      if (parsed.method) setMethod(parsed.method.toUpperCase());
      if (tab === 0) {
        const matchCust = bestMatch(customers, parsed.entity || "");
        if (matchCust) setCustomer(matchCust);
        setCustomerOpen(true);
      } else {
        const matchSup = bestMatch(suppliers, parsed.entity || "");
        if (matchSup) setSupplier(matchSup);
        setSupplierOpen(true);
      }
    } catch { /* ignore */ }
  };

  const cashFlowData = useMemo(() => {
    const totalCustomerPaid = allHistory.reduce((sum: number, p: any) => sum + (p.amount || 0), 0);
    const totalSupplierPaid = supplierHistory.reduce((sum: number, p: any) => sum + (p.amount || 0), 0);
    return [
      { name: "Money In", "Customer Payments": totalCustomerPaid },
      { name: "Money Out", "Supplier Payments": totalSupplierPaid },
      { name: "Net", "Net Cash Flow": totalCustomerPaid - totalSupplierPaid },
    ];
  }, [allHistory, supplierHistory]);

  return <Box>
    <Typography variant="h4" sx={{ mb: 1, fontSize: { xs: "1.5rem", sm: "2rem" }, fontWeight: 700 }}>Payments</Typography>
    <Typography color="text.secondary" sx={{ mb: 2, fontSize: { xs: "0.75rem", sm: "0.875rem" } }}>Unified module for customer and supplier payments.</Typography>

    {/* Cash Flow Summary Chart */}
    <Card sx={{ mb: 2 }}>
      <CardContent sx={{ p: { xs: 1, sm: 2 }, "&:last-child": { pb: { xs: 1, sm: 2 } } }}>
        <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 700 }}>Cash Flow Overview</Typography>
        <ResponsiveContainer width="100%" height={180}>
          <BarChart data={cashFlowData} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis dataKey="name" tick={{ fontSize: 10 }} />
            <YAxis tick={{ fontSize: 10 }} />
            <RechartsTooltip content={<CustomTooltip />} />
            <Legend wrapperStyle={{ fontSize: 11 }} />
            <Bar dataKey="Customer Payments" fill="#388e3c" radius={[4, 4, 0, 0]} barSize={30} />
            <Bar dataKey="Supplier Payments" fill="#d32f2f" radius={[4, 4, 0, 0]} barSize={30} />
            <Bar dataKey="Net Cash Flow" fill="#1976d2" radius={[4, 4, 0, 0]} barSize={30} />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>

    <Tabs value={tab} onChange={(_, v) => { setTab(v); setSearch(""); }} sx={{ mb: 2, minHeight: 40, "& .MuiTab-root": { minHeight: 40, py: 0, fontSize: { xs: "0.75rem", sm: "0.875rem" } } }}>
      <Tab label="Customer" />
      <Tab label="Supplier" />
    </Tabs>

    {tab === 0 && <>
      <Box sx={{ display: "grid", gridTemplateColumns: { xs: "repeat(2, 1fr)", sm: "repeat(4, 1fr)" }, gap: { xs: 1, sm: 2 }, mb: 2 }}>
        <Card sx={{ bgcolor: "grey.50" }}><CardContent sx={{ p: 1, "&:last-child": { pb: 1 } }}><Typography variant="caption" sx={{ fontSize: "0.65rem", color: "text.secondary" }}>{search ? "Filtered" : "Outstanding"}</Typography><Typography variant="subtitle2" sx={{ fontSize: { xs: "0.9rem", sm: "1.1rem" }, fontWeight: 700 }}>₹{(search ? filteredTotal : dueSales.reduce((sum: number, sale: any) => sum + sale.total_amount, 0)).toFixed(0)}</Typography></CardContent></Card>
        <Card sx={{ bgcolor: "success.50" }}><CardContent sx={{ p: 1, "&:last-child": { pb: 1 } }}><Typography variant="caption" sx={{ fontSize: "0.65rem", color: "text.secondary" }}>Paid</Typography><Typography variant="subtitle2" sx={{ fontSize: { xs: "0.9rem", sm: "1.1rem" }, fontWeight: 700, color: "success.main" }}>₹{(search ? filteredPaid : sales.reduce((sum: number, sale: any) => sum + sale.amount_paid, 0)).toFixed(0)}</Typography></CardContent></Card>
        <Card sx={{ bgcolor: "error.50" }}><CardContent sx={{ p: 1, "&:last-child": { pb: 1 } }}><Typography variant="caption" sx={{ fontSize: "0.65rem", color: "text.secondary" }}>Due</Typography><Typography variant="subtitle2" sx={{ fontSize: { xs: "0.9rem", sm: "1.1rem" }, fontWeight: 700, color: "error.main" }}>₹{(search ? filteredDue : totalDue).toFixed(0)}</Typography></CardContent></Card>
        <Card><CardContent sx={{ p: 1, "&:last-child": { pb: 1 } }}><Typography variant="caption" sx={{ fontSize: "0.65rem", color: "text.secondary" }}>Invoices</Typography><Typography variant="subtitle2" sx={{ fontSize: { xs: "0.9rem", sm: "1.1rem" }, fontWeight: 700 }}>{search ? filtered.length : dueSales.length}</Typography></CardContent></Card>
      </Box>
      <Box sx={{ display: "flex", gap: 1, mb: 2 }}>
        <TextField size="small" placeholder="Search invoices..." value={search} onChange={(event) => setSearch(event.target.value)} sx={{ flex: 1, "& .MuiInputBase-root": { fontSize: "0.85rem" } }} />
        <VoiceInput onResult={handlePaymentVoice} label="Quick voice payment" variant="payment" />
        <Button variant="contained" size="small" onClick={() => { setAmount(""); setReference(""); setCustomerOpen(true); }} sx={{ fontSize: { xs: "0.7rem", sm: "0.8rem" }, whiteSpace: "nowrap" }}>+ Receive</Button>
      </Box>
      <TableContainer sx={{ overflowX: "auto" }}><Table size="small"><TableHead><TableRow>
        <TableCell sx={{ ...cellSx, fontWeight: 700 }}>Invoice</TableCell><TableCell sx={{ ...cellSx, fontWeight: 700 }}>Customer</TableCell><TableCell sx={{ ...cellSx, fontWeight: 700 }}>Due</TableCell>
      </TableRow></TableHead><TableBody>{filtered.length ? filtered.map((sale: any) => <TableRow key={sale.id}>
        <TableCell sx={cellSx}>#{sale.id}{sale.reference ? ` ${sale.reference}` : ""}</TableCell>
        <TableCell sx={cellSx}>{sale.customer_name || "Walk-in"}</TableCell>
        <TableCell sx={{ ...cellSx, fontWeight: 700, color: "error.main" }}>₹{sale.amount_due.toFixed(0)}</TableCell>
      </TableRow>) : <TableRow><TableCell colSpan={3} align="center" sx={{ ...cellSx, py: 3 }}>No outstanding invoices.</TableCell></TableRow>}<TableRow sx={{ bgcolor: "action.hover" }}><TableCell colSpan={2} sx={{ ...cellSx, fontWeight: 700 }}>Total</TableCell><TableCell sx={{ ...cellSx, fontWeight: 700, color: "error.main" }}>₹{filteredDue.toFixed(0)}</TableCell></TableRow></TableBody></Table></TableContainer>
      {historyOpen && <Card sx={{ mt: 2 }}><CardContent sx={{ p: 1.5, "&:last-child": { pb: 1.5 } }}><Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 700 }}>Payment history</Typography>{historyLoading ? <Typography variant="body2" sx={{ fontSize: "0.8rem" }}>Loading...</Typography> : <TableContainer><Table size="small"><TableHead><TableRow>
        <TableCell sx={cellSx}>Date</TableCell><TableCell sx={cellSx}>Customer</TableCell><TableCell sx={cellSx}>Amount</TableCell><TableCell sx={cellSx}>Method</TableCell>
      </TableRow></TableHead><TableBody>{history.length ? history.map((payment: any) => <TableRow key={payment.id}>
        <TableCell sx={cellSx}>{new Date(payment.paid_at).toLocaleDateString()}</TableCell>
        <TableCell sx={cellSx}>{payment.customer_name || "Walk-in"}</TableCell>
        <TableCell sx={cellSx}>₹{payment.amount.toFixed(0)}</TableCell>
        <TableCell sx={cellSx}>{payment.method}</TableCell>
      </TableRow>) : <TableRow><TableCell colSpan={4} align="center" sx={cellSx}>No payments recorded.</TableCell></TableRow>}</TableBody></Table></TableContainer>}</CardContent></Card>}
      <Box sx={{ mt: 1, textAlign: "center" }}><Button size="small" onClick={() => setHistoryOpen((open) => !open)} sx={{ fontSize: "0.75rem" }}>{historyOpen ? "Hide history" : "Show history"}</Button></Box>
    </>}

    {tab === 1 && <>
      <Box sx={{ display: "grid", gridTemplateColumns: { xs: "repeat(3, 1fr)" }, gap: { xs: 1, sm: 2 }, mb: 2 }}>
        <Card sx={{ bgcolor: "grey.50" }}><CardContent sx={{ p: 1, "&:last-child": { pb: 1 } }}><Typography variant="caption" sx={{ fontSize: "0.65rem", color: "text.secondary" }}>Total paid</Typography><Typography variant="subtitle2" sx={{ fontSize: { xs: "0.85rem", sm: "1rem" }, fontWeight: 700 }}>₹{supplierHistory.reduce((sum: number, p: any) => sum + p.amount, 0).toFixed(0)}</Typography></CardContent></Card>
        <Card sx={{ bgcolor: "grey.50" }}><CardContent sx={{ p: 1, "&:last-child": { pb: 1 } }}><Typography variant="caption" sx={{ fontSize: "0.65rem", color: "text.secondary" }}>Suppliers</Typography><Typography variant="subtitle2" sx={{ fontSize: { xs: "0.85rem", sm: "1rem" }, fontWeight: 700 }}>{new Set(supplierHistory.map((p: any) => p.supplier_id)).size}</Typography></CardContent></Card>
        <Card sx={{ bgcolor: "grey.50" }}><CardContent sx={{ p: 1, "&:last-child": { pb: 1 } }}><Typography variant="caption" sx={{ fontSize: "0.65rem", color: "text.secondary" }}>Transactions</Typography><Typography variant="subtitle2" sx={{ fontSize: { xs: "0.85rem", sm: "1rem" }, fontWeight: 700 }}>{supplierHistory.length}</Typography></CardContent></Card>
      </Box>
      <Box sx={{ display: "flex", gap: 1, mb: 2 }}>
        <TextField size="small" placeholder="Search supplier..." value={search} onChange={(event) => setSearch(event.target.value)} sx={{ flex: 1, "& .MuiInputBase-root": { fontSize: "0.85rem" } }} />
        <VoiceInput onResult={handlePaymentVoice} label="Quick voice payment" variant="payment" />
        <Button variant="contained" size="small" onClick={() => { setAmount(""); setReference(""); setNotes(""); setSupplierOpen(true); }} sx={{ fontSize: { xs: "0.7rem", sm: "0.8rem" }, whiteSpace: "nowrap" }}>+ Payment</Button>
      </Box>
      <TableContainer sx={{ overflowX: "auto" }}><Table size="small"><TableHead><TableRow>
        <TableCell sx={{ ...cellSx, fontWeight: 700 }}>Date</TableCell><TableCell sx={{ ...cellSx, fontWeight: 700 }}>Supplier</TableCell><TableCell sx={{ ...cellSx, fontWeight: 700 }}>Amount</TableCell><TableCell sx={{ ...cellSx, fontWeight: 700 }}>Method</TableCell>
      </TableRow></TableHead><TableBody>{filteredSupplierPayments.length ? filteredSupplierPayments.map((payment: any) => <TableRow key={payment.id}>
        <TableCell sx={cellSx}>{new Date(payment.paid_at).toLocaleDateString()}</TableCell>
        <TableCell sx={cellSx}>{payment.supplier_name}</TableCell>
        <TableCell sx={cellSx}>₹{payment.amount.toFixed(0)}</TableCell>
        <TableCell sx={cellSx}>{payment.method}</TableCell>
      </TableRow>) : <TableRow><TableCell colSpan={4} align="center" sx={{ ...cellSx, py: 3 }}>No supplier payments recorded.</TableCell></TableRow>}</TableBody></Table></TableContainer>
    </>}

    <Dialog open={customerOpen} onClose={() => { setCustomerOpen(false); setError(""); }} maxWidth="xs" fullWidth slotProps={{ paper: { sx: { mx: 1, width: "calc(100% - 16px)" } } }}>
      <DialogTitle sx={{ fontSize: "1rem", fontWeight: 700 }}>Receive payment</DialogTitle>
      <DialogContent sx={{ p: 2 }}>
        {error && <Alert severity="error" sx={{ mb: 1, fontSize: "0.8rem" }}>{error}</Alert>}
        <Autocomplete options={customers} getOptionLabel={(item: any) => item.name} value={customer} onChange={(_, item) => setCustomer(item)} renderInput={(params) => <TextField {...params} label="Customer" size="small" margin="dense" />} />
        <TextField fullWidth margin="dense" size="small" label="Amount" type="number" value={amount} onChange={(event) => setAmount(event.target.value)} />
        <Select fullWidth size="small" value={method} onChange={(event) => setMethod(event.target.value)} sx={{ mt: 1 }}><MenuItem value="CASH">Cash</MenuItem><MenuItem value="UPI">UPI</MenuItem><MenuItem value="BANK">Bank</MenuItem><MenuItem value="CHEQUE">Cheque</MenuItem></Select>
        <TextField fullWidth margin="dense" size="small" label="Reference" value={reference} onChange={(event) => setReference(event.target.value)} />
      </DialogContent>
      <DialogActions sx={{ p: 2, pt: 0 }}><Button onClick={() => setCustomerOpen(false)} size="small">Cancel</Button><Button variant="contained" size="small" onClick={submitCustomerPayment} disabled={customerPayment.isPending}>Allocate</Button></DialogActions>
    </Dialog>

    <Dialog open={supplierOpen} onClose={() => { setSupplierOpen(false); setError(""); }} maxWidth="xs" fullWidth slotProps={{ paper: { sx: { mx: 1, width: "calc(100% - 16px)" } } }}>
      <DialogTitle sx={{ fontSize: "1rem", fontWeight: 700 }}>Supplier payment</DialogTitle>
      <DialogContent sx={{ p: 2 }}>
        {error && <Alert severity="error" sx={{ mb: 1, fontSize: "0.8rem" }}>{error}</Alert>}
        <Autocomplete options={suppliers} getOptionLabel={(item: any) => item.name} value={supplier} onChange={(_, item) => setSupplier(item)} renderInput={(params) => <TextField {...params} label="Supplier" size="small" margin="dense" />} />
        <TextField fullWidth margin="dense" size="small" label="Amount" type="number" value={amount} onChange={(event) => setAmount(event.target.value)} />
        <Select fullWidth size="small" value={method} onChange={(event) => setMethod(event.target.value)} sx={{ mt: 1 }}><MenuItem value="CASH">Cash</MenuItem><MenuItem value="UPI">UPI</MenuItem><MenuItem value="BANK">Bank</MenuItem><MenuItem value="CHEQUE">Cheque</MenuItem></Select>
        <TextField fullWidth margin="dense" size="small" label="Reference" value={reference} onChange={(event) => setReference(event.target.value)} />
        <TextField fullWidth margin="dense" size="small" label="Notes" value={notes} onChange={(event) => setNotes(event.target.value)} />
      </DialogContent>
      <DialogActions sx={{ p: 2, pt: 0 }}><Button onClick={() => setSupplierOpen(false)} size="small">Cancel</Button><Button variant="contained" size="small" onClick={submitSupplierPayment} disabled={addSupplierPayment.isPending}>Record</Button></DialogActions>
    </Dialog>
  </Box>;
};
