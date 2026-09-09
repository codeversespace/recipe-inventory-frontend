import { Alert, Box, Button, Card, CardContent, CircularProgress, Paper, Stack, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Typography, useMediaQuery, useTheme } from "@mui/material";
import ArrowBackRoundedIcon from "@mui/icons-material/ArrowBackRounded";
import { useMemo } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { CartesianGrid, Legend, Line, LineChart, ResponsiveContainer, Tooltip as RechartsTooltip, XAxis, YAxis } from "recharts";
import { useAllSupplierPurchases, useIngredients, useManualStock } from "../hooks/useApi";
import { EmptyState, ErrorState, Money, PageHeader, StatusChip } from "../components/ui";
import { formatMoney } from "../utils/formatNumber";
import { formatShortDate, groupByUnit, purchasesForItem } from "../utils/priceComparison";

const LINE_COLORS = ["#1976d2", "#388e3c", "#f57c00", "#d32f2f", "#7b1fa2", "#00796b"];
const cellSx = { py: 0.75, px: 1, fontSize: { xs: "0.875rem", sm: "0.8rem" } };

const changeLabel = (s: { change: number | null; changePct: number | null; unit: string }) => {
  if (s.change == null) return "No previous purchase";
  if (s.change === 0) return "No change";
  const dir = s.change < 0 ? "↓" : "↑";
  const pct = s.changePct == null ? "" : ` (${Math.abs(s.changePct).toFixed(1)}%)`;
  return `${dir} ₹${Math.abs(s.change).toFixed(2)}/${s.unit}${pct}`;
};

