import {
  Box, Button, Card, CardContent, CircularProgress, IconButton, Stack, TextField,
  Tooltip,
  Typography, Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
} from "@mui/material";
import InfoOutlinedIcon from "@mui/icons-material/InfoOutlined";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useDashboard } from "../hooks/useApi";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, Legend, PieChart, Pie, Cell, BarChart, Bar } from "recharts";
import { formatMoney } from "../utils/formatNumber";

const dateValue = (date: Date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

const rangeFor = (range: string) => {
  const today = new Date();
  const end = new Date(today);
  const start = new Date(today);
  if (range === "today") {
    // start and end are already today
  } else if (range === "last7") {
    start.setDate(start.getDate() - 6);
  } else if (range === "thisMonth") {
    start.setDate(1);
  } else if (range === "lastMonth") {
    start.setMonth(start.getMonth() - 1, 1);
    end.setDate(0);
  } else if (range === "thisYear") {
    start.setMonth(0, 1);
  } else if (range === "lastYear") {
    start.setFullYear(start.getFullYear() - 1, 0, 1);
    end.setFullYear(end.getFullYear() - 1, 11, 31);
  }
  return { start: dateValue(start), end: dateValue(end) };
};

const PIE_COLORS = ["#1976d2", "#388e3c", "#f57c00", "#d32f2f", "#7b1fa2", "#00796b", "#c2185b", "#5d4037"];

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <Card sx={{ p: 1, boxShadow: 3 }}>
      <Typography variant="caption" sx={{ fontWeight: 700 }}>{label}</Typography>
      {payload.map((entry: any, i: number) => (
        <Typography key={i} variant="caption" sx={{ display: "block", color: entry.color }}>
          {entry.name}: {formatMoney(entry.value)}
        </Typography>
      ))}
    </Card>
  );
};

