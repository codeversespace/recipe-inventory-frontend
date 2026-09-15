import {
  Box, Button, Card, CardContent, CircularProgress, Stack, TextField,
  Typography, Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  useTheme,
} from "@mui/material";
import {
  AttachMoney as MoneyIcon,
  TrendingUp as TrendUpIcon,
  TrendingDown as TrendDownIcon,
  People as PeopleIcon,
  ShoppingCart as CartIcon,
  LocalShipping as TruckIcon,
  AccountBalance as BankIcon,
  Warning as WarnIcon,
  ArrowDownward as ArrowDownIcon,
  ArrowUpward as ArrowUpIcon,
  Receipt as ReceiptIcon,
  Person as PersonIcon,
} from "@mui/icons-material";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useDashboard } from "../hooks/useApi";
import { Line, XAxis, YAxis, ResponsiveContainer, PieChart, Pie, Cell, BarChart, Bar, CartesianGrid, Tooltip as RechartsTooltip, Legend, LineChart } from "recharts";
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

const PIE_COLORS = ["#0f766e", "#f97316", "#ef4444", "#a855f7", "#3b82f6", "#eab308", "#ec4899", "#14b8a6"];

const MiniSparkline = ({ data, color }: { data: number[]; color: string }) => {
  if (data.length < 2) return null;
  const chartData = data.map((v, i) => ({ i, v }));
  return (
    <ResponsiveContainer width="100%" height={40}>
      <LineChart data={chartData} margin={{ top: 2, right: 0, left: 0, bottom: 2 }}>
        <Line type="monotone" dataKey="v" stroke={color} strokeWidth={2} dot={false} activeDot={false} />
      </LineChart>
    </ResponsiveContainer>
  );
};

const SectionLabel = ({ children }: { children: React.ReactNode }) => (
  <Typography variant="body2" sx={{ fontWeight: 700, fontSize: "0.8rem", color: "text.secondary", mt: 3, mb: 1.5 }}>
    {children}
  </Typography>
);

const StatItem = ({ icon, label, value, color }: { icon: React.ReactNode; label: string; value: string; color: string }) => (
  <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
    <Box sx={{ color: "text.secondary", display: "flex", alignItems: "center" }}>{icon}</Box>
    <Box>
      <Typography variant="body2" sx={{ fontSize: "0.75rem", color: "text.secondary" }}>{label}</Typography>
      <Typography variant="body1" sx={{ fontWeight: 700, fontSize: "1rem", color }}>{value}</Typography>
    </Box>
  </Box>
);

