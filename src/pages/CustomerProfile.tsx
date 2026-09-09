import { ArrowBack, Payments, TrendingUp } from "@mui/icons-material";
import { Alert, Box, Button, Card, CardContent, CircularProgress, FormControl, InputLabel, MenuItem, Select, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, TextField, Typography } from "@mui/material";
import { useNavigate, useParams } from "react-router-dom";
import * as React from "react";
import { useCustomerProfile, useCustomerPrices, useSaleableStock, useSetCustomerPrice } from "../hooks/useApi";
import { formatDate } from "../utils/formatDate";
import { formatMoney } from "../utils/formatNumber";

export const CustomerProfile = () => {
  const navigate = useNavigate();
  const customerId = Number(useParams<{ id: string }>().id);
  const [status, setStatus] = React.useState("");
  const [startDate, setStartDate] = React.useState("");
  const [endDate, setEndDate] = React.useState("");
  const { data: profile, isLoading, error } = useCustomerProfile(customerId, status, startDate, endDate);
  const { data: prices = [], isLoading: pricesLoading } = useCustomerPrices(customerId);
  const { data: saleableStock = [], isLoading: stockLoading } = useSaleableStock();
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
    <Button startIcon={<ArrowBack />} onClick={() => navigate("/customers")} sx={{ mb: 2 }}>Back to customers</Button>
    <Box sx={{ display: "flex", justifyContent: "space-between", gap: 2, flexWrap: "wrap", mb: 3 }}><Box><Typography variant="h4">{profile.name}</Typography><Typography color="text.secondary">{profile.phone || "No phone"} · {profile.email || "No email"}</Typography></Box><Typography color="text.secondary">Credit limit: {formatMoney(profile.credit_limit || 0)}</Typography></Box>
    <Card sx={{ mb: 3 }}><CardContent><Typography variant="h6">Customer item prices</Typography><Box sx={{ display: "flex", gap: 1, flexWrap: "wrap", mt: 1 }}><FormControl sx={{ minWidth: 240 }} size="small" disabled={stockLoading}><InputLabel>{stockLoading ? "Loading items..." : "Saleable item"}</InputLabel><Select value={priceItem} label={stockLoading ? "Loading items..." : "Saleable item"} onChange={(event) => setPriceItem(Number(event.target.value))}>{saleableStock.map((item: any) => <MenuItem key={item.id} value={item.id}>{item.name}</MenuItem>)}</Select></FormControl><TextField size="small" label="Price per unit" type="number" value={priceValue} onChange={(event) => setPriceValue(event.target.value)} /><Button variant="contained" disabled={setPrice.isPending} onClick={async () => { const item = saleableStock.find((stock: any) => stock.id === priceItem); if (item && Number(priceValue) >= 0) { await setPrice.mutateAsync({ customer_id: customerId, stock_item_id: item.id, price_per_unit: Number(priceValue) }); setPriceItem(0); setPriceValue(""); } }}>{setPrice.isPending ? <CircularProgress size={20} color="inherit" /> : "Save price"}</Button></Box><TableContainer sx={{ overflowX: "auto" }}><Table size="small" sx={{ mt: 2, minWidth: 320 }}><TableHead><TableRow><TableCell>Item</TableCell><TableCell>Customer price</TableCell></TableRow></TableHead><TableBody>{pricesLoading ? <TableRow><TableCell colSpan={2} align="center"><CircularProgress size={20} /></TableCell></TableRow> : prices.map((item: any) => <TableRow key={item.id}><TableCell>{item.item_name || item.recipe_name}</TableCell><TableCell>{formatMoney(item.price_per_unit)}</TableCell></TableRow>)}</TableBody></Table></TableContainer></CardContent></Card>
    <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr 1fr", md: "repeat(6, 1fr)" }, gap: 2, mb: 3 }}>
      {[["Invoices", profile.total_sales, ""], ["Billed", formatMoney(profile.total_billed), ""], ["Paid", formatMoney(profile.total_paid), ""], ["Due", formatMoney(profile.total_due), profile.total_due ? "error.main" : "success.main"], ["Lifetime revenue", formatMoney((profile.lifetime_revenue || 0) + profile.total_billed), ""], ["Top product", topProduct ? topProduct[0] : "—", ""]].map(([label, value, color]) => <Card key={label}><CardContent><Typography variant="caption" color="text.secondary">{label}</Typography><Typography variant={label === "Top product" ? "body1" : "h6"} color={color}>{value}</Typography></CardContent></Card>)}
    </Box>
    <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap", mb: 3 }}><FormControl size="small" sx={{ minWidth: 150 }}><InputLabel>Status</InputLabel><Select value={status} label="Status" onChange={(event) => setStatus(event.target.value)}><MenuItem value="">All statuses</MenuItem><MenuItem value="PAID">Paid</MenuItem><MenuItem value="PARTIAL">Partial</MenuItem><MenuItem value="PENDING">Pending</MenuItem></Select></FormControl><TextField size="small" label="From" type="date" value={startDate} onChange={(event) => setStartDate(event.target.value)} slotProps={{ inputLabel: { shrink: true } }} /><TextField size="small" label="To" type="date" value={endDate} onChange={(event) => setEndDate(event.target.value)} slotProps={{ inputLabel: { shrink: true } }} /></Box>
    <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", md: "1fr 1fr" }, gap: 3, mb: 3 }}>
      <Card><CardContent><Typography variant="h6" sx={{ display: "flex", gap: 1, alignItems: "center" }}><TrendingUp color="primary" /> Sales by month</Typography>{monthValues.length ? <Box sx={{ display: "flex", alignItems: "end", gap: 1, height: 190, mt: 2 }}>{monthValues.map(([month, value]) => <Box key={month} sx={{ flex: 1, textAlign: "center" }}><Box sx={{ height: `${Math.max((Number(value) / maxMonth) * 140, 8)}px`, bgcolor: "primary.main", borderRadius: "6px 6px 0 0" }} /><Typography variant="caption">{month.slice(5)}</Typography><Typography variant="caption" sx={{ display: "block" }}>{formatMoney(Number(value))}</Typography></Box>)}</Box> : <Typography color="text.secondary" sx={{ mt: 3 }}>No sales in this period.</Typography>}</CardContent></Card>
      <Card><CardContent><Typography variant="h6" sx={{ display: "flex", gap: 1, alignItems: "center" }}><Payments color="primary" /> Payment history</Typography><TableContainer sx={{ overflowX: "auto" }}><Table size="small" sx={{ mt: 1, minWidth: 420 }}><TableHead><TableRow><TableCell>Date</TableCell><TableCell>Method</TableCell><TableCell>Reference</TableCell><TableCell align="right">Amount</TableCell></TableRow></TableHead><TableBody>{profile.payments.map((payment: any) => <TableRow key={payment.id}><TableCell>{formatDate(payment.paid_at)}</TableCell><TableCell>{payment.method}</TableCell><TableCell>{payment.reference || "—"}</TableCell><TableCell align="right">{formatMoney(payment.amount)}</TableCell></TableRow>)}</TableBody></Table></TableContainer></CardContent></Card>
    </Box>
          <Card sx={{ mb: 3 }}><CardContent><Typography variant="h6" gutterBottom>Product performance</Typography><TableContainer sx={{ overflowX: "auto" }}><Table size="small" sx={{ minWidth: 420 }}><TableHead><TableRow><TableCell>Product</TableCell><TableCell>Quantity</TableCell><TableCell>Revenue</TableCell><TableCell>Estimated profit</TableCell></TableRow></TableHead><TableBody>{productEntries.map(([name, value]) => <TableRow key={name}><TableCell>{name}</TableCell><TableCell>{value.quantity}</TableCell><TableCell>{formatMoney(value.revenue)}</TableCell><TableCell>{formatMoney(value.profit)}</TableCell></TableRow>)}</TableBody></Table></TableContainer></CardContent></Card>
    <Card><CardContent><Typography variant="h6" gutterBottom>Invoice history</Typography><TableContainer sx={{ overflowX: "auto" }}><Table size="small"><TableHead><TableRow><TableCell>Invoice</TableCell><TableCell>Date</TableCell><TableCell>Status</TableCell><TableCell align="right">Billed</TableCell><TableCell align="right">Paid</TableCell><TableCell align="right">Due</TableCell></TableRow></TableHead><TableBody>{profile.sales.map((sale: any) => <TableRow key={sale.id}><TableCell>#{sale.id} {sale.reference || ""}</TableCell><TableCell>{formatDate(sale.sold_at)}</TableCell><TableCell>{sale.payment_status}</TableCell><TableCell align="right">{formatMoney(sale.total_amount)}</TableCell><TableCell align="right">{formatMoney(sale.amount_paid)}</TableCell><TableCell align="right">{formatMoney(sale.amount_due)}</TableCell></TableRow>)}</TableBody></Table></TableContainer></CardContent></Card>
  </Box>;
};
