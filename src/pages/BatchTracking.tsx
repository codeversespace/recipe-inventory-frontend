import { Box, Button, Card, CardContent, CircularProgress, Paper, Stack, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Typography } from "@mui/material";
import ArrowBackRoundedIcon from "@mui/icons-material/ArrowBackRounded";
import { useEffect, useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useBatchDetail, usePackTypes, useProductionBatches, useRecipes, useSaleableStock, useStockBatches } from "../hooks/useApi";
import { EmptyState, ErrorState, PageHeader } from "../components/ui";
import { formatDate } from "../utils/formatDate";
import { formatMoney } from "../utils/formatNumber";

const cellSx = { py: 0.75, px: 1, fontSize: { xs: "0.875rem", sm: "0.8rem" } };

export const BatchTracking = () => {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const stockItemId = Number(params.get("stockItem") || 0);

  const { data: saleableStock = [] } = useSaleableStock();
  const { data: tracking, isLoading, error: trackError, refetch: refetchTrack } = useStockBatches(stockItemId);
  const { data: recipes = [] } = useRecipes();
  const { data: packTypes = [] } = usePackTypes();
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const { data: detail, isFetching: detailLoading } = useBatchDetail(selectedId);

  const item = saleableStock.find((s: any) => s.id === stockItemId) || null;
  const recipe = useMemo(
    () => recipes.find((r: any) => item && r.id === item.recipe_id) || null,
    [recipes, item],
  );
  const packType = useMemo(
    () => packTypes.find((p: any) => item && p.id === item.pack_type_id) || null,
    [packTypes, item],
  );
  const batches = useMemo(() => tracking?.batches || [], [tracking]);
  const unallocated = useMemo(() => tracking?.unallocated_sales || [], [tracking]);
  const producedPacks = useMemo(
    () => batches.reduce((s: number, b: any) => s + (b.packed || 0), 0),
    [batches],
  );
  const soldPacks = useMemo(
    () => batches.reduce((s: number, b: any) => s + (b.allocated || 0), 0),
    [batches],
  );
  const [page, setPage] = useState(1);
  const pageSize = 10;
  useEffect(() => {
    setPage(1);
    setSelectedId(null);
  }, [stockItemId]);
  const {
    data: paged,
    isLoading: pagedLoading,
    error: pagedError,
    refetch: refetchPaged,
  } = useProductionBatches(recipe?.id, page, pageSize);
  const pageItems = paged?.items || [];
  const pageTotal = paged?.total || 0;
  const pageCount = Math.max(Math.ceil(pageTotal / pageSize), 1);
  const trackByBatch = useMemo(() => {
    const map = new Map<number, any>();
    for (const b of batches) map.set(b.batch_id, b);
    return map;
  }, [batches]);

  // Timeline grouped per batch: short fixed connectors, no endless line.
  const groups = useMemo(
    () =>
      batches.map((b: any) => ({
        batch: b,
        events: [
          { date: (b.produced_at || "").slice(0, 10), title: `Batch #${b.batch_id} produced`, detail: `${b.packed} packs packed` },
          ...(b.allocations || []).map((a: any) => ({
            date: (a.sold_at || "").slice(0, 10),
            title: `${a.quantity} packs sold`,
            detail: `${a.customer_name || "Walk-in"} · Sale #${a.sale_id}`,
          })),
        ],
      })),
    [batches],
  );

  const selected = detail || null;

  return (
    <Box>
      <Button startIcon={<ArrowBackRoundedIcon />} onClick={() => navigate("/inventory")} sx={{ mb: 1, minHeight: 44 }} aria-label="Back to Inventory">
        Inventory
      </Button>
      {!stockItemId || !item ? (
        <>
          <PageHeader title="Batch Tracking" />
          <EmptyState
            title="No product selected."
            message="Open batch tracking from a recipe-prepared inventory item."
            actionLabel="Back to Inventory"
            onAction={() => navigate("/inventory")}
          />
        </>
      ) : (
        <>
          <PageHeader
            title={item.name}
            subtitle={`Batch Tracking${recipe ? ` · Recipe: ${recipe.name}` : ""}${packType ? ` · Pack: ${packType.name}` : ""}`}
          />

          {/* Product summary */}
          {trackError ? (
            <ErrorState message={(trackError as any).message} onRetry={() => refetchTrack()} />
          ) : (
          <Box sx={{ display: "grid", gridTemplateColumns: { xs: "repeat(2, 1fr)", sm: "repeat(4, 1fr)" }, gap: { xs: 1, sm: 2 }, mb: 2 }}>
            {[
              { label: "Batches", value: isLoading ? null : String(batches.length) },
              { label: "Packed", value: isLoading ? null : `${producedPacks} packs` },
              { label: "Sold", value: isLoading ? null : `${soldPacks} packs` },
              { label: "Available", value: `${item.qty} ${item.unit}` },
            ].map((s) => (
              <Card key={s.label} variant="outlined">
                <CardContent sx={{ p: { xs: 1.5, sm: 2 }, "&:last-child": { pb: { xs: 1.5, sm: 2 } } }}>
                  <Typography variant="caption" color="text.secondary" sx={{ fontSize: "0.75rem" }}>{s.label}</Typography>
                  <Typography variant="h6" sx={{ fontWeight: 700, fontSize: { xs: "1.25rem", sm: "1.5rem" } }} className="tnum">
                    {s.value === null ? <CircularProgress size={20} /> : s.value}
                  </Typography>
                </CardContent>
              </Card>
            ))}
          </Box>
          )}

          {/* Batch list: latest first, server-paginated after the recipe filter */}
          <Typography variant="h6" sx={{ fontWeight: 700, fontSize: { xs: "1rem", sm: "1.25rem" }, mb: 1 }}>Batches</Typography>
          {pagedLoading ? (
            <Box sx={{ display: "flex", justifyContent: "center", py: 4 }}><CircularProgress /></Box>
          ) : pagedError ? (
            <ErrorState message={(pagedError as any).message} onRetry={() => refetchPaged()} />
          ) : pageItems.length === 0 ? (
            <EmptyState title="No batches recorded." message="Production batches for this recipe will appear here once produced." />
          ) : (
            <>
              <Box sx={{ display: { xs: "none", sm: "block" } }}>
                <TableContainer component={Paper} sx={{ overflowX: "auto", mb: 2 }}>
                  <Table size="small" sx={{ minWidth: 640 }}>
                    <TableHead><TableRow>
                      <TableCell sx={{ ...cellSx, fontWeight: 700 }}>Batch</TableCell>
                      <TableCell sx={{ ...cellSx, fontWeight: 700 }}>Produced</TableCell>
                      <TableCell sx={{ ...cellSx, fontWeight: 700 }}>Packed</TableCell>
                      <TableCell sx={{ ...cellSx, fontWeight: 700 }}>Sold</TableCell>
                      <TableCell sx={{ ...cellSx, fontWeight: 700 }}>Remaining</TableCell>
                      <TableCell sx={{ ...cellSx, fontWeight: 700 }}>Details</TableCell>
                    </TableRow></TableHead>
                    <TableBody>
                      {pageItems.map((b: any) => {
                        const t = trackByBatch.get(b.id);
                        return (
                        <TableRow key={b.id} hover selected={selectedId === b.id}>
                          <TableCell sx={{ ...cellSx, fontWeight: 700 }} className="tnum">#{b.id}</TableCell>
                          <TableCell sx={cellSx}>{b.produced_at ? formatDate(b.produced_at) : "—"}</TableCell>
                          <TableCell sx={cellSx} className="tnum">{t ? t.packed : "—"}</TableCell>
                          <TableCell sx={cellSx} className="tnum">{t ? t.allocated : "—"}</TableCell>
                          <TableCell sx={{ ...cellSx, fontWeight: 700 }} className="tnum">{t ? t.available : "—"}</TableCell>
                          <TableCell sx={cellSx}>
                            <Button size="small" onClick={() => setSelectedId(selectedId === b.id ? null : b.id)} aria-label={`View batch ${b.id}`} aria-expanded={selectedId === b.id}>View</Button>
                          </TableCell>
                        </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </TableContainer>
              </Box>
              <Box sx={{ display: { xs: "block", sm: "none" } }}>
                <Stack spacing={1.5} sx={{ mb: 2 }}>
                  {pageItems.map((b: any) => {
                    const t = trackByBatch.get(b.id);
                    return (
                    <Card key={b.id} variant={selectedId === b.id ? "elevation" : "outlined"}>
                      <CardContent sx={{ p: 2, "&:last-child": { pb: 2 } }}>
                        <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 1 }}>
                          <Box sx={{ minWidth: 0 }}>
                            <Typography variant="subtitle2" sx={{ fontWeight: 700, fontSize: "0.9375rem" }} className="tnum">Batch #{b.id}</Typography>
                            <Typography variant="caption" color="text.secondary">{b.produced_at ? formatDate(b.produced_at) : "—"}</Typography>
                          </Box>
                          <Typography variant="body2" sx={{ fontWeight: 700, whiteSpace: "nowrap" }} className="tnum">{t ? `${t.available} left` : "Not packed"}</Typography>
                        </Box>
                        <Box sx={{ display: "flex", gap: 2, mt: 1 }} className="tnum">
                          <Box><Typography variant="caption" color="text.secondary" sx={{ display: "block" }}>Packed</Typography><Typography variant="body2" sx={{ fontWeight: 600 }}>{t ? t.packed : "—"}</Typography></Box>
                          <Box><Typography variant="caption" color="text.secondary" sx={{ display: "block" }}>Sold</Typography><Typography variant="body2" sx={{ fontWeight: 600 }}>{t ? t.allocated : "—"}</Typography></Box>
                        </Box>
                        <Button fullWidth variant={selectedId === b.id ? "contained" : "outlined"} onClick={() => setSelectedId(selectedId === b.id ? null : b.id)} aria-label={`View batch ${b.id}`} aria-expanded={selectedId === b.id} sx={{ mt: 1.5, minHeight: 44 }}>
                          {selectedId === b.id ? "Hide details" : "View batch"}
                        </Button>
                      </CardContent>
                    </Card>
                    );
                  })}
                </Stack>
              </Box>
              <Box sx={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 2, mb: 2 }}>
                <Button
                  variant="outlined"
                  disabled={page <= 1 || pagedLoading}
                  onClick={() => setPage((p) => Math.max(p - 1, 1))}
                  aria-label="Previous batch page"
                  sx={{ minHeight: 44, minWidth: 44 }}
                >
                  &lt; Previous
                </Button>
                <Typography variant="body2" color="text.secondary" aria-live="polite">
                  Page {page} of {pageCount} · {pageTotal} batches
                </Typography>
                <Button
                  variant="outlined"
                  disabled={page >= pageCount || pagedLoading}
                  onClick={() => setPage((p) => Math.min(p + 1, pageCount))}
                  aria-label="Next batch page"
                  sx={{ minHeight: 44, minWidth: 44 }}
                >
                  Next &gt;
                </Button>
              </Box>
            </>
          )}

          {/* Batch detail */}
          {selectedId !== null && (
            <Box sx={{ mb: 2 }}>
              <Typography variant="h6" sx={{ fontWeight: 700, fontSize: { xs: "1rem", sm: "1.25rem" }, mb: 1 }}>
                Batch #{selectedId}{detailLoading ? " — loading…" : ""}
              </Typography>
              {detailLoading || !selected ? (
                <Box sx={{ display: "flex", justifyContent: "center", py: 3 }}><CircularProgress /></Box>
              ) : (
                <Card variant="outlined">
                  <CardContent sx={{ p: 2, "&:last-child": { pb: 2 } }}>
                    <Typography variant="body2"><strong>Product:</strong> {item.name}</Typography>
                    <Typography variant="body2"><strong>Recipe:</strong> {recipe?.name || "—"}</Typography>
                    <Typography variant="body2"><strong>Prepared:</strong> {formatDate(selected.produced_at)} · <strong>Produced:</strong> <span className="tnum">{selected.produced_qty} kg</span></Typography>
                    <Typography variant="body2"><strong>Batch cost:</strong> <span className="tnum">{formatMoney(selected.total_cost)}</span>{selected.total_revenue != null && <> · <strong>Revenue:</strong> <span className="tnum">{formatMoney(selected.total_revenue)}</span></>}</Typography>
                    <Typography variant="subtitle2" sx={{ fontWeight: 700, mt: 2, mb: 0.5 }}>Ingredients consumed</Typography>
                    <TableContainer sx={{ overflowX: "auto" }}>
                      <Table size="small" sx={{ minWidth: 420 }}>
                        <TableHead><TableRow>
                          <TableCell sx={{ ...cellSx, fontWeight: 700 }}>Ingredient</TableCell>
                          <TableCell sx={{ ...cellSx, fontWeight: 700 }}>Qty used</TableCell>
                          <TableCell sx={{ ...cellSx, fontWeight: 700 }}>Line cost</TableCell>
                        </TableRow></TableHead>
                        <TableBody>
                          {(selected.consumptions || []).map((c: any, i: number) => (
                            <TableRow key={i}>
                              <TableCell sx={cellSx}>{c.ingredient_name}</TableCell>
                              <TableCell sx={cellSx} className="tnum">{c.qty_used}</TableCell>
                              <TableCell sx={cellSx} className="tnum">{formatMoney(c.line_cost)}</TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </TableContainer>
                    {(selected.overheads || []).length > 0 && (
                      <>
                        <Typography variant="subtitle2" sx={{ fontWeight: 700, mt: 2, mb: 0.5 }}>Overheads</Typography>
                        {(selected.overheads || []).map((o: any, i: number) => (
                          <Typography key={i} variant="body2" className="tnum">{o.name} ({o.overhead_type}): {formatMoney(o.cost)}</Typography>
                        ))}
                      </>
                    )}
                  </CardContent>
                </Card>
              )}
            </Box>
          )}

          {/* Timeline grouped per batch: short connectors only */}
          <Typography variant="h6" sx={{ fontWeight: 700, fontSize: { xs: "1rem", sm: "1.25rem" }, mb: 1 }}>Timeline</Typography>
          {groups.length === 0 && !isLoading ? (
            <Typography color="text.secondary" sx={{ fontSize: "0.8125rem", mb: 2 }}>No batch events yet.</Typography>
          ) : (
            <Stack spacing={1.5} sx={{ mb: 2 }}>
              {groups.map((g: any) => (
                <Card key={g.batch.batch_id} variant="outlined">
                  <CardContent sx={{ p: 2, "&:last-child": { pb: 2 } }}>
                    <Typography variant="subtitle2" sx={{ fontWeight: 700 }} className="tnum">Batch #{g.batch.batch_id}</Typography>
                    {g.events.map((e: any, i: number) => (
                      <Box key={i} sx={{ display: "flex", gap: 1.5 }}>
                        <Box sx={{ display: "flex", flexDirection: "column", alignItems: "center", flexShrink: 0 }}>
                          <Box sx={{ width: 10, height: 10, borderRadius: "50%", bgcolor: "primary.main", mt: 0.5 }} />
                          {i < g.events.length - 1 && <Box sx={{ width: 2, height: 12, bgcolor: "divider" }} />}
                        </Box>
                        <Box sx={{ pb: 1 }}>
                          <Typography variant="caption" color="text.secondary">{e.date ? formatDate(e.date + "T00:00:00") : "—"}</Typography>
                          <Typography variant="body2" sx={{ fontWeight: 600 }}>{e.title}</Typography>
                          <Typography variant="caption" color="text.secondary">{e.detail}</Typography>
                        </Box>
                      </Box>
                    ))}
                    <Box sx={{ display: "flex", gap: 1.5, mt: 0.5 }}>
                      <Box sx={{ width: 10, height: 10, borderRadius: "50%", bgcolor: "success.main", mt: 0.5, flexShrink: 0 }} />
                      <Box>
                        <Typography variant="caption" color="text.secondary">Current</Typography>
                        <Typography variant="body2" sx={{ fontWeight: 600 }} className="tnum">{g.batch.available} packs remaining</Typography>
                      </Box>
                    </Box>
                  </CardContent>
                </Card>
              ))}
            </Stack>
          )}

          {/* Customer movements from persisted allocations */}
          <Typography variant="h6" sx={{ fontWeight: 700, fontSize: { xs: "1rem", sm: "1.25rem" }, mb: 1 }}>Customer Movements</Typography>
          {(() => {
            const moves: any[] = [];
            for (const b of batches) {
              for (const a of b.allocations || []) {
                moves.push({ ...a, batch_id: b.batch_id });
              }
            }
            moves.sort((a, b) => (a.sold_at < b.sold_at ? 1 : -1));
            if (moves.length === 0) {
              return <EmptyState title="No allocated sales yet." message="Sales fulfilled from recorded batches will appear here with their batch." />;
            }
            return (
              <>
                <Box sx={{ display: { xs: "none", sm: "block" } }}>
                  <TableContainer component={Paper} sx={{ overflowX: "auto" }}>
                    <Table size="small" sx={{ minWidth: 560 }}>
                      <TableHead><TableRow>
                        <TableCell sx={{ ...cellSx, fontWeight: 700 }}>Customer</TableCell>
                        <TableCell sx={{ ...cellSx, fontWeight: 700 }}>Sale</TableCell>
                        <TableCell sx={{ ...cellSx, fontWeight: 700 }}>Batch</TableCell>
                        <TableCell sx={{ ...cellSx, fontWeight: 700 }}>Date</TableCell>
                        <TableCell sx={{ ...cellSx, fontWeight: 700 }}>Quantity</TableCell>
                      </TableRow></TableHead>
                      <TableBody>
                        {moves.map((m, i) => (
                          <TableRow key={i} hover>
                            <TableCell sx={{ ...cellSx, fontWeight: 600 }}>{m.customer_name || "Walk-in"}</TableCell>
                            <TableCell sx={cellSx} className="tnum">Sale #{m.sale_id}</TableCell>
                            <TableCell sx={cellSx} className="tnum">Batch #{m.batch_id}</TableCell>
                            <TableCell sx={cellSx}>{m.sold_at ? formatDate(m.sold_at) : "—"}</TableCell>
                            <TableCell sx={cellSx} className="tnum">{m.quantity}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>
                </Box>
                <Box sx={{ display: { xs: "block", sm: "none" } }}>
                  <Stack spacing={1.5}>
                    {moves.map((m, i) => (
                      <Card key={i} variant="outlined">
                        <CardContent sx={{ p: 2, "&:last-child": { pb: 2 } }}>
                          <Typography variant="subtitle2" sx={{ fontWeight: 700, fontSize: "0.9375rem" }}>{m.customer_name || "Walk-in"}</Typography>
                          <Typography variant="caption" color="text.secondary">Sale #{m.sale_id} · Batch #{m.batch_id} · {m.sold_at ? formatDate(m.sold_at) : "—"}</Typography>
                          <Typography variant="body2" sx={{ fontWeight: 700, mt: 0.5 }} className="tnum">{m.quantity} packs</Typography>
                        </CardContent>
                      </Card>
                    ))}
                  </Stack>
                </Box>
              </>
            );
          })()}

          {/* Legacy sales recorded without allocation stay valid and visible */}
          {unallocated.length > 0 && (
            <Box sx={{ mt: 2 }}>
              <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 0.5 }}>Sales without batch allocation</Typography>
              <Typography variant="caption" color="text.secondary" sx={{ display: "block", mb: 1 }}>
                Recorded before batch tracking — batch allocation not recorded for these sales.
              </Typography>
              <TableContainer component={Paper} sx={{ overflowX: "auto" }}>
                <Table size="small" sx={{ minWidth: 480 }}>
                  <TableHead><TableRow>
                    <TableCell sx={{ ...cellSx, fontWeight: 700 }}>Customer</TableCell>
                    <TableCell sx={{ ...cellSx, fontWeight: 700 }}>Sale</TableCell>
                    <TableCell sx={{ ...cellSx, fontWeight: 700 }}>Date</TableCell>
                    <TableCell sx={{ ...cellSx, fontWeight: 700 }}>Quantity</TableCell>
                  </TableRow></TableHead>
                  <TableBody>
                    {unallocated.map((m: any) => (
                      <TableRow key={m.sale_id}>
                        <TableCell sx={cellSx}>{m.customer_name || "Walk-in"}</TableCell>
                        <TableCell sx={cellSx} className="tnum">Sale #{m.sale_id}</TableCell>
                        <TableCell sx={cellSx}>{m.sold_at ? formatDate(m.sold_at) : "—"}</TableCell>
                        <TableCell sx={cellSx} className="tnum">{m.quantity}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </Box>
          )}
        </>
      )}
    </Box>
  );
};
