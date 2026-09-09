import { Alert, Box, Button, Card, CardContent, CircularProgress, Collapse, IconButton, Paper, Stack, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Typography, useMediaQuery, useTheme } from "@mui/material";
import ExpandMoreRoundedIcon from "@mui/icons-material/ExpandMoreRounded";
import ExpandLessRoundedIcon from "@mui/icons-material/ExpandLessRounded";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useInventory, useOrderDemand, useSaleableStock, usePackingMaterials, useAllSupplierPurchases, useBatches, useDeleteIngredient, useDeleteManualStockItem, useDeleteStockItem } from "../hooks/useApi";
import { DeleteButton, EmptyState, ErrorState, Money, PageHeader, StatusChip, TableSkeleton } from "../components/ui";
import { groupByUnit, purchasesForItem } from "../utils/priceComparison";
import { formatDate } from "../utils/formatDate";

const cellSx = { py: 0.75, px: 1, fontSize: { xs: "0.875rem", sm: "0.8rem" } };

const formatError = (e: unknown) =>
  (e as any)?.response?.data?.detail || "Could not delete item.";

export const Inventory = () => {
  const { data: saleableStock = [], isLoading, error, refetch: refetchSaleable } = useSaleableStock();
  const { data: rawMaterials = [], isLoading: rawMaterialsLoading, error: rawMaterialsError, refetch: refetchRaw } = useInventory();
  const { data: orderDemand = [], isLoading: orderDemandLoading } = useOrderDemand();
  const { data: packingMaterials = [], isLoading: packingLoading } = usePackingMaterials();
  const { data: allPurchases = [] } = useAllSupplierPurchases();
  const { data: allBatches = [] } = useBatches(200);
  const navigate = useNavigate();
  const deleteIngredient = useDeleteIngredient();
  const deleteManualStock = useDeleteManualStockItem();
  const deleteStockItem = useDeleteStockItem();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));

  const [errorMsg, setErrorMsg] = useState("");
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  const [alertsOpen, setAlertsOpen] = useState({ shortage: false, reorder: false });
  const toggleExpand = (key: string) => setExpanded((prev) => ({ ...prev, [key]: !prev[key] }));

  const deleteMsgs = {
    ingredient: (id: number) => deleteIngredient.mutateAsync({ id, force: true }),
    saleable: (id: number) => deleteStockItem.mutateAsync(id),
    packing: (id: number) => deleteManualStock.mutateAsync(id),
  };

  const goCompare = (name: string, source: "ingredient" | "manual") =>
    navigate(`/price-comparison?item=${encodeURIComponent(name)}&source=${source}`);
  const goTracking = (stockItemId: number) =>
    navigate(`/batch-tracking?stockItem=${stockItemId}`);

  /** A saleable row is recipe-prepared when it is linked to a pack type
   * (packed internally); otherwise it was purchased directly. */
  const isProduced = (item: any) => item.pack_type_id != null;

  const batchesForRecipe = (recipeId: number) =>
    allBatches
      .filter((b: any) => b.recipe_id === recipeId)
      .sort((a: any, b: any) => (a.produced_at < b.produced_at ? 1 : -1));

  /** Production snapshot for a recipe-prepared item. */
  const productionSnapshot = (item: any) => {
    const list = item.recipe_id ? batchesForRecipe(item.recipe_id) : [];
    const latest = list[0];
    const producedKg = list.reduce((s: number, b: any) => s + (b.produced_qty || 0), 0);
    return (
      <Box sx={{ mt: 1 }}>
        <Typography variant="caption" color="text.secondary" sx={{ display: "block" }}>
          Source: Recipe / Production
        </Typography>
        {latest ? (
          <>
            <Box sx={{ display: "flex", gap: 2, flexWrap: "wrap", mt: 0.5 }}>
              <Box><Typography variant="caption" color="text.secondary" sx={{ display: "block" }}>Latest Batch</Typography><Typography variant="body2" sx={{ fontWeight: 700 }} className="tnum">#{latest.id} · {formatDate(latest.produced_at)}</Typography></Box>
              <Box><Typography variant="caption" color="text.secondary" sx={{ display: "block" }}>Batches</Typography><Typography variant="body2" className="tnum">{list.length}</Typography></Box>
            </Box>
            <Box sx={{ display: "flex", gap: 2, flexWrap: "wrap", mt: 0.5 }}>
              <Box><Typography variant="caption" color="text.secondary" sx={{ display: "block" }}>Produced</Typography><Typography variant="body2" className="tnum">{producedKg} kg</Typography></Box>
              <Box><Typography variant="caption" color="text.secondary" sx={{ display: "block" }}>Available</Typography><Typography variant="body2" sx={{ fontWeight: 700 }} className="tnum">{item.qty} {item.unit}</Typography></Box>
            </Box>
          </>
        ) : (
          <Typography variant="caption" color="text.secondary" sx={{ display: "block", mt: 0.5 }}>
            No production batches recorded for this recipe yet.
          </Typography>
        )}
        <Button variant="outlined" onClick={() => goTracking(item.id)} aria-label={`View batch tracking for ${item.name}`} sx={{ mt: 1, minHeight: 44 }} fullWidth>
          View Batch Tracking
        </Button>
      </Box>
    );
  };

  /** Primary purchase-price group for an item name (dominant unit). */
  const priceGroup = (name: string) => {
    const groups = groupByUnit(purchasesForItem(allPurchases, name));
    return groups.length > 0 ? groups[0] : null;
  };

  /** Compact purchase-price snapshot for mobile cards. */
  const priceSnapshot = (name: string, source: "ingredient" | "manual", avgCost: number, unit: string) => {
    const group = priceGroup(name);
    if (!group || !group.best || !group.latest) {
      return (
        <Typography variant="caption" color="text.secondary" sx={{ display: "block", mt: 1 }}>
          No purchase history
        </Typography>
      );
    }
    return (
      <Box sx={{ mt: 1 }}>
        <Box sx={{ display: "flex", gap: 2, flexWrap: "wrap" }}>
          <Box><Typography variant="caption" color="text.secondary" sx={{ display: "block" }}>Avg. Cost</Typography><Typography variant="body2" className="tnum"><Money value={avgCost} />/{unit}</Typography></Box>
          <Box><Typography variant="caption" color="text.secondary" sx={{ display: "block" }}>Latest Price</Typography><Typography variant="body2" className="tnum"><Money value={group.latest.price} />/{group.unit}</Typography></Box>
        </Box>
        <Typography variant="body2" sx={{ mt: 0.5 }}>
          Best Supplier <strong>{group.best.supplierName}</strong> · <span className="tnum"><Money value={group.best.latest.price} />/{group.unit}</span>
        </Typography>
        <Typography variant="caption" color="text.secondary" sx={{ display: "block" }}>
          {group.suppliers.length} supplier{group.suppliers.length === 1 ? "" : "s"} · {group.rows.length} purchase{group.rows.length === 1 ? "" : "s"}
        </Typography>
        <Button variant="outlined" onClick={() => goCompare(name, source)} aria-label={`View price comparison for ${name}`} sx={{ mt: 1, minHeight: 44 }} fullWidth>
          View Price Comparison
        </Button>
      </Box>
    );
  };

  const lowItems = rawMaterials.filter((item: any) => item.is_low_stock);
  const shortageItems = orderDemand.filter((d: any) => d.shortage > 0);
  const reorderItems = rawMaterials.filter((item: any) => item.min_stock > 0 && item.on_hand_qty <= item.min_stock);

  const summary: { label: string; value: number | null; tone?: "error" }[] = [
    { label: "Saleable items", value: isLoading ? null : saleableStock.length },
    { label: "Raw items", value: rawMaterialsLoading ? null : rawMaterials.length },
    { label: "Low stock", value: rawMaterialsLoading ? null : lowItems.length, tone: lowItems.length > 0 ? "error" : undefined },
    { label: "Shortages", value: orderDemandLoading ? null : shortageItems.length, tone: shortageItems.length > 0 ? "error" : undefined },
  ];

  const saleableStatus = (item: any) => {
    if (orderDemandLoading) return <CircularProgress size={14} />;
    const demand = orderDemand.find((d: any) => d.stock_item_id === item.id);
    const pendingQty = demand?.total_ordered || 0;
    const shortage = demand?.shortage || 0;
    if (shortage > 0) return <StatusChip status="error" label={`Short by ${shortage}`} />;
    if (pendingQty > 0) return <StatusChip status="info" label={`${pendingQty} ordered`} />;
    return <StatusChip status="success" label="In stock" />;
  };

  const marginChip = (item: any) => {
    if (item.cost_per_unit > 0 && item.unit_price > 0) {
      const margin = ((item.unit_price - item.cost_per_unit) / item.unit_price) * 100;
      const status = margin > 30 ? "success" : margin >= 15 ? "warning" : "error";
      return <StatusChip status={status} label={`${margin.toFixed(0)}% margin`} />;
    }
    return <>—</>;
  };

  const expandButton = (key: string, name: string) => (
    <IconButton
      size="small"
      aria-label={expanded[key] ? `Hide details for ${name}` : `Show details for ${name}`}
      aria-expanded={!!expanded[key]}
      onClick={() => toggleExpand(key)}
      sx={{ minWidth: 44 }}
    >
      {expanded[key] ? <ExpandLessRoundedIcon /> : <ExpandMoreRoundedIcon />}
    </IconButton>
  );

  const compactAlert = (
    key: "shortage" | "reorder",
    title: string,
    items: any[],
    renderItem: (item: any) => React.ReactNode,
  ) => {
    if (items.length === 0) return null;
    const open = alertsOpen[key];
    const visible = open ? items : items.slice(0, 3);
    return (
      <Alert severity="warning" sx={{ mb: 2 }}>
        <Typography variant="body2" sx={{ fontWeight: 600 }}>{title} ({items.length})</Typography>
        {visible.map(renderItem)}
        {items.length > 3 && (
          <Button size="small" onClick={() => setAlertsOpen((p) => ({ ...p, [key]: !p[key] }))} sx={{ mt: 0.5, minHeight: 44 }}>
            {open ? "Show less" : `Show all ${items.length}`}
          </Button>
        )}
      </Alert>
    );
  };

  return (
    <Box>
      <PageHeader
        title="Inventory"
        subtitle="Purchased saleable goods and packaged production stock appear here. Raw materials are tracked separately below."
      />
      {errorMsg && <Alert severity="error" sx={{ mb: 2 }} onClose={() => setErrorMsg("")}>{errorMsg}</Alert>}

      {/* Summary */}
      <Box sx={{ display: "grid", gridTemplateColumns: { xs: "repeat(2, 1fr)", sm: "repeat(4, 1fr)" }, gap: { xs: 1, sm: 2 }, mb: 2 }}>
        {summary.map((s) => (
          <Card key={s.label} variant="outlined">
            <CardContent sx={{ p: { xs: 1.5, sm: 2 }, "&:last-child": { pb: { xs: 1.5, sm: 2 } } }}>
              <Typography variant="caption" color="text.secondary" sx={{ fontSize: "0.75rem" }}>{s.label}</Typography>
              <Typography variant="h6" sx={{ fontWeight: 700, fontSize: { xs: "1.25rem", sm: "1.5rem" } }} className="tnum" color={s.tone === "error" ? "error.main" : "text.primary"}>
                {s.value === null ? <CircularProgress size={20} /> : s.value}
              </Typography>
            </CardContent>
          </Card>
        ))}
      </Box>

      {/* Saleable Stock */}
      <Typography variant="h5" sx={{ mb: 1, fontSize: { xs: "1rem", sm: "1.25rem" }, fontWeight: 700 }}>Saleable Inventory</Typography>
      {isLoading ? (
        isMobile ? (
          <Box sx={{ display: "flex", justifyContent: "center", py: 4 }}><CircularProgress /></Box>
        ) : (
          <TableContainer component={Paper} sx={{ mb: 3, overflowX: "auto" }}>
            <Table size="small"><TableHead><TableRow>
              <TableCell sx={{ ...cellSx, fontWeight: 700 }}>Item</TableCell>
              <TableCell sx={{ ...cellSx, fontWeight: 700 }}>Qty</TableCell>
              <TableCell sx={{ ...cellSx, fontWeight: 700 }}>Unit</TableCell>
              <TableCell sx={{ ...cellSx, fontWeight: 700, display: { xs: "none", sm: "table-cell" } }}>Pending Orders</TableCell>
              <TableCell sx={{ ...cellSx, fontWeight: 700, display: { xs: "none", sm: "table-cell" } }}>Production Needed</TableCell>
              <TableCell sx={{ ...cellSx, fontWeight: 700 }}>Cost</TableCell>
              <TableCell sx={{ ...cellSx, fontWeight: 700 }}>Price</TableCell>
              <TableCell sx={{ ...cellSx, fontWeight: 700 }}>Margin</TableCell>
              <TableCell sx={{ ...cellSx, fontWeight: 700 }}>Actions</TableCell>
            </TableRow></TableHead>
            <TableBody><TableSkeleton rows={4} colSpan={9} /></TableBody>
            </Table>
          </TableContainer>
        )
      ) : error ? (
        <ErrorState message={(error as any).message} onRetry={() => refetchSaleable()} />
      ) : isMobile ? (
        <Stack spacing={1.5} sx={{ mb: 3 }}>
          {saleableStock.length ? saleableStock.map((item: any) => {
            const key = `saleable:${item.id}`;
            const demand = orderDemand.find((d: any) => d.stock_item_id === item.id);
            const pendingQty = demand?.total_ordered || 0;
            const shortage = demand?.shortage || 0;
            return (
              <Card key={item.id} variant="outlined">
                <CardContent sx={{ p: 2, "&:last-child": { pb: 2 } }}>
                  <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 1 }}>
                    <Box sx={{ minWidth: 0 }}>
                      <Typography variant="subtitle2" sx={{ fontWeight: 700, fontSize: "0.9375rem" }}>{item.name}</Typography>
                      <Typography variant="h6" sx={{ fontWeight: 700 }} className="tnum">
                        {item.qty} <Typography component="span" variant="caption" color="text.secondary">{item.unit}</Typography>
                      </Typography>
                    </Box>
                    {saleableStatus(item)}
                  </Box>
                  {isProduced(item)
                    ? productionSnapshot(item)
                    : priceSnapshot(item.name, "manual", item.cost_per_unit, item.unit)}
                  <Collapse in={!!expanded[key]} timeout="auto" unmountOnExit>
                    <Box sx={{ display: "flex", gap: 2, mt: 1, flexWrap: "wrap" }}>
                      <Box><Typography variant="caption" color="text.secondary" sx={{ display: "block" }}>Cost</Typography><Typography variant="body2" className="tnum"><Money value={item.cost_per_unit} /></Typography></Box>
                      <Box><Typography variant="caption" color="text.secondary" sx={{ display: "block" }}>Price</Typography><Typography variant="body2" className="tnum"><Money value={item.unit_price} /></Typography></Box>
                      <Box><Typography variant="caption" color="text.secondary" sx={{ display: "block" }}>Margin</Typography><Typography variant="body2">{marginChip(item)}</Typography></Box>
                      {!orderDemandLoading && (pendingQty > 0 || shortage > 0) && (
                        <Box><Typography variant="caption" color="text.secondary" sx={{ display: "block" }}>Orders</Typography><Typography variant="body2" className="tnum">{shortage > 0 ? `${shortage} short` : `${pendingQty} ordered`}</Typography></Box>
                      )}
                    </Box>
                  </Collapse>
                  <Box sx={{ display: "flex", gap: 1, mt: 1.5 }}>
                    {expandButton(key, item.name)}
                    <Box sx={{ flex: 1 }}>
                      <DeleteButton
                        fullWidth
                        label="Delete"
                        itemName={item.name}
                        confirmMessage={`Delete saleable item "${item.name}" and all its purchase history? This cannot be undone.`}
                        onDelete={() => deleteMsgs.saleable(item.id)}
                        onError={(e) => setErrorMsg(formatError(e))}
                      />
                    </Box>
                  </Box>
                </CardContent>
              </Card>
            );
          }) : <EmptyState title="No saleable goods in stock." message="Purchased goods and packed production will appear here." />}
        </Stack>
      ) : (
        <>
        <TableContainer component={Paper} sx={{ mb: 3, overflowX: "auto" }}>
          <Table size="small" sx={{ minWidth: 760 }}>
            <TableHead><TableRow>
              <TableCell sx={{ ...cellSx, fontWeight: 700 }}>Item</TableCell>
              <TableCell sx={{ ...cellSx, fontWeight: 700 }}>Qty</TableCell>
              <TableCell sx={{ ...cellSx, fontWeight: 700 }}>Unit</TableCell>
              <TableCell sx={{ ...cellSx, fontWeight: 700, display: { xs: "none", sm: "table-cell" } }}>Pending Orders</TableCell>
              <TableCell sx={{ ...cellSx, fontWeight: 700, display: { xs: "none", sm: "table-cell" } }}>Production Needed</TableCell>
              <TableCell sx={{ ...cellSx, fontWeight: 700 }}>Cost</TableCell>
              <TableCell sx={{ ...cellSx, fontWeight: 700 }}>Price</TableCell>
              <TableCell sx={{ ...cellSx, fontWeight: 700 }}>Margin</TableCell>
              <TableCell sx={{ ...cellSx, fontWeight: 700 }}>Actions</TableCell>
            </TableRow></TableHead>
            <TableBody>
              {saleableStock.length ? saleableStock.map((item: any) => {
                const demand = orderDemand.find((d: any) => d.stock_item_id === item.id);
                const pendingQty = demand?.total_ordered || 0;
                const shortage = demand?.shortage || 0;
                return (
                  <TableRow key={item.id}>
                    <TableCell sx={cellSx}><Button size="small" onClick={() => (isProduced(item) ? goTracking(item.id) : goCompare(item.name, "manual"))} aria-label={isProduced(item) ? `View batch tracking for ${item.name}` : `View price comparison for ${item.name}`} sx={{ textTransform: "none", fontWeight: 600, p: 0.5, minWidth: 0, justifyContent: "flex-start" }}>{item.name}</Button></TableCell>
                    <TableCell sx={{ ...cellSx, fontWeight: 700 }} className="tnum">{item.qty}</TableCell>
                    <TableCell sx={cellSx}>{item.unit}</TableCell>
                    <TableCell sx={{ ...cellSx, display: { xs: "none", sm: "table-cell" } }}>
                      {orderDemandLoading ? <CircularProgress size={14} /> : pendingQty > 0 ? <StatusChip status="info" label={`${pendingQty} ${item.unit}`} /> : "—"}
                    </TableCell>
                    <TableCell sx={{ ...cellSx, display: { xs: "none", sm: "table-cell" } }}>
                      {orderDemandLoading ? <CircularProgress size={14} /> : shortage > 0 ? <StatusChip status="error" label={`${shortage} ${item.unit}`} /> : pendingQty > 0 ? <StatusChip status="success" label="Sufficient" /> : "—"}
                    </TableCell>
                    <TableCell sx={cellSx} className="tnum"><Money value={item.cost_per_unit} /></TableCell>
                    <TableCell sx={cellSx} className="tnum"><Money value={item.unit_price} /></TableCell>
                    <TableCell sx={cellSx}>{marginChip(item)}</TableCell>
                    <TableCell sx={cellSx}>
                      <DeleteButton
                        label="Delete"
                        itemName={item.name}
                        confirmMessage={`Delete saleable item "${item.name}" and all its purchase history? This cannot be undone.`}
                        onDelete={() => deleteMsgs.saleable(item.id)}
                        onError={(e) => setErrorMsg(formatError(e))}
                      />
                    </TableCell>
                  </TableRow>
                );
              }) : (
                <TableRow>
                  <TableCell colSpan={9} align="center" sx={{ ...cellSx, py: 3 }}><EmptyState title="No saleable goods in stock." message="Purchased goods and packed production will appear here." /></TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>

        {!orderDemandLoading && compactAlert("shortage", "Production needed to fulfill pending orders", shortageItems, (d: any) => (
          <Typography key={d.stock_item_id} variant="caption" sx={{ display: "block" }}>
            {d.stock_item_name}: <strong>{d.shortage}</strong> units short ({d.total_ordered} ordered − {d.stock_available} in stock)
          </Typography>
        ))}
        </>
      )}
      {isMobile && !isLoading && !error && !orderDemandLoading && compactAlert("shortage", "Production needed to fulfill pending orders", shortageItems, (d: any) => (
        <Typography key={d.stock_item_id} variant="caption" sx={{ display: "block" }}>
          {d.stock_item_name}: <strong>{d.shortage}</strong> units short ({d.total_ordered} ordered − {d.stock_available} in stock)
        </Typography>
      ))}

      {/* Raw Materials */}
      <Typography variant="h5" sx={{ mb: 1, fontSize: { xs: "1rem", sm: "1.25rem" }, fontWeight: 700 }}>Raw Materials</Typography>

      {rawMaterialsLoading ? (
        isMobile ? (
          <Box sx={{ display: "flex", justifyContent: "center", py: 4 }}><CircularProgress /></Box>
        ) : (
          <TableContainer component={Paper} sx={{ overflowX: "auto" }}>
            <Table size="small"><TableHead><TableRow>
              <TableCell sx={{ ...cellSx, fontWeight: 700 }}>Ingredient</TableCell><TableCell sx={{ ...cellSx, fontWeight: 700 }}>Qty</TableCell>
              <TableCell sx={{ ...cellSx, fontWeight: 700 }}>Unit</TableCell><TableCell sx={{ ...cellSx, fontWeight: 700 }}>Avg cost</TableCell><TableCell sx={{ ...cellSx, fontWeight: 700 }}>Status</TableCell><TableCell sx={{ ...cellSx, fontWeight: 700 }}>Actions</TableCell>
            </TableRow></TableHead>
            <TableBody><TableSkeleton rows={4} colSpan={6} /></TableBody>
            </Table>
          </TableContainer>
        )
      ) : rawMaterialsError ? (
        <ErrorState message={(rawMaterialsError as any).message} onRetry={() => refetchRaw()} />
      ) : isMobile ? (
        <Stack spacing={1.5} sx={{ mb: 2 }}>
          {rawMaterials.length ? rawMaterials.map((item: any) => {
            const key = `raw:${item.id}`;
            return (
              <Card key={item.id} variant="outlined">
                <CardContent sx={{ p: 2, "&:last-child": { pb: 2 } }}>
                  <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 1 }}>
                    <Box sx={{ minWidth: 0 }}>
                      <Typography variant="subtitle2" sx={{ fontWeight: 700, fontSize: "0.9375rem" }}>{item.name}</Typography>
                      <Typography variant="h6" sx={{ fontWeight: 700 }} className="tnum">
                        {item.on_hand_qty} <Typography component="span" variant="caption" color="text.secondary">{item.base_unit}</Typography>
                      </Typography>
                    </Box>
                    <StatusChip status={item.is_low_stock ? "error" : "success"} label={item.is_low_stock ? "Low stock" : "In stock"} />
                  </Box>
                  {priceSnapshot(item.name, "ingredient", item.avg_unit_price, item.base_unit)}
                  <Collapse in={!!expanded[key]} timeout="auto" unmountOnExit>
                    <Box sx={{ display: "flex", gap: 2, mt: 1, flexWrap: "wrap" }}>
                      <Box><Typography variant="caption" color="text.secondary" sx={{ display: "block" }}>Avg cost</Typography><Typography variant="body2" className="tnum"><Money value={item.avg_unit_price} /></Typography></Box>
                      <Box><Typography variant="caption" color="text.secondary" sx={{ display: "block" }}>Reorder at</Typography><Typography variant="body2" className="tnum">{item.min_stock > 0 ? `${item.min_stock} ${item.base_unit}` : "—"}</Typography></Box>
                    </Box>
                  </Collapse>
                  <Box sx={{ display: "flex", gap: 1, mt: 1.5 }}>
                    {expandButton(key, item.name)}
                    <Box sx={{ flex: 1 }}>
                      <DeleteButton
                        fullWidth
                        label="Delete"
                        itemName={item.name}
                        confirmMessage={`Delete "${item.name}" and all its purchase history? This cannot be undone.`}
                        onDelete={() => deleteMsgs.ingredient(item.id)}
                        onError={(e) => setErrorMsg(formatError(e))}
                      />
                    </Box>
                  </Box>
                </CardContent>
              </Card>
            );
          }) : <EmptyState title="No raw materials recorded." message="Record a raw-material purchase to stock items here." />}
        </Stack>
      ) : (
        <TableContainer component={Paper} sx={{ overflowX: "auto" }}>
          <Table size="small" sx={{ minWidth: 640 }}>
            <TableHead><TableRow>
              <TableCell sx={{ ...cellSx, fontWeight: 700 }}>Ingredient</TableCell><TableCell sx={{ ...cellSx, fontWeight: 700 }}>Qty</TableCell>
              <TableCell sx={{ ...cellSx, fontWeight: 700 }}>Unit</TableCell><TableCell sx={{ ...cellSx, fontWeight: 700 }}>Avg cost</TableCell><TableCell sx={{ ...cellSx, fontWeight: 700 }}>Status</TableCell><TableCell sx={{ ...cellSx, fontWeight: 700 }}>Actions</TableCell>
            </TableRow></TableHead>
            <TableBody>
              {rawMaterials.length ? rawMaterials.map((item: any) => (
                <TableRow key={item.id}>
                  <TableCell sx={cellSx}><Button size="small" onClick={() => goCompare(item.name, "ingredient")} aria-label={`View price comparison for ${item.name}`} sx={{ textTransform: "none", fontWeight: 600, p: 0.5, minWidth: 0, justifyContent: "flex-start" }}>{item.name}</Button></TableCell>
                  <TableCell sx={{ ...cellSx, fontWeight: 700 }} className="tnum">{item.on_hand_qty}</TableCell>
                  <TableCell sx={cellSx}>{item.base_unit}</TableCell>
                  <TableCell sx={cellSx} className="tnum"><Money value={item.avg_unit_price} /></TableCell>
                  <TableCell sx={cellSx}><StatusChip status={item.is_low_stock ? "error" : "success"} label={item.is_low_stock ? "Low stock" : "In stock"} /></TableCell>
                  <TableCell sx={cellSx}>
                    <DeleteButton
                      label="Delete"
                      itemName={item.name}
                      confirmMessage={`Delete "${item.name}" and all its purchase history? This cannot be undone.`}
                      onDelete={() => deleteMsgs.ingredient(item.id)}
                      onError={(e) => setErrorMsg(formatError(e))}
                    />
                  </TableCell>
                </TableRow>
              )) : <TableRow><TableCell colSpan={6} align="center" sx={{ ...cellSx, py: 3 }}><EmptyState title="No raw materials recorded." message="Record a raw-material purchase to stock items here." /></TableCell></TableRow>}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      {!rawMaterialsLoading && !rawMaterialsError && compactAlert("reorder", "Reorder needed", reorderItems, (item: any) => {
        const suggestedQty = item.min_stock * 2 - item.on_hand_qty;
        return (
          <Typography key={item.id} variant="caption" sx={{ display: "block" }}>
            {item.name}: <strong>{item.on_hand_qty}</strong> / {item.min_stock} {item.base_unit} — reorder <strong>{suggestedQty.toFixed(1)}</strong> {item.base_unit}
          </Typography>
        );
      })}

      {/* Packing Materials */}
      <Typography variant="h5" sx={{ mt: 3, mb: 1, fontSize: { xs: "1rem", sm: "1.25rem" }, fontWeight: 700 }}>Packing Materials</Typography>
      {packingLoading ? (
        isMobile ? (
          <Box sx={{ display: "flex", justifyContent: "center", py: 4 }}><CircularProgress /></Box>
        ) : (
          <TableContainer component={Paper} sx={{ overflowX: "auto" }}>
            <Table size="small"><TableHead><TableRow>
              <TableCell sx={{ ...cellSx, fontWeight: 700 }}>Material</TableCell><TableCell sx={{ ...cellSx, fontWeight: 700 }}>Qty</TableCell>
              <TableCell sx={{ ...cellSx, fontWeight: 700 }}>Unit</TableCell><TableCell sx={{ ...cellSx, fontWeight: 700 }}>Cost</TableCell>
              <TableCell sx={{ ...cellSx, fontWeight: 700 }}>Actions</TableCell>
            </TableRow></TableHead>
            <TableBody><TableSkeleton rows={3} colSpan={5} /></TableBody>
            </Table>
          </TableContainer>
        )
      ) : isMobile ? (
        <Stack spacing={1.5}>
          {packingMaterials.length ? packingMaterials.map((item: any) => {
            const key = `packing:${item.id}`;
            return (
              <Card key={item.id} variant="outlined">
                <CardContent sx={{ p: 2, "&:last-child": { pb: 2 } }}>
                  <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 1 }}>
                    <Box sx={{ minWidth: 0 }}>
                      <Typography variant="subtitle2" sx={{ fontWeight: 700, fontSize: "0.9375rem" }}>{item.name}</Typography>
                      <Typography variant="h6" sx={{ fontWeight: 700 }} className="tnum" color={item.qty <= 0 ? "error.main" : "text.primary"}>
                        {item.qty} <Typography component="span" variant="caption" color="text.secondary">{item.unit}</Typography>
                      </Typography>
                    </Box>
                    <StatusChip status={item.qty <= 0 ? "error" : "success"} label={item.qty <= 0 ? "Out of stock" : "In stock"} />
                  </Box>
                  {priceSnapshot(item.name, "manual", item.unit_price, item.unit)}
                  <Collapse in={!!expanded[key]} timeout="auto" unmountOnExit>
                    <Box sx={{ display: "flex", gap: 2, mt: 1, flexWrap: "wrap" }}>
                      <Box><Typography variant="caption" color="text.secondary" sx={{ display: "block" }}>Unit cost</Typography><Typography variant="body2" className="tnum"><Money value={item.unit_price} /></Typography></Box>
                    </Box>
                  </Collapse>
                  <Box sx={{ display: "flex", gap: 1, mt: 1.5 }}>
                    {expandButton(key, item.name)}
                    <Box sx={{ flex: 1 }}>
                      <DeleteButton
                        fullWidth
                        label="Delete"
                        itemName={item.name}
                        confirmMessage={`Delete packing material "${item.name}" and all its purchase history? This cannot be undone.`}
                        onDelete={() => deleteMsgs.packing(item.id)}
                        onError={(e) => setErrorMsg(formatError(e))}
                      />
                    </Box>
                  </Box>
                </CardContent>
              </Card>
            );
          }) : <EmptyState title="No packing materials recorded." message="Record a packing-material purchase to stock items here." />}
        </Stack>
      ) : (
      <TableContainer component={Paper} sx={{ overflowX: "auto" }}>
        <Table size="small" sx={{ minWidth: 560 }}>
          <TableHead><TableRow>
            <TableCell sx={{ ...cellSx, fontWeight: 700 }}>Material</TableCell><TableCell sx={{ ...cellSx, fontWeight: 700 }}>Qty</TableCell>
            <TableCell sx={{ ...cellSx, fontWeight: 700 }}>Unit</TableCell><TableCell sx={{ ...cellSx, fontWeight: 700 }}>Cost</TableCell>
            <TableCell sx={{ ...cellSx, fontWeight: 700 }}>Actions</TableCell>
          </TableRow></TableHead>
          <TableBody>
            {packingMaterials.length ? packingMaterials.map((item: any) => (
              <TableRow key={item.id}>
                <TableCell sx={{ ...cellSx, fontWeight: 600 }}><Button size="small" onClick={() => goCompare(item.name, "manual")} aria-label={`View price comparison for ${item.name}`} sx={{ textTransform: "none", fontWeight: 600, p: 0.5, minWidth: 0, justifyContent: "flex-start" }}>{item.name}</Button></TableCell>
                <TableCell sx={{ ...cellSx, fontWeight: 700, color: item.qty <= 0 ? "error.main" : "text.primary" }} className="tnum">{item.qty}</TableCell>
                <TableCell sx={cellSx}>{item.unit}</TableCell>
                <TableCell sx={cellSx} className="tnum"><Money value={item.unit_price} /></TableCell>
                <TableCell sx={cellSx}>
                  <DeleteButton
                    label="Delete"
                    itemName={item.name}
                    confirmMessage={`Delete packing material "${item.name}" and all its purchase history? This cannot be undone.`}
                    onDelete={() => deleteMsgs.packing(item.id)}
                    onError={(e) => setErrorMsg(formatError(e))}
                  />
                </TableCell>
              </TableRow>
            )) : <TableRow><TableCell colSpan={5} align="center" sx={{ ...cellSx, py: 3 }}><EmptyState title="No packing materials recorded." message="Record a packing-material purchase to stock items here." /></TableCell></TableRow>}
          </TableBody>
        </Table>
      </TableContainer>
      )}
    </Box>
  );
};