export const Dashboard = () => {
  const navigate = useNavigate();
  const initialRange = rangeFor("last7");
  const [preset, setPreset] = useState("last7");
  const [startDate, setStartDate] = useState(initialRange.start);
  const [endDate, setEndDate] = useState(initialRange.end);
  const { data, isLoading, isFetching, isError } = useDashboard(startDate, endDate);

  if (isLoading) return <Box sx={{ display: "flex", justifyContent: "center", py: 8 }}><CircularProgress /></Box>;
  if (isError) return <Typography color="error">Unable to load dashboard data.</Typography>;

  const trendData = (data.trend || []).map((t: any) => ({
    date: t.date.slice(5),
    Revenue: t.revenue || 0,
    Profit: t.profit || 0,
  }));

  const costRevenueData = (data.trend || []).map((t: any) => ({
    date: t.date.slice(5),
    Cost: t.cost || 0,
    Revenue: t.revenue || 0,
  }));

  const marginData = (data.trend || []).map((t: any) => ({
    date: t.date.slice(5),
    "Margin %": (t.revenue || 0) > 0 ? ((t.profit || 0) / t.revenue * 100) : 0,
  }));

  const productData = (data.top_products || []).slice(0, 6).map((p: any, i: number) => ({
    name: p.name,
    value: p.revenue || 0,
    fill: PIE_COLORS[i % PIE_COLORS.length],
  }));

  return (
    <Box>
      <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 2 }}>
        <Typography variant="h4" sx={{ fontSize: { xs: "1.5rem", sm: "2rem" }, fontWeight: 700 }}>Dashboard</Typography>
        {isFetching && <CircularProgress size={18} />}
      </Box>

      {/* Date range presets - scrollable on mobile */}
      <Box sx={{ mb: 2, overflowX: "auto", pb: 0.5 }}>
        <Stack direction="row" spacing={1} sx={{ minWidth: "max-content" }}>
          {[
            ["today", "Today"], ["last7", "7D"], ["thisMonth", "This Mo."],
            ["lastMonth", "Last Mo."], ["thisYear", "This Yr."], ["lastYear", "Last Yr."],
          ].map(([value, label]) => (
            <Button key={value} size="small" variant={preset === value ? "contained" : "outlined"} onClick={() => {
              const range = rangeFor(value);
              setPreset(value);
              setStartDate(range.start);
              setEndDate(range.end);
            }} sx={{ minWidth: "auto", px: 1.5, fontSize: "0.75rem", whiteSpace: "nowrap" }}>{label}</Button>
          ))}
        </Stack>
      </Box>

      {/* Date inputs - stacked on mobile */}
      <Stack direction={{ xs: "column", sm: "row" }} spacing={1} sx={{ mb: 3 }}>
        <TextField label="From" type="date" size="small" value={startDate} onChange={(e) => { setPreset(""); setStartDate(e.target.value); }} slotProps={{ inputLabel: { shrink: true } }} sx={{ flex: 1 }} />
        <TextField label="To" type="date" size="small" value={endDate} onChange={(e) => { setPreset(""); setEndDate(e.target.value); }} slotProps={{ inputLabel: { shrink: true } }} sx={{ flex: 1 }} />
      </Stack>

      {/* KPI cards */}
      <Box sx={{ display: "grid", gridTemplateColumns: { xs: "repeat(2, 1fr)", sm: "repeat(3, 1fr)", md: "repeat(5, 1fr)" }, gap: { xs: 1, sm: 2 } }}>
        {[
          ["Revenue", formatMoney(data.revenue), "#e3f2fd", "Total sales value during the selected date range."],
          ["Cost", formatMoney(data.cost), "#fff3e0", "Estimated cost of the products sold during the selected date range."],
          ["Profit", formatMoney(data.profit), "#e8f5e9", "Revenue minus estimated product cost."],
          ["Margin", `${(data.margin_pct || 0).toFixed(1)}%`, "#ede7f6", "Profit expressed as a percentage of revenue."],
          ["Due", formatMoney(data.due), "#ffebee", "Amount still due from sales in the selected date range."],
          ["Supplier Dues", formatMoney(data.supplier_dues), "#fff8e1", "Outstanding balance owed to suppliers."],
          ["Cash In", formatMoney(data.cash_in), "#e8f5e9", "Customer payments received in the selected date range."],
          ["Cash Out", formatMoney(data.cash_out), "#ffebee", "Supplier payments made in the selected date range."],
          ["Advances", formatMoney(data.advance_balances_total), "#e3f2fd", "Total advance balances held from customers."],
          ["Avg Batch", formatMoney(data.avg_batch_cost), "#f3e5f5", "Average production batch cost in the selected date range."],
        ].map(([label, value, bgcolor, description]) => (
          <Card key={label} sx={{ bgcolor }}>
            <CardContent sx={{ p: { xs: 1, sm: 2 }, "&:last-child": { pb: { xs: 1, sm: 2 } } }}>
              <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mb: 0.5 }}>
                <Typography variant="body2" sx={{ fontSize: { xs: "0.7rem", sm: "0.8rem" }, color: "text.secondary" }}>{label}</Typography>
                <Tooltip title={description} placement="top"><IconButton size="small" sx={{ p: 0.25 }}><InfoOutlinedIcon sx={{ fontSize: "0.9rem" }} /></IconButton></Tooltip>
              </Box>
              <Typography variant="h6" sx={{ fontSize: { xs: "1rem", sm: "1.25rem" }, fontWeight: 700 }}>{value}</Typography>
            </CardContent>
          </Card>
        ))}
      </Box>

      {/* Charts Row */}
      <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", md: "2fr 1fr" }, gap: { xs: 1, sm: 2 }, mt: 2 }}>
        {/* Revenue & Profit Line Chart */}
        <Card>
          <CardContent sx={{ p: { xs: 1, sm: 2 }, "&:last-child": { pb: { xs: 1, sm: 2 } } }}>
            <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 700 }}>Revenue & Profit Trend</Typography>
            {trendData.length > 0 ? (
              <ResponsiveContainer width="100%" height={220}>
                <LineChart data={trendData} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="date" tick={{ fontSize: 10 }} />
                  <YAxis tick={{ fontSize: 10 }} />
                  <RechartsTooltip content={<CustomTooltip />} />
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                  <Line type="monotone" dataKey="Revenue" stroke="#1976d2" strokeWidth={2} dot={false} />
                  <Line type="monotone" dataKey="Profit" stroke="#388e3c" strokeWidth={2} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <Box sx={{ height: 220, display: "flex", alignItems: "center", justifyContent: "center" }}>
                <Typography color="text.secondary" sx={{ fontSize: "0.8rem" }}>No trend data for this period</Typography>
              </Box>
            )}
          </CardContent>
        </Card>

        {/* Product Mix Donut Chart */}
        <Card>
          <CardContent sx={{ p: { xs: 1, sm: 2 }, "&:last-child": { pb: { xs: 1, sm: 2 } } }}>
            <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 700 }}>Sales by Product</Typography>
            {productData.length > 0 ? (
              <ResponsiveContainer width="100%" height={220}>
                <PieChart>
                  <Pie
                    data={productData}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={80}
                    paddingAngle={2}
                    dataKey="value"
                    labelLine={false}
                    label={false}
                  >
                    {productData.map((entry: any, index: number) => (
                      <Cell key={`cell-${index}`} fill={entry.fill} />
                    ))}
                  </Pie>
                  <RechartsTooltip formatter={(value: any) => formatMoney(value)} />
                  <Legend wrapperStyle={{ fontSize: 10 }} />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <Box sx={{ height: 220, display: "flex", alignItems: "center", justifyContent: "center" }}>
                <Typography color="text.secondary" sx={{ fontSize: "0.8rem" }}>No product data yet</Typography>
              </Box>
            )}
          </CardContent>
        </Card>
      </Box>

      {/* Cost vs Revenue & Margin % Trend */}
      <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", md: "1fr 1fr" }, gap: { xs: 1, sm: 2 }, mt: 2 }}>
        <Card>
          <CardContent sx={{ p: { xs: 1, sm: 2 }, "&:last-child": { pb: { xs: 1, sm: 2 } } }}>
            <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 700 }}>Cost vs Revenue</Typography>
            {costRevenueData.length > 0 ? (
              <ResponsiveContainer width="100%" height={180}>
                <BarChart data={costRevenueData} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="date" tick={{ fontSize: 10 }} />
                  <YAxis tick={{ fontSize: 10 }} />
                  <RechartsTooltip content={<CustomTooltip />} />
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                  <Bar dataKey="Cost" fill="#f57c00" radius={[3, 3, 0, 0]} />
                  <Bar dataKey="Revenue" fill="#1976d2" radius={[3, 3, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <Box sx={{ height: 180, display: "flex", alignItems: "center", justifyContent: "center" }}>
                <Typography color="text.secondary" sx={{ fontSize: "0.8rem" }}>No trend data for this period</Typography>
              </Box>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardContent sx={{ p: { xs: 1, sm: 2 }, "&:last-child": { pb: { xs: 1, sm: 2 } } }}>
            <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 700 }}>Margin % Trend</Typography>
            {marginData.length > 0 ? (
              <ResponsiveContainer width="100%" height={180}>
                <LineChart data={marginData} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="date" tick={{ fontSize: 10 }} />
                  <YAxis tick={{ fontSize: 10 }} unit="%" />
                  <RechartsTooltip content={<CustomTooltip />} />
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                  <Line type="monotone" dataKey="Margin %" stroke="#7b1fa2" strokeWidth={2} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <Box sx={{ height: 180, display: "flex", alignItems: "center", justifyContent: "center" }}>
                <Typography color="text.secondary" sx={{ fontSize: "0.8rem" }}>No trend data for this period</Typography>
              </Box>
            )}
          </CardContent>
        </Card>
      </Box>

      {/* Operations & Alerts */}
      <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", md: "repeat(2, 1fr)" }, gap: { xs: 1, sm: 2 }, mt: 2 }}>
        <Card><CardContent sx={{ p: { xs: 1.5, sm: 2 }, "&:last-child": { pb: { xs: 1.5, sm: 2 } } }}>
          <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 700 }}>Operations</Typography>
          <Typography variant="body2" sx={{ fontSize: { xs: "0.75rem", sm: "0.875rem" } }}>Sales: {data.invoice_count} invoices | Paid: {formatMoney(data.paid)}</Typography>
          <Typography variant="body2" sx={{ fontSize: { xs: "0.75rem", sm: "0.875rem" } }}>Production: {data.batch_count} batches, {data.produced_qty} units | Avg cost: {formatMoney(data.avg_batch_cost)}</Typography>
          <Typography variant="body2" sx={{ fontSize: { xs: "0.75rem", sm: "0.875rem" } }}>Ready to pack: {data.ready_to_pack_qty} | Packed: {data.packed_packs} packs</Typography>
          <Typography variant="body2" sx={{ fontSize: { xs: "0.75rem", sm: "0.875rem" } }}>Finished stock: {data.packaged_stock_packs} packs</Typography>
          <Typography variant="body2" sx={{ fontSize: { xs: "0.75rem", sm: "0.875rem" }, color: data.pending_orders_count > 0 ? "warning.main" : "text.secondary", fontWeight: data.pending_orders_count > 0 ? 700 : 400 }}>
            Pending orders: {data.pending_orders_count} {data.order_shortage_count > 0 ? `| ${data.order_shortage_count} units short` : ""}
          </Typography>
        </CardContent></Card>
        <Card><CardContent sx={{ p: { xs: 1.5, sm: 2 }, "&:last-child": { pb: { xs: 1.5, sm: 2 } } }}>
          <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 700 }}>Alerts</Typography>
          <Typography variant="body2" sx={{ fontSize: { xs: "0.75rem", sm: "0.875rem" } }}>Low stock: {data.low_stock_count} | Out of stock: {data.out_of_stock_count}</Typography>
          <Typography variant="body2" sx={{ fontSize: { xs: "0.75rem", sm: "0.875rem" } }}>Missing selling price: {data.missing_price_count}</Typography>
          {data.alerts?.slice(0, 3).map((alert: any) => (
            <Typography variant="caption" key={`${alert.category}-${alert.name}`} sx={{ display: "block", fontSize: "0.7rem" }}>
              {alert.category}: {alert.name} ({alert.quantity} {alert.unit})
            </Typography>
          ))}
        </CardContent></Card>
      </Box>

      {/* Top Products Table */}
      <Card sx={{ mt: 2 }}>
        <CardContent sx={{ p: { xs: 1, sm: 2 }, "&:last-child": { pb: { xs: 1, sm: 2 } } }}>
          <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 700 }}>Top Products</Typography>
          <TableContainer sx={{ overflowX: "auto" }}><Table size="small"><TableHead><TableRow>
            <TableCell sx={{ py: 0.5, px: 1, fontSize: "0.7rem", fontWeight: 700 }}>Product</TableCell>
            <TableCell sx={{ py: 0.5, px: 1, fontSize: "0.7rem", fontWeight: 700 }}>Qty</TableCell>
            <TableCell sx={{ py: 0.5, px: 1, fontSize: "0.7rem", fontWeight: 700 }}>Revenue</TableCell>
            <TableCell sx={{ py: 0.5, px: 1, fontSize: "0.7rem", fontWeight: 700 }}>Profit</TableCell>
          </TableRow></TableHead><TableBody>
            {data.top_products?.slice(0, 5).map((product: any) => <TableRow key={product.name}>
              <TableCell sx={{ py: 0.5, px: 1, fontSize: "0.7rem", fontWeight: 600 }}>{product.name}</TableCell><TableCell sx={{ py: 0.5, px: 1, fontSize: "0.7rem" }}>{product.quantity}</TableCell>
              <TableCell sx={{ py: 0.5, px: 1, fontSize: "0.7rem" }}>{formatMoney(product.revenue)}</TableCell><TableCell sx={{ py: 0.5, px: 1, fontSize: "0.7rem" }}>{formatMoney(product.profit)}</TableCell>
            </TableRow>)}
          </TableBody></Table></TableContainer>
        </CardContent>
      </Card>

      {/* Top Customers Table */}
      <Card sx={{ mt: 2 }}>
        <CardContent sx={{ p: { xs: 1, sm: 2 }, "&:last-child": { pb: { xs: 1, sm: 2 } } }}>
          <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 700 }}>Top Customers</Typography>
          <TableContainer sx={{ overflowX: "auto" }}><Table size="small"><TableHead><TableRow>
            <TableCell sx={{ py: 0.5, px: 1, fontSize: "0.7rem", fontWeight: 700 }}>Customer</TableCell>
            <TableCell sx={{ py: 0.5, px: 1, fontSize: "0.7rem", fontWeight: 700 }}>Revenue</TableCell>
            <TableCell sx={{ py: 0.5, px: 1, fontSize: "0.7rem", fontWeight: 700 }}>Cost</TableCell>
            <TableCell sx={{ py: 0.5, px: 1, fontSize: "0.7rem", fontWeight: 700 }}>Profit</TableCell>
          </TableRow></TableHead><TableBody>
            {(data.top_customers || []).slice(0, 8).map((customer: any) => (
              <TableRow
                key={customer.customer_id}
                hover
                sx={{ cursor: "pointer" }}
                onClick={() => navigate(`/customers/${customer.customer_id}`)}
              >
                <TableCell sx={{ py: 0.5, px: 1, fontSize: "0.7rem", fontWeight: 600 }}>{customer.name}</TableCell>
                <TableCell sx={{ py: 0.5, px: 1, fontSize: "0.7rem" }}>{formatMoney(customer.revenue)}</TableCell>
                <TableCell sx={{ py: 0.5, px: 1, fontSize: "0.7rem" }}>{formatMoney(customer.cost)}</TableCell>
                <TableCell sx={{ py: 0.5, px: 1, fontSize: "0.7rem", fontWeight: 700, color: customer.profit >= 0 ? "success.main" : "error.main" }}>{formatMoney(customer.profit)}</TableCell>
              </TableRow>
            ))}
            {(!data.top_customers || data.top_customers.length === 0) && (
              <TableRow><TableCell colSpan={4} align="center" sx={{ py: 3, fontSize: "0.8rem", color: "text.secondary" }}>No customer data for this period</TableCell></TableRow>
            )}
          </TableBody></Table></TableContainer>
        </CardContent>
      </Card>
    </Box>
  );
};
