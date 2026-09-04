import { ArrowBack, Payments, TrendingUp } from "@mui/icons-material";
import { Alert, Box, Button, Card, CardContent, CircularProgress, FormControl, InputLabel, MenuItem, Select, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, TextField, Typography } from "@mui/material";
import { useNavigate, useParams } from "react-router-dom";
import * as React from "react";
import { useCustomerProfile, useCustomerPrices, useSaleableStock, useSetCustomerPrice } from "../hooks/useApi";

export const CustomerProfile = () => {
  const navigate = useNavigate();
  const customerId = Number(useParams<{ id: string }>().id);
  const [status, setStatus] = React.useState("");
  const [startDate, setStartDate] = React.useState("");
  const [endDate, setEndDate] = React.useState("");
  const { data: profile, isLoading, error } = useCustomerProfile(customerId, status, startDate, endDate);
  const { data: prices = [] } = useCustomerPrices(customerId);
  const { data: saleableStock = [] } = useSaleableStock();
  const setPrice = useSetCustomerPrice();
  const [priceItem, setPriceItem] = React.useState(0);
  const [priceValue, setPriceValue] = React.useState("");

  if (isLoading) return <CircularProgress />;
  if (error || !profile) return <Alert severity="error">Could not load this customer profile.</Alert>;

  const monthly = profile.sales.reduce((result: Record<string, number>, sale: any) => {
    const month = sale.sold_at.slice(0, 7);
    result[month] = (result[month] || 0) + sale.total_amount;
    return result;
  }, {});
  const monthValues = Object.entries(monthly).sort(([a], [b]) => a.localeCompare(b)).slice(-6);
  const maxMonth = Math.max(...monthValues.map(([, value]) => Number(value)), 1);
  const productTotals = profile.sales.flatMap((sale: any) => sale.lines).reduce((result: Record<string, { quantity: number; revenue: number; profit: number }>, line: any) => {
    const item = result[line.recipe_name] || { quantity: 0, revenue: 0, profit: 0 };
    item.quantity += line.quantity; item.revenue += line.line_total; item.profit += line.profit;
    result[line.recipe_name] = item;
    return result;
  }, {});
  const productEntries = Object.entries(productTotals) as [string, { quantity: number; revenue: number; profit: number }][];
  const topProduct = productEntries.sort(([, a], [, b]) => b.revenue - a.revenue)[0];

  return <Box className="profile-page">
    <Button startIcon={<ArrowBack />} onClick={() => navigate("/customers-sales")} sx={{ mb: 2 }}>Back to customers</Button>
    <Box sx={{ display: "flex", justifyContent: "space-between", gap: 2, flexWrap: "wrap", mb: 3 }}><Box><Typography variant="h4">{profile.name}</Typography><Typography color="text.secondary">{profile.phone || "No phone"} · {profile.email || "No email"}</Typography></Box><Typography color="text.secondary">Credit limit: ₹{(profile.credit_limit || 0).toFixed(2)}</Typography></Box>
    <Card sx={{ mb: 3 }}><CardContent><Typography variant="h6">Customer item prices</Typography><Box sx={{ display: "flex", gap: 1, flexWrap: "wrap", mt: 1 }}><FormControl sx={{ minWidth: 240 }} size="small"><InputLabel>Saleable item</InputLabel><Select value={priceItem} label="Saleable item" onChange={(event) => setPriceItem(Number(event.target.value))}>{saleableStock.map((item: any) => <MenuItem key={item.id} value={item.id}>{item.name}</MenuItem>)}</Select></FormControl><TextField size="small" label="Price per unit" type="number" value={priceValue} onChange={(event) => setPriceValue(event.target.value)} /><Button variant="contained" onClick={async () => { const item = saleableStock.find((stock: any) => stock.id === priceItem); if (item && Number(priceValue) >= 0) { await setPrice.mutateAsync({ customer_id: customerId, recipe_id: item.recipe_id, price_per_unit: Number(priceValue) }); setPriceItem(0); setPriceValue(""); } }}>Save price</Button></Box><Table size="small" sx={{ mt: 2 }}><TableHead><TableRow><TableCell>Item</TableCell><TableCell>Customer price</TableCell></TableRow></TableHead><TableBody>{prices.map((item: any) => <TableRow key={item.id}><TableCell>{item.recipe_name}</TableCell><TableCell>₹{item.price_per_unit.toFixed(2)}</TableCell></TableRow>)}</TableBody></Table></CardContent></Card>
    <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr 1fr", md: "repeat(5, 1fr)" }, gap: 2, mb: 3 }}>
      {[["Invoices", profile.total_sales, ""], ["Billed", `₹${profile.total_billed.toFixed(2)}`, ""], ["Paid", `₹${profile.total_paid.toFixed(2)}`, ""], ["Due", `₹${profile.total_due.toFixed(2)}`, profile.total_due ? "error.main" : "success.main"], ["Top product", topProduct ? topProduct[0] : "—", ""]].map(([label, value, color]) => <Card key={label}><CardContent><Typography variant="caption" color="text.secondary">{label}</Typography><Typography variant={label === "Top product" ? "body1" : "h6"} color={color}>{value}</Typography></CardContent></Card>)}
    </Box>
    <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap", mb: 3 }}><FormControl size="small" sx={{ minWidth: 150 }}><InputLabel>Status</InputLabel><Select value={status} label="Status" onChange={(event) => setStatus(event.target.value)}><MenuItem value="">All statuses</MenuItem><MenuItem value="PAID">Paid</MenuItem><MenuItem value="PARTIAL">Partial</MenuItem><MenuItem value="PENDING">Pending</MenuItem></Select></FormControl><TextField size="small" label="From" type="date" value={startDate} onChange={(event) => setStartDate(event.target.value)} slotProps={{ inputLabel: { shrink: true } }} /><TextField size="small" label="To" type="date" value={endDate} onChange={(event) => setEndDate(event.target.value)} slotProps={{ inputLabel: { shrink: true } }} /></Box>
    <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", md: "1fr 1fr" }, gap: 3, mb: 3 }}>
      <Card><CardContent><Typography variant="h6" sx={{ display: "flex", gap: 1, alignItems: "center" }}><TrendingUp color="primary" /> Sales by month</Typography>{monthValues.length ? <Box sx={{ display: "flex", alignItems: "end", gap: 1, height: 190, mt: 2 }}>{monthValues.map(([month, value]) => <Box key={month} sx={{ flex: 1, textAlign: "center" }}><Box sx={{ height: `${Math.max((Number(value) / maxMonth) * 140, 8)}px`, bgcolor: "primary.main", borderRadius: "6px 6px 0 0" }} /><Typography variant="caption">{month.slice(5)}</Typography><Typography variant="caption" sx={{ display: "block" }}>₹{Number(value).toFixed(0)}</Typography></Box>)}</Box> : <Typography color="text.secondary" sx={{ mt: 3 }}>No sales in this period.</Typography>}</CardContent></Card>
      <Card><CardContent><Typography variant="h6" sx={{ display: "flex", gap: 1, alignItems: "center" }}><Payments color="primary" /> Payment history</Typography><Table size="small" sx={{ mt: 1 }}><TableHead><TableRow><TableCell>Date</TableCell><TableCell>Method</TableCell><TableCell>Reference</TableCell><TableCell align="right">Amount</TableCell></TableRow></TableHead><TableBody>{profile.payments.map((payment: any) => <TableRow key={payment.id}><TableCell>{new Date(payment.paid_at).toLocaleDateString()}</TableCell><TableCell>{payment.method}</TableCell><TableCell>{payment.reference || "—"}</TableCell><TableCell align="right">₹{payment.amount.toFixed(2)}</TableCell></TableRow>)}</TableBody></Table></CardContent></Card>
    </Box>
    <Card sx={{ mb: 3 }}><CardContent><Typography variant="h6" gutterBottom>Product performance</Typography><TableContainer><Table size="small"><TableHead><TableRow><TableCell>Product</TableCell><TableCell>Quantity</TableCell><TableCell>Revenue</TableCell><TableCell>Estimated profit</TableCell></TableRow></TableHead><TableBody>{productEntries.map(([name, value]) => <TableRow key={name}><TableCell>{name}</TableCell><TableCell>{value.quantity}</TableCell><TableCell>₹{value.revenue.toFixed(2)}</TableCell><TableCell>₹{value.profit.toFixed(2)}</TableCell></TableRow>)}</TableBody></Table></TableContainer></CardContent></Card>
    <Card><CardContent><Typography variant="h6" gutterBottom>Invoice history</Typography><TableContainer sx={{ overflowX: "auto" }}><Table size="small"><TableHead><TableRow><TableCell>Invoice</TableCell><TableCell>Date</TableCell><TableCell>Status</TableCell><TableCell align="right">Billed</TableCell><TableCell align="right">Paid</TableCell><TableCell align="right">Due</TableCell></TableRow></TableHead><TableBody>{profile.sales.map((sale: any) => <TableRow key={sale.id}><TableCell>#{sale.id} {sale.reference || ""}</TableCell><TableCell>{new Date(sale.sold_at).toLocaleDateString()}</TableCell><TableCell>{sale.payment_status}</TableCell><TableCell align="right">₹{sale.total_amount.toFixed(2)}</TableCell><TableCell align="right">₹{sale.amount_paid.toFixed(2)}</TableCell><TableCell align="right">₹{sale.amount_due.toFixed(2)}</TableCell></TableRow>)}</TableBody></Table></TableContainer></CardContent></Card>
  </Box>;
};