export const PriceComparison = () => {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const itemName = params.get("item") || "";
  const source = params.get("source") === "manual" ? "manual" : "ingredient";
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));

  const { data: purchases = [], isLoading: purchasesLoading, error: purchasesError, refetch } = useAllSupplierPurchases();
  const { data: ingredients = [] } = useIngredients();
  const { data: manualStock = [] } = useManualStock();

  const context = useMemo(() => {
    const ing = ingredients.find((i: any) => i.name === itemName);
    const msi = manualStock.find((m: any) => m.name === itemName);
    const picked = source === "manual" ? msi || ing : ing || msi;
    if (!picked) return null;
    const isIng = picked.base_unit !== undefined;
    return {
      unit: isIng ? picked.base_unit : picked.unit,
      avgCost: isIng ? picked.avg_unit_price : picked.unit_price,
      category: isIng ? picked.category : picked.category,
    };
  }, [ingredients, manualStock, itemName, source]);

  const groups = useMemo(
    () => groupByUnit(purchasesForItem(purchases, itemName)),
    [purchases, itemName],
  );
  const totalPoints = groups.reduce((s, g) => s + g.rows.length, 0);

  if (!itemName) {
    return (
      <Box>
        <PageHeader title="Supplier Price Comparison" />
        <EmptyState title="No item selected." message="Open price comparison from an inventory item." actionLabel="Back to Inventory" onAction={() => navigate("/inventory")} />
      </Box>
    );
  }

  return (
    <Box>
      <Button startIcon={<ArrowBackRoundedIcon />} onClick={() => navigate("/inventory")} sx={{ mb: 1, minHeight: 44 }} aria-label="Back to Inventory">
        Inventory
      </Button>
      <PageHeader
        title={itemName}
        subtitle="Supplier Price Comparison — informational view over existing purchase records."
        actions={
          <Button variant="outlined" onClick={() => navigate(`/purchases?item=${encodeURIComponent(itemName)}`)} sx={{ minHeight: 44 }}>
            Purchase History
          </Button>
        }
      />

      {purchasesLoading ? (
        <Box sx={{ display: "flex", justifyContent: "center", py: 4 }}><CircularProgress /></Box>
      ) : purchasesError ? (
        <ErrorState message={(purchasesError as any).message} onRetry={() => refetch()} />
      ) : groups.length === 0 ? (
        <EmptyState
          title="No purchase history."
          message={`"${itemName}" has no recorded supplier purchases yet. Record one from Purchases to enable comparison.`}
          actionLabel="Go to Purchases"
          onAction={() => navigate("/purchases")}
        />
      ) : (
        <>
          {groups.length > 1 && (
            <Alert severity="info" sx={{ mb: 2 }}>
              Purchased in multiple units ({groups.map((g) => g.unit).join(", ")}). Prices are compared within each unit only.
            </Alert>
          )}
          {groups.map((group) => {
            const supplierNames = group.suppliers.map((s) => s.supplierName);
            const highest = group.suppliers.length > 0
              ? [...group.suppliers].sort((a, b) => b.latest.price - a.latest.price)[0]
              : null;
            const saving = group.best && highest && group.suppliers.length > 1
              ? highest.latest.price - group.best.latest.price
              : 0;
            const chartData = (() => {
              const days = Array.from(new Set(group.rows.map((r) => r.date))).sort();
              return days.map((day) => {
                const point: Record<string, string | number> = { date: day.slice(5) };
                for (const s of group.suppliers) {
                  const buys = s.buys.filter((b) => b.date === day);
                  if (buys.length > 0) point[s.supplierName] = buys[buys.length - 1].price;
                }
                return point;
              });
            })();
            return (
              <Box key={group.unit} sx={{ mb: 3 }}>
                {groups.length > 1 && (
                  <Typography variant="h6" sx={{ fontWeight: 700, mb: 1 }}>Prices per {group.unit}</Typography>
                )}

                {/* Best current price */}
                {group.best && (
                  <Card variant="outlined" sx={{ mb: 2, borderColor: "success.main" }}>
                    <CardContent sx={{ p: 2, "&:last-child": { pb: 2 } }}>
                      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 1, flexWrap: "wrap" }}>
                        <Box>
                          <Typography variant="caption" color="text.secondary" sx={{ fontSize: "0.75rem" }}>BEST CURRENT PRICE</Typography>
                          <Typography variant="h5" sx={{ fontWeight: 700 }} className="tnum">
                            {formatMoney(group.best.latest.price)}<Typography component="span" variant="body2" color="text.secondary">/{group.unit}</Typography>
                          </Typography>
                          <Typography variant="body2" sx={{ fontWeight: 600 }}>{group.best.supplierName}</Typography>
                          {saving > 0 && highest && (
                            <Typography variant="caption" color="text.secondary">
                              ₹{saving.toFixed(2)}/{group.unit} cheaper than highest ({highest.supplierName})
                            </Typography>
                          )}
                        </Box>
                        <StatusChip status="success" label="BEST PRICE" />
                      </Box>
                      <Typography variant="caption" color="text.secondary" sx={{ display: "block", mt: 1 }}>
                        Best means the lowest latest supplier price — i.e. the cheapest supplier to buy from today — not the lowest price ever paid.
                      </Typography>
                      {context && (
                        <Typography variant="caption" color="text.secondary" sx={{ display: "block", mt: 1 }}>
                          Avg. cost <Money value={context.avgCost} />/{context.unit} · Latest <Money value={group.latest?.price} />/{group.unit} · {group.suppliers.length} supplier{group.suppliers.length === 1 ? "" : "s"} · {group.rows.length} purchases
                        </Typography>
                      )}
                    </CardContent>
                  </Card>
                )}

                {/* Suppliers: cards on mobile, table on desktop */}
                <Typography variant="h6" sx={{ fontWeight: 700, fontSize: { xs: "1rem", sm: "1.25rem" }, mb: 1 }}>
                  Suppliers{group.suppliers.length === 1 ? " (only one supplier — no comparison yet)" : ""}
                </Typography>
                <Box sx={{ display: { xs: "block", sm: "none" } }}>
                  <Stack spacing={1.5}>
                    {group.suppliers.map((s) => (
                      <Card key={s.supplierId} variant="outlined" sx={group.best?.supplierId === s.supplierId ? { borderColor: "success.main" } : undefined}>
                        <CardContent sx={{ p: 2, "&:last-child": { pb: 2 } }}>
                          <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 1 }}>
                            <Typography variant="subtitle2" sx={{ fontWeight: 700, fontSize: "0.9375rem" }}>{s.supplierName}</Typography>
                            {group.best?.supplierId === s.supplierId && <StatusChip status="success" label="BEST" />}
                          </Box>
                          <Typography variant="h6" sx={{ fontWeight: 700, mt: 0.5 }} className="tnum">
                            {formatMoney(s.latest.price)}<Typography component="span" variant="body2" color="text.secondary">/{group.unit}</Typography>
                          </Typography>
                          <Typography variant="caption" color="text.secondary" sx={{ display: "block" }}>
                            Last purchase · {formatShortDate(s.latest.date)} · {s.latest.qty} {group.unit}
                          </Typography>
                          <Typography variant="caption" color="text.secondary" sx={{ display: "block" }}>
                            {s.prev ? `Previous ${formatMoney(s.prev.price)}/${group.unit} · ${changeLabel({ ...s, unit: group.unit })}` : "No previous purchase"}
                            {` · ${s.count} purchase${s.count === 1 ? "" : "s"} · avg ${formatMoney(s.avg)}/${group.unit}`}
                          </Typography>
                        </CardContent>
                      </Card>
                    ))}
                  </Stack>
                </Box>
                <Box sx={{ display: { xs: "none", sm: "block" } }}>
                  <TableContainer component={Paper} sx={{ overflowX: "auto", mb: 2 }}>
                    <Table size="small" sx={{ minWidth: 640 }}>
                      <TableHead><TableRow>
                        <TableCell sx={{ ...cellSx, fontWeight: 700 }}>Supplier</TableCell>
                        <TableCell sx={{ ...cellSx, fontWeight: 700 }}>Latest Price</TableCell>
                        <TableCell sx={{ ...cellSx, fontWeight: 700 }}>Previous</TableCell>
                        <TableCell sx={{ ...cellSx, fontWeight: 700 }}>Change</TableCell>
                        <TableCell sx={{ ...cellSx, fontWeight: 700 }}>Last Buy</TableCell>
                        <TableCell sx={{ ...cellSx, fontWeight: 700 }}>Purchases</TableCell>
                      </TableRow></TableHead>
                      <TableBody>
                        {group.suppliers.map((s) => (
                          <TableRow key={s.supplierId} sx={group.best?.supplierId === s.supplierId ? { bgcolor: "success.50" } : undefined}>
                            <TableCell sx={cellSx}>
                              <Box sx={{ display: "flex", alignItems: "center", gap: 1, fontWeight: 600 }}>
                                {s.supplierName}
                                {group.best?.supplierId === s.supplierId && <StatusChip status="success" label="BEST" />}
                              </Box>
                            </TableCell>
                            <TableCell sx={{ ...cellSx, fontWeight: 700 }} className="tnum">{formatMoney(s.latest.price)}/{group.unit}</TableCell>
                            <TableCell sx={cellSx} className="tnum">{s.prev ? `${formatMoney(s.prev.price)}/${group.unit}` : "—"}</TableCell>
                            <TableCell sx={cellSx}>{s.change == null ? "No previous purchase" : s.change === 0 ? "No change" : changeLabel({ ...s, unit: group.unit })}</TableCell>
                            <TableCell sx={cellSx}>{formatShortDate(s.latest.date)} · {s.latest.qty} {group.unit}</TableCell>
                            <TableCell sx={cellSx} className="tnum">{s.count} · avg {formatMoney(s.avg)}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>
                </Box>

                {/* Price history chart */}
                <Typography variant="h6" sx={{ fontWeight: 700, fontSize: { xs: "1rem", sm: "1.25rem" }, mb: 1, mt: 2 }}>Price History</Typography>
                {totalPoints < 2 || supplierNames.length === 0 ? (
                  <EmptyState title="Not enough history to chart." message="At least two purchases are needed for a price trend." />
                ) : (
                  <Paper sx={{ p: { xs: 1, sm: 2 }, overflowX: "auto" }}>
                    <ResponsiveContainer width="100%" height={isMobile ? 200 : 240} minWidth={280}>
                      <LineChart data={chartData} margin={{ top: 8, right: 12, left: 0, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                        <YAxis tick={{ fontSize: 11 }} domain={["auto", "auto"]} tickFormatter={(v: number) => `₹${v}`} />
                        <RechartsTooltip formatter={(value: any, name: any) => [`₹${Number(value).toFixed(2)}/${group.unit}`, name]} />
                        <Legend wrapperStyle={{ fontSize: 12 }} />
                        {supplierNames.map((name, i) => (
                          <Line key={name} type="monotone" dataKey={name} stroke={LINE_COLORS[i % LINE_COLORS.length]} strokeWidth={2} dot={{ r: 3 }} connectNulls />
                        ))}
                      </LineChart>
                    </ResponsiveContainer>
                  </Paper>
                )}

                {/* Purchase history */}
                <Typography variant="h6" sx={{ fontWeight: 700, fontSize: { xs: "1rem", sm: "1.25rem" }, mb: 1, mt: 2 }}>Purchase History</Typography>
                <TableContainer component={Paper} sx={{ overflowX: "auto" }}>
                  <Table size="small" sx={{ minWidth: 560 }}>
                    <TableHead><TableRow>
                      <TableCell sx={{ ...cellSx, fontWeight: 700 }}>Date</TableCell>
                      <TableCell sx={{ ...cellSx, fontWeight: 700 }}>Supplier</TableCell>
                      <TableCell sx={{ ...cellSx, fontWeight: 700 }}>Qty</TableCell>
                      <TableCell sx={{ ...cellSx, fontWeight: 700 }}>Unit</TableCell>
                      <TableCell sx={{ ...cellSx, fontWeight: 700 }}>Price</TableCell>
                      <TableCell sx={{ ...cellSx, fontWeight: 700 }}>Total</TableCell>
                      <TableCell sx={{ ...cellSx, fontWeight: 700 }}>Reference</TableCell>
                    </TableRow></TableHead>
                    <TableBody>
                      {[...group.rows].reverse().map((r) => (
                        <TableRow key={r.purchaseId} hover>
                          <TableCell sx={cellSx}>{formatShortDate(r.date)}</TableCell>
                          <TableCell sx={{ ...cellSx, fontWeight: 600 }}>{r.supplierName}</TableCell>
                          <TableCell sx={cellSx} className="tnum">{r.qty}</TableCell>
                          <TableCell sx={cellSx}>{r.unit}</TableCell>
                          <TableCell sx={cellSx} className="tnum">{formatMoney(r.price)}</TableCell>
                          <TableCell sx={cellSx} className="tnum">{formatMoney(r.total)}</TableCell>
                          <TableCell sx={cellSx}>{r.reference || "—"}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              </Box>
            );
          })}
        </>
      )}
    </Box>
  );
};
