import {
  Box, Button, ButtonGroup, Card, CardContent, CircularProgress, IconButton, Stack, TextField,
  Tooltip,
  Typography, Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
} from "@mui/material";
import InfoOutlinedIcon from "@mui/icons-material/InfoOutlined";
import { useState } from "react";
import { useDashboard } from "../hooks/useApi";

const money = (value: number) => `₹${(value || 0).toFixed(0)}`;

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

export const Dashboard = () => {
  const initialRange = rangeFor("last7");
  const [preset, setPreset] = useState("last7");
  const [startDate, setStartDate] = useState(initialRange.start);
  const [endDate, setEndDate] = useState(initialRange.end);
  const { data, isLoading, isError } = useDashboard(startDate, endDate);

  if (isLoading) return <Box sx={{ display: "flex", justifyContent: "center", py: 8 }}><CircularProgress /></Box>;
  if (isError) return <Typography color="error">Unable to load dashboard data.</Typography>;

  return (
    <Box>
      <Typography variant="h4" sx={{ mb: 2, fontSize: { xs: "1.5rem", sm: "2rem" }, fontWeight: 700 }}>Dashboard</Typography>

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

      {/* KPI cards - 2 columns on mobile, 6 on desktop */}
      <Box sx={{ display: "grid", gridTemplateColumns: { xs: "repeat(2, 1fr)", sm: "repeat(3, 1fr)", md: "repeat(6, 1fr)" }, gap: { xs: 1, sm: 2 } }}>
        {[
          ["Revenue", money(data.revenue), "#e3f2fd", "Total sales value during the selected date range."],
          ["Cost", money(data.cost), "#fff3e0", "Estimated cost of the products sold during the selected date range."],
          ["Profit", money(data.profit), "#e8f5e9", "Revenue minus estimated product cost."],
          ["Margin", `${(data.margin_pct || 0).toFixed(1)}%`, "#ede7f6", "Profit expressed as a percentage of revenue."],
          ["Due", money(data.due), "#ffebee", "Amount still due from sales in the selected date range."],
          ["Stock", money(data.saleable_stock_value), "#f3f4f6", "Current cost value of active saleable stock."],
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

      {/* Operations & Alerts - stacked on mobile */}
      <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", md: "repeat(2, 1fr)" }, gap: { xs: 1, sm: 2 }, mt: 2 }}>
        <Card><CardContent sx={{ p: { xs: 1.5, sm: 2 }, "&:last-child": { pb: { xs: 1.5, sm: 2 } } }}>
          <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 700 }}>Operations</Typography>
          <Typography variant="body2" sx={{ fontSize: { xs: "0.75rem", sm: "0.875rem" } }}>Sales: {data.invoice_count} invoices | Paid: {money(data.paid)}</Typography>
          <Typography variant="body2" sx={{ fontSize: { xs: "0.75rem", sm: "0.875rem" } }}>Production: {data.batch_count} batches, {data.produced_qty} units</Typography>
          <Typography variant="body2" sx={{ fontSize: { xs: "0.75rem", sm: "0.875rem" } }}>Ready to pack: {data.ready_to_pack_qty} | Packed: {data.packed_packs} packs</Typography>
          <Typography variant="body2" sx={{ fontSize: { xs: "0.75rem", sm: "0.875rem" } }}>Finished stock: {data.packaged_stock_packs} packs</Typography>
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

      {/* Trend & Products - stacked on mobile */}
      <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", md: "repeat(2, 1fr)" }, gap: { xs: 1, sm: 2 }, mt: 2 }}>
        <Card><CardContent sx={{ p: { xs: 1, sm: 2 }, "&:last-child": { pb: { xs: 1, sm: 2 } } }}>
          <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 700 }}>Sales trend</Typography>
          <TableContainer sx={{ overflowX: "auto" }}><Table size="small"><TableHead><TableRow>
            <TableCell sx={{ py: 0.5, px: 1, fontSize: "0.7rem" }}>Date</TableCell><TableCell sx={{ py: 0.5, px: 1, fontSize: "0.7rem" }}>Revenue</TableCell><TableCell sx={{ py: 0.5, px: 1, fontSize: "0.7rem" }}>Profit</TableCell>
          </TableRow></TableHead><TableBody>
            {data.trend?.slice(-7).reverse().map((point: any) => <TableRow key={point.date}>
              <TableCell sx={{ py: 0.5, px: 1, fontSize: "0.7rem" }}>{point.date.slice(5)}</TableCell><TableCell sx={{ py: 0.5, px: 1, fontSize: "0.7rem" }}>{money(point.revenue)}</TableCell><TableCell sx={{ py: 0.5, px: 1, fontSize: "0.7rem" }}>{money(point.profit)}</TableCell>
            </TableRow>)}
          </TableBody></Table></TableContainer>
        </CardContent></Card>
        <Card><CardContent sx={{ p: { xs: 1, sm: 2 }, "&:last-child": { pb: { xs: 1, sm: 2 } } }}>
          <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 700 }}>Top products</Typography>
          <TableContainer sx={{ overflowX: "auto" }}><Table size="small"><TableHead><TableRow>
            <TableCell sx={{ py: 0.5, px: 1, fontSize: "0.7rem" }}>Product</TableCell><TableCell sx={{ py: 0.5, px: 1, fontSize: "0.7rem" }}>Qty</TableCell><TableCell sx={{ py: 0.5, px: 1, fontSize: "0.7rem" }}>Revenue</TableCell><TableCell sx={{ py: 0.5, px: 1, fontSize: "0.7rem" }}>Profit</TableCell>
          </TableRow></TableHead><TableBody>
            {data.top_products?.slice(0, 5).map((product: any) => <TableRow key={product.name}>
              <TableCell sx={{ py: 0.5, px: 1, fontSize: "0.7rem", fontWeight: 600 }}>{product.name}</TableCell><TableCell sx={{ py: 0.5, px: 1, fontSize: "0.7rem" }}>{product.quantity}</TableCell>
              <TableCell sx={{ py: 0.5, px: 1, fontSize: "0.7rem" }}>{money(product.revenue)}</TableCell><TableCell sx={{ py: 0.5, px: 1, fontSize: "0.7rem" }}>{money(product.profit)}</TableCell>
            </TableRow>)}
          </TableBody></Table></TableContainer>
        </CardContent></Card>
      </Box>
    </Box>
  );
};
