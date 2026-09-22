import {
  Box, Button, Card, CardContent, CircularProgress, Stack,
  Typography, Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  Tabs, Tab, useTheme, useMediaQuery,
} from "@mui/material";
import {
  AttachMoney as MoneyIcon,
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
import { InfoTip } from "../components/ui";
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

interface CardInfo {
  title: string;
  description: string;
  example: string;
}

const CARD_INFO: Record<string, CardInfo> = {
  "Total sales": {
    title: "Total sales",
    description: "Total billed amount of all sales in the selected period, including unpaid dues.",
    example: "A ₹24,000 sale on 21 Sep counts as ₹24,000 on that date even if the customer hasn't paid yet.",
  },
  "Profit": {
    title: "Profit",
    description: "Sales revenue minus cost of goods sold (ingredients + packaging of items sold). Supplier and staff payments are not subtracted here.",
    example: "Sold ₹1,000 of goods that cost ₹600 to make → ₹400 profit.",
  },
  "Net cash": {
    title: "Net cash",
    description: "Cash received from customers minus cash paid to suppliers and employees in the period.",
    example: "−₹5,000 means more cash went out than came in this period.",
  },
  "Received": {
    title: "Received",
    description: "Cash actually collected from customers against this period's sales.",
    example: "₹24,000 sale with ₹10,000 paid → ₹10,000 received and ₹14,000 dues.",
  },
  "Customer dues": {
    title: "Customer dues",
    description: "Unpaid balance on this period's sales (billed minus paid).",
    example: "₹24,000 billed, ₹10,000 paid → ₹14,000 still due.",
  },
  "Paid to suppliers": {
    title: "Paid to suppliers",
    description: "Supplier payments made in the period, regardless of when the goods arrived.",
    example: "Paid ₹8,000 on 5 Sep for August stock → counts on 5 Sep.",
  },
  "Supplier dues": {
    title: "Supplier dues",
    description: "All-time outstanding to suppliers: total purchases minus total payments (never below zero).",
    example: "Purchased ₹1,00,000 so far, paid ₹70,000 → ₹30,000 dues.",
  },
  "Paid to employees": {
    title: "Paid to employees",
    description: "Staff and processor payments made in the period.",
    example: "Weekly wages of ₹5,000 paid on Saturday count on that date.",
  },
  "Employee dues": {
    title: "Employee dues",
    description: "All-time outstanding wages: labour and processing work earned minus payments made.",
    example: "Earned ₹20,000, paid ₹15,000 → ₹5,000 dues.",
  },
  "Cost of goods sold": {
    title: "Cost of goods sold",
    description: "Ingredient + packaging cost of only the items sold in the period.",
    example: "Sold 10 packs costing ₹60 each to make → ₹600 cost of goods sold.",
  },
  "COGS": {
    title: "Cost of goods sold",
    description: "Ingredient + packaging cost of only the items sold in the period.",
    example: "Sold 10 packs costing ₹60 each to make → ₹600 cost of goods sold.",
  },
  "Margin": {
    title: "Margin",
    description: "Profit ÷ revenue × 100 for the period.",
    example: "₹400 profit on ₹1,000 sales → 40% margin.",
  },
  "Cash in": {
    title: "Cash in",
    description: "Customer payments collected in the period.",
    example: "Three customers paid ₹5,000 each this week → ₹15,000 cash in.",
  },
  "Cash out": {
    title: "Cash out",
    description: "Supplier + employee payments made in the period.",
    example: "₹8,000 to suppliers + ₹2,000 to staff = ₹10,000 cash out.",
  },
  "Damage loss": {
    title: "Damage loss",
    description: "Cost value of stock marked damaged, spoilt, burnt or expired in the period (Damage & Loss ledger).",
    example: "10 kg almonds @ ₹100/kg spoilt → ₹1,000 loss.",
  },
  "Damage events": {
    title: "Damage events",
    description: "Number of damage / wastage entries recorded in the period.",
    example: "3 spoilage + 1 breakage entries → 4 events. Open Damage & Loss for details.",
  },
  "Sales & Profit Trend": {
    title: "Sales & Profit Trend",
    description: "Daily revenue and profit lines for the period — one point per day.",
    example: "A dip to zero on Sunday shows a no-sales day.",
  },
  "Sales by Product": {
    title: "Sales by Product",
    description: "Revenue share of the top 6 products in the period.",
    example: "The biggest slice is your best-selling product by revenue.",
  },
  "Cost vs Sales": {
    title: "Cost vs Sales",
    description: "Daily bars comparing goods cost against sales revenue.",
    example: "Bars of equal height on a day mean zero profit that day.",
  },
  "Margin % Trend": {
    title: "Margin % Trend",
    description: "Daily profit-margin percentage line for the period.",
    example: "A falling line means discounts or costlier batches that week.",
  },
  "Operations": {
    title: "Operations",
    description: "Period counts: invoices raised, batches produced, packable stock left, packs packed, finished packs in stock, and pending orders with shortages.",
    example: "Ready to pack 50 kg with 2 pending orders short by 10 units → produce more.",
  },
  "Alerts": {
    title: "Alerts",
    description: "Live counts (not limited to the period): low or out-of-stock items and packed products missing a selling price.",
    example: "Low stock 3 → three items at or below their reorder level.",
  },
  "Top Products": {
    title: "Top Products",
    description: "Top 5 products by revenue in the period, with quantity, revenue and estimated profit.",
    example: "Date Bites: 120 units, ₹12,000 revenue, ₹4,000 profit.",
  },
  "Top Customers": {
    title: "Top Customers",
    description: "Top customers by revenue in the period. Tap a row to open their profile.",
    example: "Ayesha Khan: ₹24,000 revenue, ₹6,000 profit.",
  },
};

const StatItem = ({ icon, label, value, color, info }: { icon: React.ReactNode; label: string; value: string; color: string; info?: CardInfo }) => (
  <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
    <Box sx={{ color: "text.secondary", display: "flex", alignItems: "center" }}>{icon}</Box>
    <Box sx={{ minWidth: 0 }}>
      <Typography variant="body2" sx={{ fontSize: "0.75rem", color: "text.secondary" }}>{label}{info && <InfoTip title={info.title} description={info.description} example={info.example} />}</Typography>
      <Typography variant="body1" sx={{ fontWeight: 700, fontSize: "1rem", color }}>{value}</Typography>
    </Box>
  </Box>
);

/** Section/card title row with a tap-friendly info button. */
const TitleWithInfo = ({ title, infoKey, variant = "subtitle2", sx }: { title: string; infoKey: string; variant?: "subtitle2" | "body2" | "h6"; sx?: Record<string, unknown> }) => {
  const info = CARD_INFO[infoKey];
  return (
    <Box sx={{ display: "flex", alignItems: "center", mb: 1 }}>
      <Typography variant={variant} sx={{ fontWeight: 700, ...(sx || {}) }}>{title}</Typography>
      {info && <InfoTip title={info.title} description={info.description} example={info.example} />}
    </Box>
  );
};

export const Dashboard = () => {
  const navigate = useNavigate();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));
  const [mobileTab, setMobileTab] = useState(0);
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
      info: CARD_INFO["Total sales"],
    },
    {
      label: "Profit",
      value: formatMoney(data.profit),
      color: data.profit >= 0 ? theme.palette.success.main : theme.palette.error.main,
      sparkData: profitSparkline,
      sparkColor: data.profit >= 0 ? theme.palette.success.main : theme.palette.error.main,
      info: CARD_INFO["Profit"],
    },
    {
      label: "Net cash",
      value: formatMoney(netCash),
      color: netCash >= 0 ? theme.palette.success.main : theme.palette.error.main,
      sparkData: cashSparkline,
      sparkColor: netCash >= 0 ? theme.palette.success.main : theme.palette.error.main,
      info: CARD_INFO["Net cash"],
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

      {/* Hero KPI row — compact on mobile, full cards with sparklines on desktop */}
      {isMobile ? (
        <Box sx={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 1, mb: 2 }}>
          {heroCards.map((card) => (
            <Box key={card.label} sx={{ textAlign: "center" }}>
              <Typography variant="caption" sx={{ fontSize: "0.65rem", color: "text.secondary", display: "block" }}>{card.label}<InfoTip title={card.info.title} description={card.info.description} example={card.info.example} /></Typography>
              <Typography variant="subtitle1" sx={{ fontWeight: 700, fontSize: "0.95rem", color: card.color }}>{card.value}</Typography>
            </Box>
          ))}
        </Box>
      ) : (
        <Box sx={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 1.5, mb: 3 }}>
          {heroCards.map((card) => (
            <Card key={card.label} sx={{ bgcolor: "background.paper", borderColor: "divider" }}>
              <CardContent sx={{ p: 2, "&:last-child": { pb: 2 } }}>
                <Typography variant="body2" sx={{ fontSize: "0.75rem", color: "text.secondary", mb: 1 }}>{card.label}<InfoTip title={card.info.title} description={card.info.description} example={card.info.example} /></Typography>
                <Typography variant="h5" sx={{ fontWeight: 700, fontSize: "2rem", color: card.color, mb: 1 }}>{card.value}</Typography>
                <MiniSparkline data={card.sparkData} color={card.sparkColor} />
              </CardContent>
            </Card>
          ))}
        </Box>
      )}

      {/* Mobile tabs */}
      {isMobile && (
        <Tabs value={mobileTab} onChange={(_, v) => setMobileTab(v)} variant="fullWidth" sx={{ mb: 2, minHeight: 36, "& .MuiTab-root": { minHeight: 36, fontSize: "0.75rem", fontWeight: 600, textTransform: "none" } }}>
          <Tab label="Overview" />
          <Tab label="Trends" />
          <Tab label="Breakdown" />
          <Tab label="Top lists" />
        </Tabs>
      )}

      {/* === DESKTOP: all sections visible === */}
      {!isMobile && (<>
        {/* Sales and suppliers */}
        <SectionLabel>Sales and suppliers</SectionLabel>
        <Box sx={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 3, mb: 1 }}>
          <StatItem icon={<MoneyIcon />} label="Received" value={formatMoney(data.paid)} color="success.main" info={CARD_INFO["Received"]} />
          <StatItem icon={<PersonIcon />} label="Customer dues" value={formatMoney(data.due)} color="error.main" info={CARD_INFO["Customer dues"]} />
          <StatItem icon={<TruckIcon />} label="Paid to suppliers" value={formatMoney(data.total_paid_suppliers)} color="text.primary" info={CARD_INFO["Paid to suppliers"]} />
          <StatItem icon={<WarnIcon />} label="Supplier dues" value={formatMoney(data.supplier_dues)} color="error.main" info={CARD_INFO["Supplier dues"]} />
        </Box>

        {/* Employees and cost */}
        <SectionLabel>Employees and cost</SectionLabel>
        <Box sx={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 3, mb: 1 }}>
          <StatItem icon={<BankIcon />} label="Paid to employees" value={formatMoney(data.total_paid_employees)} color="text.primary" info={CARD_INFO["Paid to employees"]} />
          <StatItem icon={<PersonIcon />} label="Employee dues" value={formatMoney(data.employee_dues)} color="error.main" info={CARD_INFO["Employee dues"]} />
          <StatItem icon={<CartIcon />} label="Cost of goods sold" value={formatMoney(data.cost)} color="text.primary" info={CARD_INFO["Cost of goods sold"]} />
          <StatItem icon={<ReceiptIcon />} label="Margin" value={`${(data.margin_pct || 0).toFixed(1)}%`} color="text.primary" info={CARD_INFO["Margin"]} />
        </Box>

        {/* Cash flow this period */}
        <SectionLabel>Cash flow this period</SectionLabel>
        <Box sx={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 3, mb: 1 }}>
          <StatItem icon={<ArrowDownIcon />} label="Cash in" value={formatMoney(data.cash_in)} color="success.main" info={CARD_INFO["Cash in"]} />
          <StatItem icon={<ArrowUpIcon />} label="Cash out" value={formatMoney(data.cash_out)} color="error.main" info={CARD_INFO["Cash out"]} />
        </Box>

        {/* Loss & wastage this period */}
        <SectionLabel>Loss &amp; wastage this period</SectionLabel>
        <Box sx={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 3, mb: 1 }}>
          <Box onClick={() => navigate("/damage-loss")} sx={{ cursor: "pointer" }} title="Open Damage & Loss ledger">
            <StatItem icon={<WarnIcon />} label="Damage loss" value={formatMoney(data.damage_loss || 0)} color="error.main" info={CARD_INFO["Damage loss"]} />
          </Box>
          <Box onClick={() => navigate("/damage-loss")} sx={{ cursor: "pointer" }} title="Open Damage & Loss ledger">
            <StatItem icon={<ReceiptIcon />} label="Damage events" value={String(data.damage_events || 0)} color="text.primary" info={CARD_INFO["Damage events"]} />
          </Box>
        </Box>

        {/* Charts Row */}
        <Box sx={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: 2, mt: 2 }}>
          <Card sx={{ bgcolor: "background.paper", borderColor: "divider" }}>
            <CardContent sx={{ p: 2, "&:last-child": { pb: 2 } }}>
              <TitleWithInfo title="Sales & Profit Trend" infoKey="Sales & Profit Trend" />
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
            <CardContent sx={{ p: 2, "&:last-child": { pb: 2 } }}>
              <TitleWithInfo title="Sales by Product" infoKey="Sales by Product" />
              {productData.length > 0 ? (
                <ResponsiveContainer width="100%" height={220}>
                  <PieChart>
                    <Pie data={productData} cx="50%" cy="50%" innerRadius={50} outerRadius={80} paddingAngle={2} dataKey="value" labelLine={false} label={false}>
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
        <Box sx={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 2, mt: 2 }}>
          <Card sx={{ bgcolor: "background.paper", borderColor: "divider" }}>
            <CardContent sx={{ p: 2, "&:last-child": { pb: 2 } }}>
              <TitleWithInfo title="Cost vs Sales" infoKey="Cost vs Sales" />
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
            <CardContent sx={{ p: 2, "&:last-child": { pb: 2 } }}>
              <TitleWithInfo title="Margin % Trend" infoKey="Margin % Trend" />
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
        <Box sx={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 2, mt: 2 }}>
          <Card sx={{ bgcolor: "background.paper", borderColor: "divider" }}><CardContent sx={{ p: 2, "&:last-child": { pb: 2 } }}>
            <TitleWithInfo title="Operations" infoKey="Operations" />
            <Typography variant="body2">Sales: {data.invoice_count} invoices | Paid: {formatMoney(data.paid)}</Typography>
            <Typography variant="body2">Production: {data.batch_count} batches, {data.produced_qty} units | Avg cost: {formatMoney(data.avg_batch_cost)}</Typography>
            <Typography variant="body2">Ready to pack: {data.ready_to_pack_qty} | Packed: {data.packed_packs} packs</Typography>
            <Typography variant="body2">Finished stock: {data.packaged_stock_packs} packs</Typography>
            <Typography variant="body2" sx={{ color: data.pending_orders_count > 0 ? "warning.main" : "text.secondary", fontWeight: data.pending_orders_count > 0 ? 700 : 400 }}>
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
          <Card sx={{ bgcolor: "background.paper", borderColor: "divider" }}><CardContent sx={{ p: 2, "&:last-child": { pb: 2 } }}>
            <TitleWithInfo title="Alerts" infoKey="Alerts" />
            <Typography variant="body2">Low stock: {data.low_stock_count} | Out of stock: {data.out_of_stock_count}</Typography>
            <Typography variant="body2">Missing selling price: {data.missing_price_count}</Typography>
            {data.alerts?.slice(0, 3).map((alert: any) => (
              <Typography variant="caption" key={`${alert.category}-${alert.name}`} sx={{ display: "block", fontSize: "0.7rem" }}>
                {alert.category}: {alert.name} ({alert.quantity} {alert.unit})
              </Typography>
            ))}
          </CardContent></Card>
        </Box>

        {/* Top Products Table */}
        <Card sx={{ mt: 2, bgcolor: "background.paper", borderColor: "divider" }}>
          <CardContent sx={{ p: 2, "&:last-child": { pb: 2 } }}>
            <TitleWithInfo title="Top Products" infoKey="Top Products" />
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
          <CardContent sx={{ p: 2, "&:last-child": { pb: 2 } }}>
            <TitleWithInfo title="Top Customers" infoKey="Top Customers" />
            <TableContainer sx={{ overflowX: "auto" }}><Table size="small"><TableHead><TableRow>
              <TableCell sx={{ py: 0.5, px: 1, fontSize: "0.7rem", fontWeight: 700 }}>Customer</TableCell>
              <TableCell sx={{ py: 0.5, px: 1, fontSize: "0.7rem", fontWeight: 700 }}>Revenue</TableCell>
              <TableCell sx={{ py: 0.5, px: 1, fontSize: "0.7rem", fontWeight: 700 }}>Cost</TableCell>
              <TableCell sx={{ py: 0.5, px: 1, fontSize: "0.7rem", fontWeight: 700 }}>Profit</TableCell>
            </TableRow></TableHead><TableBody>
              {(data.top_customers || []).slice(0, 8).map((customer: any) => (
                <TableRow key={customer.customer_id} hover sx={{ cursor: "pointer", "&:hover": { bgcolor: "action.hover" } }} onClick={() => navigate(`/customers/${customer.customer_id}`)}>
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
      </>)}

      {/* === MOBILE: tab-based rendering === */}
      {isMobile && mobileTab === 0 && (<>
        <SectionLabel>Sales and suppliers</SectionLabel>
        <Box sx={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 2, mb: 1 }}>
          <StatItem icon={<MoneyIcon />} label="Received" value={formatMoney(data.paid)} color="success.main" info={CARD_INFO["Received"]} />
          <StatItem icon={<PersonIcon />} label="Customer dues" value={formatMoney(data.due)} color="error.main" info={CARD_INFO["Customer dues"]} />
          <StatItem icon={<TruckIcon />} label="Paid to suppliers" value={formatMoney(data.total_paid_suppliers)} color="text.primary" info={CARD_INFO["Paid to suppliers"]} />
          <StatItem icon={<WarnIcon />} label="Supplier dues" value={formatMoney(data.supplier_dues)} color="error.main" info={CARD_INFO["Supplier dues"]} />
        </Box>
        <SectionLabel>Employees and cost</SectionLabel>
        <Box sx={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 2, mb: 1 }}>
          <StatItem icon={<BankIcon />} label="Paid to employees" value={formatMoney(data.total_paid_employees)} color="text.primary" info={CARD_INFO["Paid to employees"]} />
          <StatItem icon={<PersonIcon />} label="Employee dues" value={formatMoney(data.employee_dues)} color="error.main" info={CARD_INFO["Employee dues"]} />
          <StatItem icon={<CartIcon />} label="COGS" value={formatMoney(data.cost)} color="text.primary" info={CARD_INFO["COGS"]} />
          <StatItem icon={<ReceiptIcon />} label="Margin" value={`${(data.margin_pct || 0).toFixed(1)}%`} color="text.primary" info={CARD_INFO["Margin"]} />
        </Box>
        <SectionLabel>Cash flow</SectionLabel>
        <Box sx={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 2, mb: 1 }}>
          <StatItem icon={<ArrowDownIcon />} label="Cash in" value={formatMoney(data.cash_in)} color="success.main" info={CARD_INFO["Cash in"]} />
          <StatItem icon={<ArrowUpIcon />} label="Cash out" value={formatMoney(data.cash_out)} color="error.main" info={CARD_INFO["Cash out"]} />
        </Box>
        <SectionLabel>Loss &amp; wastage</SectionLabel>
        <Box sx={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 2, mb: 1 }}>
          <Box onClick={() => navigate("/damage-loss")} sx={{ cursor: "pointer" }} title="Open Damage & Loss ledger">
            <StatItem icon={<WarnIcon />} label="Damage loss" value={formatMoney(data.damage_loss || 0)} color="error.main" info={CARD_INFO["Damage loss"]} />
          </Box>
          <Box onClick={() => navigate("/damage-loss")} sx={{ cursor: "pointer" }} title="Open Damage & Loss ledger">
            <StatItem icon={<ReceiptIcon />} label="Damage events" value={String(data.damage_events || 0)} color="text.primary" info={CARD_INFO["Damage events"]} />
          </Box>
        </Box>
        <SectionLabel>Operations</SectionLabel>
        <Box sx={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 2 }}>
          <StatItem icon={<CartIcon />} label="Invoices" value={String(data.invoice_count)} color="text.primary" />
          <StatItem icon={<ReceiptIcon />} label="Batches" value={String(data.batch_count)} color="text.primary" />
          <StatItem icon={<TruckIcon />} label="Ready to pack" value={String(data.ready_to_pack_qty)} color="text.primary" />
          <StatItem icon={<TruckIcon />} label="Packed" value={String(data.packed_packs)} color="text.primary" />
        </Box>
        {data.pending_orders_count > 0 && (
          <Box sx={{ mt: 1.5, p: 1, borderRadius: 1, bgcolor: "warning.light" }}>
            <Typography variant="caption" sx={{ fontWeight: 700, color: "warning.main" }}>
              {data.pending_orders_count} pending orders{data.order_shortage_count > 0 ? `, ${data.order_shortage_count} units short` : ""}
            </Typography>
          </Box>
        )}
      </>)}

      {isMobile && mobileTab === 1 && (<>
        <Card sx={{ bgcolor: "background.paper", borderColor: "divider", mb: 1.5 }}>
          <CardContent sx={{ p: 1.5, "&:last-child": { pb: 1.5 } }}>
            <TitleWithInfo title="Sales & Profit Trend" infoKey="Sales & Profit Trend" sx={{ fontSize: "0.8rem" }} />
            {trendData.length > 0 ? (
              <ResponsiveContainer width="100%" height={200}>
                <LineChart data={trendData} margin={{ top: 5, right: 5, left: 0, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke={theme.palette.divider} />
                  <XAxis dataKey="date" tick={{ fontSize: 9, fill: theme.palette.text.secondary }} />
                  <YAxis tick={{ fontSize: 9, fill: theme.palette.text.secondary }} />
                  <RechartsTooltip contentStyle={{ borderRadius: 8, border: `1px solid ${theme.palette.divider}`, backgroundColor: theme.palette.background.paper, color: theme.palette.text.primary, fontSize: 11 }} />
                  <Legend wrapperStyle={{ fontSize: 10, color: theme.palette.text.secondary }} />
                  <Line type="monotone" dataKey="Revenue" stroke={theme.palette.primary.main} strokeWidth={2} dot={false} />
                  <Line type="monotone" dataKey="Profit" stroke={theme.palette.success.main} strokeWidth={2} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            ) : <Box sx={{ height: 120, display: "flex", alignItems: "center", justifyContent: "center" }}><Typography color="text.secondary" sx={{ fontSize: "0.75rem" }}>No data</Typography></Box>}
          </CardContent>
        </Card>
        <Card sx={{ bgcolor: "background.paper", borderColor: "divider", mb: 1.5 }}>
          <CardContent sx={{ p: 1.5, "&:last-child": { pb: 1.5 } }}>
            <TitleWithInfo title="Cost vs Sales" infoKey="Cost vs Sales" sx={{ fontSize: "0.8rem" }} />
            {costRevenueData.length > 0 ? (
              <ResponsiveContainer width="100%" height={160}>
                <BarChart data={costRevenueData} margin={{ top: 5, right: 5, left: 0, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke={theme.palette.divider} />
                  <XAxis dataKey="date" tick={{ fontSize: 9, fill: theme.palette.text.secondary }} />
                  <YAxis tick={{ fontSize: 9, fill: theme.palette.text.secondary }} />
                  <RechartsTooltip contentStyle={{ borderRadius: 8, border: `1px solid ${theme.palette.divider}`, backgroundColor: theme.palette.background.paper, color: theme.palette.text.primary, fontSize: 11 }} />
                  <Legend wrapperStyle={{ fontSize: 10, color: theme.palette.text.secondary }} />
                  <Bar dataKey="Cost" fill={theme.palette.secondary.main} radius={[3, 3, 0, 0]} />
                  <Bar dataKey="Revenue" fill={theme.palette.primary.main} radius={[3, 3, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : <Box sx={{ height: 120, display: "flex", alignItems: "center", justifyContent: "center" }}><Typography color="text.secondary" sx={{ fontSize: "0.75rem" }}>No data</Typography></Box>}
          </CardContent>
        </Card>
        <Card sx={{ bgcolor: "background.paper", borderColor: "divider" }}>
          <CardContent sx={{ p: 1.5, "&:last-child": { pb: 1.5 } }}>
            <TitleWithInfo title="Margin % Trend" infoKey="Margin % Trend" sx={{ fontSize: "0.8rem" }} />
            {marginData.length > 0 ? (
              <ResponsiveContainer width="100%" height={160}>
                <LineChart data={marginData} margin={{ top: 5, right: 5, left: 0, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke={theme.palette.divider} />
                  <XAxis dataKey="date" tick={{ fontSize: 9, fill: theme.palette.text.secondary }} />
                  <YAxis tick={{ fontSize: 9, fill: theme.palette.text.secondary }} />
                  <RechartsTooltip contentStyle={{ borderRadius: 8, border: `1px solid ${theme.palette.divider}`, backgroundColor: theme.palette.background.paper, color: theme.palette.text.primary, fontSize: 11 }} />
                  <Legend wrapperStyle={{ fontSize: 10, color: theme.palette.text.secondary }} />
                  <Line type="monotone" dataKey="Margin %" stroke={theme.palette.info.main} strokeWidth={2} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            ) : <Box sx={{ height: 120, display: "flex", alignItems: "center", justifyContent: "center" }}><Typography color="text.secondary" sx={{ fontSize: "0.75rem" }}>No data</Typography></Box>}
          </CardContent>
        </Card>
      </>)}

      {isMobile && mobileTab === 2 && (
        <Card sx={{ bgcolor: "background.paper", borderColor: "divider" }}>
          <CardContent sx={{ p: 1.5, "&:last-child": { pb: 1.5 } }}>
            <TitleWithInfo title="Sales by Product" infoKey="Sales by Product" sx={{ fontSize: "0.8rem" }} />
            {productData.length > 0 ? (
              <ResponsiveContainer width="100%" height={240}>
                <PieChart>
                  <Pie data={productData} cx="50%" cy="50%" innerRadius={45} outerRadius={75} paddingAngle={2} dataKey="value" labelLine={false} label={false}>
                    {productData.map((entry: any, index: number) => (
                      <Cell key={`cell-${index}`} fill={entry.fill} />
                    ))}
                  </Pie>
                  <RechartsTooltip formatter={(value: any) => formatMoney(value)} contentStyle={{ borderRadius: 8, border: `1px solid ${theme.palette.divider}`, backgroundColor: theme.palette.background.paper, color: theme.palette.text.primary, fontSize: 11 }} />
                  <Legend wrapperStyle={{ fontSize: 10, color: theme.palette.text.secondary }} />
                </PieChart>
              </ResponsiveContainer>
            ) : <Box sx={{ height: 160, display: "flex", alignItems: "center", justifyContent: "center" }}><Typography color="text.secondary" sx={{ fontSize: "0.75rem" }}>No product data yet</Typography></Box>}
          </CardContent>
        </Card>
      )}

      {isMobile && mobileTab === 3 && (<>
        <Card sx={{ bgcolor: "background.paper", borderColor: "divider", mb: 1.5 }}>
          <CardContent sx={{ p: 1.5, "&:last-child": { pb: 1.5 } }}>
            <TitleWithInfo title="Top Products" infoKey="Top Products" sx={{ fontSize: "0.8rem" }} />
            {data.top_products?.slice(0, 5).map((product: any) => (
              <Box key={product.name} sx={{ display: "flex", justifyContent: "space-between", py: 0.75, borderBottom: "1px solid", borderColor: "divider" }}>
                <Box>
                  <Typography variant="body2" sx={{ fontWeight: 600, fontSize: "0.8rem" }}>{product.name}</Typography>
                  <Typography variant="caption" color="text.secondary">{product.quantity} units</Typography>
                </Box>
                <Typography variant="body2" sx={{ fontWeight: 700, fontSize: "0.8rem" }}>{formatMoney(product.revenue)}</Typography>
              </Box>
            ))}
          </CardContent>
        </Card>
        <Card sx={{ bgcolor: "background.paper", borderColor: "divider" }}>
          <CardContent sx={{ p: 1.5, "&:last-child": { pb: 1.5 } }}>
            <TitleWithInfo title="Top Customers" infoKey="Top Customers" sx={{ fontSize: "0.8rem" }} />
            {(data.top_customers || []).slice(0, 5).map((customer: any) => (
              <Box key={customer.customer_id} sx={{ display: "flex", justifyContent: "space-between", py: 0.75, borderBottom: "1px solid", borderColor: "divider", cursor: "pointer" }} onClick={() => navigate(`/customers/${customer.customer_id}`)}>
                <Box>
                  <Typography variant="body2" sx={{ fontWeight: 600, fontSize: "0.8rem" }}>{customer.name}</Typography>
                  <Typography variant="caption" color="text.secondary">{formatMoney(customer.revenue)} revenue</Typography>
                </Box>
                <Typography variant="body2" sx={{ fontWeight: 700, fontSize: "0.8rem", color: customer.profit >= 0 ? "success.main" : "error.main" }}>{formatMoney(customer.profit)}</Typography>
              </Box>
            ))}
          </CardContent>
        </Card>
      </>)}
    </Box>
  );
};
