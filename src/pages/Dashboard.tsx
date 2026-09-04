import {
  Box, Button, ButtonGroup, Card, CardContent, CircularProgress, Stack, TextField,
  Typography, Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
} from "@mui/material";
import { useState } from "react";
import { useDashboard } from "../hooks/useApi";

const money = (value: number) => `₹${(value || 0).toFixed(2)}`;

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

  if (isLoading) return <CircularProgress />;
  if (isError) return <Typography color="error">Unable to load dashboard data.</Typography>;

  return (
    <Box>
      <Stack direction={{ xs: "column", sm: "row" }} spacing={2} sx={{ mb: 3 }}>
        <Typography variant="h4" sx={{ flex: 1 }}>Dashboard</Typography>
        <ButtonGroup variant="outlined" size="small">
          {[
            ["today", "Today"], ["last7", "Last 7 days"], ["thisMonth", "This month"],
            ["lastMonth", "Last month"], ["thisYear", "This year"], ["lastYear", "Last year"],
          ].map(([value, label]) => (
            <Button key={value} variant={preset === value ? "contained" : "outlined"} onClick={() => {
              const range = rangeFor(value);
              setPreset(value);
              setStartDate(range.start);
              setEndDate(range.end);
            }}>{label}</Button>
          ))}
        </ButtonGroup>
        <TextField label="From" type="date" value={startDate} onChange={(e) => { setPreset(""); setStartDate(e.target.value); }} slotProps={{ inputLabel: { shrink: true } }} />
        <TextField label="To" type="date" value={endDate} onChange={(e) => { setPreset(""); setEndDate(e.target.value); }} slotProps={{ inputLabel: { shrink: true } }} />
      </Stack>

      <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", sm: "repeat(2, 1fr)", md: "repeat(6, 1fr)" }, gap: 2 }}>
        {[
          ["Revenue", money(data.revenue), "#e3f2fd"],
          ["Cost", money(data.cost), "#fff3e0"],
          ["Profit", money(data.profit), "#e8f5e9"],
          ["Margin", `${(data.margin_pct || 0).toFixed(2)}%`, "#ede9fe"],
          ["Pending payments", money(data.due), "#ffebee"],
          ["Stock value", money(data.saleable_stock_value), "#f3f4f6"],
        ].map(([label, value, bgcolor]) => (
          <Box key={label}>
            <Card sx={{ bgcolor }}><CardContent>
              <Typography variant="body2">{label}</Typography>
              <Typography variant="h5">{value}</Typography>
            </CardContent></Card>
          </Box>
        ))}
      </Box>

      <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", md: "repeat(2, 1fr)" }, gap: 2, mt: 2 }}>
        <Card><CardContent>
          <Typography variant="h6">Operations</Typography>
          <Typography>Sales: {data.invoice_count} invoices | Paid: {money(data.paid)}</Typography>
          <Typography>Production: {data.batch_count} batches, {data.produced_qty} units</Typography>
          <Typography>Ready to pack: {data.ready_to_pack_qty} | Packed: {data.packed_packs} packs</Typography>
          <Typography>Finished stock: {data.packaged_stock_packs} packs</Typography>
        </CardContent></Card>
        <Card><CardContent>
          <Typography variant="h6">Alerts</Typography>
          <Typography>Low stock: {data.low_stock_count} | Out of stock: {data.out_of_stock_count}</Typography>
          <Typography>Missing selling price: {data.missing_price_count}</Typography>
          {data.alerts?.slice(0, 5).map((alert: any) => (
            <Typography variant="body2" key={`${alert.category}-${alert.name}`}>
              {alert.category}: {alert.name} ({alert.quantity} {alert.unit})
            </Typography>
          ))}
        </CardContent></Card>
      </Box>

      <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", md: "repeat(2, 1fr)" }, gap: 2, mt: 2 }}>
        <Card><CardContent>
          <Typography variant="h6">Sales trend</Typography>
          <TableContainer><Table size="small"><TableHead><TableRow>
            <TableCell>Date</TableCell><TableCell>Revenue</TableCell><TableCell>Profit</TableCell>
          </TableRow></TableHead><TableBody>
            {data.trend?.map((point: any) => <TableRow key={point.date}>
              <TableCell>{point.date}</TableCell><TableCell>{money(point.revenue)}</TableCell><TableCell>{money(point.profit)}</TableCell>
            </TableRow>)}
          </TableBody></Table></TableContainer>
        </CardContent></Card>
        <Card><CardContent>
          <Typography variant="h6">Top products</Typography>
          <TableContainer><Table size="small"><TableHead><TableRow>
            <TableCell>Product</TableCell><TableCell>Qty</TableCell><TableCell>Revenue</TableCell><TableCell>Profit</TableCell>
          </TableRow></TableHead><TableBody>
            {data.top_products?.map((product: any) => <TableRow key={product.name}>
              <TableCell>{product.name}</TableCell><TableCell>{product.quantity}</TableCell>
              <TableCell>{money(product.revenue)}</TableCell><TableCell>{money(product.profit)}</TableCell>
            </TableRow>)}
          </TableBody></Table></TableContainer>
        </CardContent></Card>
      </Box>
    </Box>
  );
};