export const Dashboard = () => {
  const navigate = useNavigate();
  const theme = useTheme();
  const initialRange = rangeFor("last7");
  const [preset, setPreset] = useState("last7");
  const [startDate, setStartDate] = useState(initialRange.start);
  const [endDate, setEndDate] = useState(initialRange.end);
  const { data, isLoading, isFetching, isError } = useDashboard(startDate, endDate);

  if (isLoading) return <Box sx={{ display: "flex", justifyContent: "center", py: 8 }}><CircularProgress /></Box>;
  if (isError) return <Typography color="error">Unable to load dashboard data.</Typography>;

  const netCash = (data.cash_in || 0) - (data.cash_out || 0);
  const supplierDuesRatio = data.revenue > 0 ? data.supplier_dues / data.revenue : 0;
  const attentionItems: { title: string; detail: string }[] = [];
  if (supplierDuesRatio >= 3) {
    attentionItems.push({
      title: "Supplier dues are high relative to sales",
      detail: `${formatMoney(data.supplier_dues)} owed vs ${formatMoney(data.revenue)} sold this period`,
    });
  }
  if (netCash < 0) {
    attentionItems.push({
      title: "Net cash is negative this period",
      detail: `${formatMoney(netCash)} — cash out exceeded cash in`,
    });
  }

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

  const revenueSparkline = (data.trend || []).slice(-14).map((t: any) => t.revenue || 0);
  const profitSparkline = (data.trend || []).slice(-14).map((t: any) => t.profit || 0);
  const cashSparkline = (data.trend || []).slice(-14).map((t: any) => (t.revenue || 0) - (t.cost || 0));

  const heroCards = [
    {
      label: "Total sales",
      value: formatMoney(data.revenue),
      color: theme.palette.text.primary,
      sparkData: revenueSparkline,
      sparkColor: theme.palette.success.main,
    },
    {
      label: "Profit",
      value: formatMoney(data.profit),
      color: data.profit >= 0 ? theme.palette.success.main : theme.palette.error.main,
      sparkData: profitSparkline,
      sparkColor: data.profit >= 0 ? theme.palette.success.main : theme.palette.error.main,
    },
    {
      label: "Net cash",
      value: formatMoney(netCash),
      color: netCash >= 0 ? theme.palette.success.main : theme.palette.error.main,
      sparkData: cashSparkline,
      sparkColor: netCash >= 0 ? theme.palette.success.main : theme.palette.error.main,
    },
  ];

  return (
    <Box>
      <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 2 }}>
        <Typography variant="h4" sx={{ fontSize: { xs: "1.5rem", sm: "2rem" }, fontWeight: 700 }}>Dashboard</Typography>
        {isFetching && <CircularProgress size={18} />}
      </Box>

      {/* Attention banner */}
      {attentionItems.length > 0 && (
        <Box sx={{ display: "flex", gap: 1.5, flexWrap: "wrap", mb: 2, p: 1.5, borderRadius: 1, bgcolor: "error.light", border: 1, borderColor: "error.main" }}>
          {attentionItems.map((item) => (
            <Box key={item.title} sx={{ minWidth: 220 }}>
              <Typography variant="body2" sx={{ fontWeight: 700, color: "error.main" }}>
                <WarnIcon sx={{ fontSize: "0.9rem", mr: 0.5, verticalAlign: "text-bottom" }} />
                {item.title}
              </Typography>
              <Typography variant="caption" color="text.secondary">{item.detail}</Typography>
            </Box>
          ))}
        </Box>
      )}

      {/* Date range pills */}
      <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mb: 3, flexWrap: "wrap", gap: 1 }}>
        <Stack direction="row" spacing={1}>
          {[
            ["last7", "7D"], ["today", "Today"], ["thisMonth", "This mo"],
            ["lastMonth", "Last mo"], ["thisYear", "This yr"],
          ].map(([value, label]) => (
            <Button key={value} size="small" variant={preset === value ? "contained" : "text"} onClick={() => {
              const range = rangeFor(value);
              setPreset(value);
              setStartDate(range.start);
              setEndDate(range.end);
            }} sx={{
              minWidth: "auto", px: 2, py: 0.5, fontSize: "0.75rem", borderRadius: 20,
              color: preset === value ? "primary.contrastText" : "text.secondary",
              bgcolor: preset === value ? "primary.main" : "transparent",
              "&:hover": { bgcolor: preset === value ? "primary.main" : "action.hover" },
            }}>{label}</Button>
          ))}
        </Stack>
        <Typography variant="body2" sx={{ color: "text.secondary", fontSize: "0.75rem" }}>
          {new Date(startDate).toLocaleDateString("en-IN", { day: "numeric", month: "short" })} - {new Date(endDate).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}
        </Typography>
      </Box>

      {/* Hero KPI row */}
      <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", sm: "repeat(3, 1fr)" }, gap: { xs: 1, sm: 1.5 }, mb: 3 }}>
        {heroCards.map((card) => (
          <Card key={card.label} sx={{ bgcolor: "background.paper", borderColor: "divider" }}>
            <CardContent sx={{ p: { xs: 1.5, sm: 2 }, "&:last-child": { pb: { xs: 1.5, sm: 2 } } }}>
              <Typography variant="body2" sx={{ fontSize: "0.75rem", color: "text.secondary", mb: 1 }}>{card.label}</Typography>
              <Typography variant="h5" sx={{ fontWeight: 700, fontSize: { xs: "1.5rem", sm: "2rem" }, color: card.color, mb: 1 }}>{card.value}</Typography>
              <MiniSparkline data={card.sparkData} color={card.sparkColor} />
            </CardContent>
          </Card>
        ))}
      </Box>

      {/* Sales and suppliers */}
      <SectionLabel>Sales and suppliers</SectionLabel>
      <Box sx={{ display: "grid", gridTemplateColumns: { xs: "repeat(2, 1fr)", sm: "repeat(4, 1fr)" }, gap: { xs: 2, sm: 3 }, mb: 1 }}>
        <StatItem icon={<MoneyIcon />} label="Received" value={formatMoney(data.paid)} color="success.main" />
        <StatItem icon={<PersonIcon />} label="Customer dues" value={formatMoney(data.due)} color="error.main" />
        <StatItem icon={<TruckIcon />} label="Paid to suppliers" value={formatMoney(data.total_paid_suppliers)} color="text.primary" />
        <StatItem icon={<WarnIcon />} label="Supplier dues" value={formatMoney(data.supplier_dues)} color="error.main" />
      </Box>

      {/* Employees and cost */}
      <SectionLabel>Employees and cost</SectionLabel>
      <Box sx={{ display: "grid", gridTemplateColumns: { xs: "repeat(2, 1fr)", sm: "repeat(4, 1fr)" }, gap: { xs: 2, sm: 3 }, mb: 1 }}>
        <StatItem icon={<BankIcon />} label="Paid to employees" value={formatMoney(data.total_paid_employees)} color="text.primary" />
        <StatItem icon={<PersonIcon />} label="Employee dues" value={formatMoney(data.employee_dues)} color="error.main" />
        <StatItem icon={<CartIcon />} label="Cost of goods sold" value={formatMoney(data.cost)} color="text.primary" />
        <StatItem icon={<ReceiptIcon />} label="Margin" value={`${(data.margin_pct || 0).toFixed(1)}%`} color="text.primary" />
      </Box>

      {/* Cash flow this period */}
      <SectionLabel>Cash flow this period</SectionLabel>
      <Box sx={{ display: "grid", gridTemplateColumns: { xs: "repeat(2, 1fr)", sm: "repeat(4, 1fr)" }, gap: { xs: 2, sm: 3 }, mb: 1 }}>
        <StatItem icon={<ArrowDownIcon />} label="Cash in" value={formatMoney(data.cash_in)} color="success.main" />
        <StatItem icon={<ArrowUpIcon />} label="Cash out" value={formatMoney(data.cash_out)} color="error.main" />
      </Box>

      {/* Charts Row */}
      <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", md: "2fr 1fr" }, gap: { xs: 1, sm: 2 }, mt: 2 }}>
        <Card sx={{ bgcolor: "background.paper", borderColor: "divider" }}>
          <CardContent sx={{ p: { xs: 1, sm: 2 }, "&:last-child": { pb: { xs: 1, sm: 2 } } }}>
            <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 700 }}>Sales & Profit Trend</Typography>
            {trendData.length > 0 ? (
              <ResponsiveContainer width="100%" height={220}>
                <LineChart data={trendData} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke={theme.palette.divider} />
                  <XAxis dataKey="date" tick={{ fontSize: 10, fill: theme.palette.text.secondary }} />
                  <YAxis tick={{ fontSize: 10, fill: theme.palette.text.secondary }} />
                  <RechartsTooltip contentStyle={{ borderRadius: 8, border: `1px solid ${theme.palette.divider}`, backgroundColor: theme.palette.background.paper, color: theme.palette.text.primary }} />
                  <Legend wrapperStyle={{ fontSize: 11, color: theme.palette.text.secondary }} />
                  <Line type="monotone" dataKey="Revenue" stroke={theme.palette.primary.main} strokeWidth={2} dot={false} />
                  <Line type="monotone" dataKey="Profit" stroke={theme.palette.success.main} strokeWidth={2} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <Box sx={{ height: 220, display: "flex", alignItems: "center", justifyContent: "center" }}>
                <Typography color="text.secondary" sx={{ fontSize: "0.8rem" }}>No trend data for this period</Typography>
              </Box>
            )}
          </CardContent>
        </Card>

        <Card sx={{ bgcolor: "background.paper", borderColor: "divider" }}>
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
                  <RechartsTooltip formatter={(value: any) => formatMoney(value)} contentStyle={{ borderRadius: 8, border: `1px solid ${theme.palette.divider}`, backgroundColor: theme.palette.background.paper, color: theme.palette.text.primary }} />
                  <Legend wrapperStyle={{ fontSize: 10, color: theme.palette.text.secondary }} />
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
        <Card sx={{ bgcolor: "background.paper", borderColor: "divider" }}>
          <CardContent sx={{ p: { xs: 1, sm: 2 }, "&:last-child": { pb: { xs: 1, sm: 2 } } }}>
            <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 700 }}>Cost vs Sales</Typography>
            {costRevenueData.length > 0 ? (
              <ResponsiveContainer width="100%" height={180}>
                <BarChart data={costRevenueData} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke={theme.palette.divider} />
                  <XAxis dataKey="date" tick={{ fontSize: 10, fill: theme.palette.text.secondary }} />
                  <YAxis tick={{ fontSize: 10, fill: theme.palette.text.secondary }} />
                  <RechartsTooltip contentStyle={{ borderRadius: 8, border: `1px solid ${theme.palette.divider}`, backgroundColor: theme.palette.background.paper, color: theme.palette.text.primary }} />
                  <Legend wrapperStyle={{ fontSize: 11, color: theme.palette.text.secondary }} />
                  <Bar dataKey="Cost" fill={theme.palette.secondary.main} radius={[3, 3, 0, 0]} />
                  <Bar dataKey="Revenue" fill={theme.palette.primary.main} radius={[3, 3, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <Box sx={{ height: 180, display: "flex", alignItems: "center", justifyContent: "center" }}>
                <Typography color="text.secondary" sx={{ fontSize: "0.8rem" }}>No trend data for this period</Typography>
              </Box>
            )}
          </CardContent>
        </Card>

        <Card sx={{ bgcolor: "background.paper", borderColor: "divider" }}>
          <CardContent sx={{ p: { xs: 1, sm: 2 }, "&:last-child": { pb: { xs: 1, sm: 2 } } }}>
            <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 700 }}>Margin % Trend</Typography>
            {marginData.length > 0 ? (
              <ResponsiveContainer width="100%" height={180}>
                <LineChart data={marginData} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke={theme.palette.divider} />
                  <XAxis dataKey="date" tick={{ fontSize: 10, fill: theme.palette.text.secondary }} />
                  <YAxis tick={{ fontSize: 10, fill: theme.palette.text.secondary }} />
                  <RechartsTooltip contentStyle={{ borderRadius: 8, border: `1px solid ${theme.palette.divider}`, backgroundColor: theme.palette.background.paper, color: theme.palette.text.primary }} />
                  <Legend wrapperStyle={{ fontSize: 11, color: theme.palette.text.secondary }} />
                  <Line type="monotone" dataKey="Margin %" stroke={theme.palette.info.main} strokeWidth={2} dot={false} />
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
        <Card sx={{ bgcolor: "background.paper", borderColor: "divider" }}><CardContent sx={{ p: { xs: 1.5, sm: 2 }, "&:last-child": { pb: { xs: 1.5, sm: 2 } } }}>
          <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 700 }}>Operations</Typography>
          <Typography variant="body2" sx={{ fontSize: { xs: "0.75rem", sm: "0.875rem" } }}>Sales: {data.invoice_count} invoices | Paid: {formatMoney(data.paid)}</Typography>
          <Typography variant="body2" sx={{ fontSize: { xs: "0.75rem", sm: "0.875rem" } }}>Production: {data.batch_count} batches, {data.produced_qty} units | Avg cost: {formatMoney(data.avg_batch_cost)}</Typography>
          <Typography variant="body2" sx={{ fontSize: { xs: "0.75rem", sm: "0.875rem" } }}>Ready to pack: {data.ready_to_pack_qty} | Packed: {data.packed_packs} packs</Typography>
          <Typography variant="body2" sx={{ fontSize: { xs: "0.75rem", sm: "0.875rem" } }}>Finished stock: {data.packaged_stock_packs} packs</Typography>
          <Typography variant="body2" sx={{ fontSize: { xs: "0.75rem", sm: "0.875rem" }, color: data.pending_orders_count > 0 ? "warning.main" : "text.secondary", fontWeight: data.pending_orders_count > 0 ? 700 : 400 }}>
            Pending orders: {data.pending_orders_count} {data.order_shortage_count > 0 ? `| ${data.order_shortage_count} units short` : ""}
          </Typography>
          {data.recipe_ops && data.recipe_ops.length > 1 && (
            <Box sx={{ mt: 1.5, borderTop: 1, borderColor: "divider", pt: 1 }}>
              <Typography variant="caption" sx={{ fontWeight: 700, fontSize: "0.68rem", color: "text.secondary", display: "block", mb: 0.5 }}>Per-recipe breakdown</Typography>
              <Box sx={{ overflowX: "auto" }}>
                <Box component="table" sx={{ width: "100%", borderCollapse: "collapse", fontSize: "0.72rem" }}>
                  <Box component="thead" sx={{ "& th": { fontWeight: 700, fontSize: "0.65rem", color: "text.secondary", textAlign: "left", py: 0.5, px: 0.7, borderBottom: 1, borderColor: "divider", whiteSpace: "nowrap" } }}>
                    <Box component="tr"><Box component="th">Recipe</Box><Box component="th" sx={{ textAlign: "right" }}>Batches</Box><Box component="th" sx={{ textAlign: "right" }}>Produced</Box><Box component="th" sx={{ textAlign: "right" }}>Ready</Box><Box component="th" sx={{ textAlign: "right" }}>Packed</Box></Box>
                  </Box>
                  <Box component="tbody" sx={{ "& td": { py: 0.6, px: 0.7, borderBottom: 1, borderColor: "divider", fontSize: "0.72rem" } }}>
                    {data.recipe_ops.map((r: any) => (
                      <Box component="tr" key={r.recipe_id}>
                        <Box component="td" sx={{ fontWeight: 600 }}>{r.recipe_name}</Box>
                        <Box component="td" sx={{ textAlign: "right" }}>{r.batch_count}</Box>
                        <Box component="td" sx={{ textAlign: "right" }}>{r.produced_qty}</Box>
                        <Box component="td" sx={{ textAlign: "right" }}>{r.ready_to_pack_qty}</Box>
                        <Box component="td" sx={{ textAlign: "right" }}>{r.packed_packs}</Box>
                      </Box>
                    ))}
                  </Box>
                </Box>
              </Box>
            </Box>
          )}
        </CardContent></Card>
        <Card sx={{ bgcolor: "background.paper", borderColor: "divider" }}><CardContent sx={{ p: { xs: 1.5, sm: 2 }, "&:last-child": { pb: { xs: 1.5, sm: 2 } } }}>
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
      <Card sx={{ mt: 2, bgcolor: "background.paper", borderColor: "divider" }}>
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
      <Card sx={{ mt: 2, bgcolor: "background.paper", borderColor: "divider" }}>
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
                sx={{ cursor: "pointer", "&:hover": { bgcolor: "action.hover" } }}
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
