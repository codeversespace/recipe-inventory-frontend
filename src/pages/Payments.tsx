import { Alert, Autocomplete, Box, Button, Card, CardContent, Dialog, DialogActions, DialogContent, DialogTitle, MenuItem, Select, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, TextField, Typography } from "@mui/material";
import { useMemo, useState } from "react";
import { useCustomerPayment, useCustomers, usePaymentHistory, usePaymentsSales } from "../hooks/useApi";

export const Payments = () => {
  const { data: sales = [] } = usePaymentsSales();
  const { data: customers = [] } = useCustomers();
  const customerPayment = useCustomerPayment();
  const [search, setSearch] = useState("");
  const [customerOpen, setCustomerOpen] = useState(false);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [customer, setCustomer] = useState<any>(null);
  const [amount, setAmount] = useState("");
  const [method, setMethod] = useState("CASH");
  const [reference, setReference] = useState("");
  const [error, setError] = useState("");
  const { data: history = [], isFetching: historyLoading } = usePaymentHistory(historyOpen);
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

  return <Box>
    <Typography variant="h4" gutterBottom>Payments</Typography>
    <Typography color="text.secondary" sx={{ mb: 3 }}>Outstanding invoices stay here for quick collection. Customer payments are automatically applied to the oldest invoice first.</Typography>
    <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr 1fr", sm: "repeat(4, 1fr)" }, gap: 2, mb: 3 }}>
      <Card><CardContent><Typography variant="caption">{search ? "Filtered total" : "Total outstanding"}</Typography><Typography variant="h5">₹{(search ? filteredTotal : dueSales.reduce((sum: number, sale: any) => sum + sale.total_amount, 0)).toFixed(2)}</Typography></CardContent></Card>
      <Card><CardContent><Typography variant="caption">Total paid</Typography><Typography variant="h5" color="success.main">₹{(search ? filteredPaid : sales.reduce((sum: number, sale: any) => sum + sale.amount_paid, 0)).toFixed(2)}</Typography></CardContent></Card>
      <Card><CardContent><Typography variant="caption">Total due</Typography><Typography variant="h5" color="error.main">₹{(search ? filteredDue : totalDue).toFixed(2)}</Typography></CardContent></Card>
      <Card><CardContent><Typography variant="caption">Invoices with dues</Typography><Typography variant="h5">{search ? filtered.length : dueSales.length}</Typography></CardContent></Card>
    </Box>
    <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap", mb: 2 }}>
      <TextField size="small" label="Search customer, invoice or reference" value={search} onChange={(event) => setSearch(event.target.value)} sx={{ flex: "1 1 280px" }} />
      <Button variant="outlined" onClick={() => { setAmount(""); setReference(""); setCustomerOpen(true); }}>Receive customer payment</Button>
      <Button variant="text" onClick={() => setHistoryOpen((open) => !open)}>{historyOpen ? "Hide payment history" : "Show payment history"}</Button>
    </Box>
    <TableContainer component={Card}><Table><TableHead><TableRow><TableCell>Invoice</TableCell><TableCell>Date</TableCell><TableCell>Customer</TableCell><TableCell>Total</TableCell><TableCell>Paid</TableCell><TableCell>Due</TableCell></TableRow></TableHead><TableBody>{filtered.length ? filtered.map((sale: any) => <TableRow key={sale.id}><TableCell>#{sale.id}{sale.reference ? ` · ${sale.reference}` : ""}</TableCell><TableCell>{new Date(sale.sold_at).toLocaleDateString()}</TableCell><TableCell>{sale.customer_name || "Walk-in"}</TableCell><TableCell>₹{sale.total_amount.toFixed(2)}</TableCell><TableCell>₹{sale.amount_paid.toFixed(2)}</TableCell><TableCell sx={{ fontWeight: 700, color: "error.main" }}>₹{sale.amount_due.toFixed(2)}</TableCell></TableRow>) : <TableRow><TableCell colSpan={6} align="center">No outstanding invoices match your search.</TableCell></TableRow>}<TableRow sx={{ bgcolor: "action.hover" }}><TableCell colSpan={3} sx={{ fontWeight: 700 }}>Totals</TableCell><TableCell sx={{ fontWeight: 700 }}>₹{filteredTotal.toFixed(2)}</TableCell><TableCell sx={{ fontWeight: 700 }}>₹{filteredPaid.toFixed(2)}</TableCell><TableCell sx={{ fontWeight: 700, color: "error.main" }}>₹{filteredDue.toFixed(2)}</TableCell></TableRow></TableBody></Table></TableContainer>
    {historyOpen && <Card sx={{ mt: 3 }}><CardContent><Typography variant="h6" sx={{ mb: 1 }}>Payment history</Typography>{historyLoading ? <Typography>Loading payment history...</Typography> : <TableContainer><Table size="small"><TableHead><TableRow><TableCell>Date</TableCell><TableCell>Customer</TableCell><TableCell>Invoice</TableCell><TableCell>Amount</TableCell><TableCell>Method</TableCell><TableCell>Reference</TableCell></TableRow></TableHead><TableBody>{history.length ? history.map((payment: any) => <TableRow key={payment.id}><TableCell>{new Date(payment.paid_at).toLocaleString()}</TableCell><TableCell>{payment.customer_name || "Walk-in"}</TableCell><TableCell>#{payment.sale_id}{payment.invoice_reference ? ` · ${payment.invoice_reference}` : ""}</TableCell><TableCell>₹{payment.amount.toFixed(2)}</TableCell><TableCell>{payment.method}</TableCell><TableCell>{payment.reference || "—"}</TableCell></TableRow>) : <TableRow><TableCell colSpan={6} align="center">No payments recorded.</TableCell></TableRow>}</TableBody></Table></TableContainer>}</CardContent></Card>}
    <Dialog open={customerOpen} onClose={() => { setCustomerOpen(false); setError(""); }} maxWidth="xs" fullWidth><DialogTitle>Receive customer payment</DialogTitle><DialogContent>{error && <Alert severity="error" sx={{ mb: 1 }}>{error}</Alert>}<Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>The amount will be allocated oldest invoice first.</Typography><Autocomplete options={customers} getOptionLabel={(item: any) => item.name} value={customer} onChange={(_, item) => setCustomer(item)} renderInput={(params) => <TextField {...params} label="Search customer" margin="dense" />} /><TextField fullWidth margin="dense" label="Total payment amount" type="number" value={amount} onChange={(event) => setAmount(event.target.value)} /><Select fullWidth size="small" value={method} onChange={(event) => setMethod(event.target.value)} sx={{ mt: 1 }}><MenuItem value="CASH">Cash</MenuItem><MenuItem value="UPI">UPI</MenuItem><MenuItem value="BANK">Bank transfer</MenuItem><MenuItem value="CHEQUE">Cheque</MenuItem></Select><TextField fullWidth margin="dense" label="Payment reference" value={reference} onChange={(event) => setReference(event.target.value)} /></DialogContent><DialogActions><Button onClick={() => setCustomerOpen(false)}>Cancel</Button><Button variant="contained" onClick={submitCustomerPayment} disabled={customerPayment.isPending}>Allocate payment</Button></DialogActions></Dialog>
  </Box>;
};
