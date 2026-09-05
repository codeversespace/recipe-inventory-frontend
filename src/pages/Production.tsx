import { Alert, Box, Button, Card, CardContent, CircularProgress, Dialog, DialogActions, DialogContent, DialogTitle, FormControl, InputLabel, MenuItem, Paper, Select, Snackbar, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, TextField, Typography } from "@mui/material";
import AddRoundedIcon from "@mui/icons-material/AddRounded";
import { useBatchDetail, useBatches, useCostPreview, useProduceBatch, useRecipes, useUpdateBatch } from "../hooks/useApi";
import { useState } from "react";

export const Production = () => {
  const { data: recipes = [] } = useRecipes();
  const { data: batches = [], isLoading: batchesLoading } = useBatches(50);
  const produce = useProduceBatch();
  const updateBatch = useUpdateBatch();
  const [open, setOpen] = useState(false);
  const [recipeId, setRecipeId] = useState(0);
  const [producedQty, setProducedQty] = useState("");
  const [scaleMode, setScaleMode] = useState<"output" | "batches">("output");
  const [batchCount, setBatchCount] = useState("1");
  const [method, setMethod] = useState<"FIFO" | "LIFO" | "AVG">("AVG");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const { data: preview, isFetching: previewLoading } = useCostPreview(recipeId, producedQty);
  const [detailId, setDetailId] = useState<number | null>(null);
  const [editOpen, setEditOpen] = useState(false);
  const [editQty, setEditQty] = useState("");
  const [editDate, setEditDate] = useState("");
  const [editPrice, setEditPrice] = useState("");
  const { data: detail, isFetching: detailLoading } = useBatchDetail(detailId);

  const openEdit = () => {
    if (!detail) return;
    setEditQty(String(detail.produced_qty));
    setEditDate(new Date(detail.produced_at).toISOString().slice(0, 10));
    setEditPrice(detail.total_revenue == null ? "" : String(detail.total_revenue));
    setEditOpen(true);
  };

  const saveEdit = async () => {
    if (!detailId || !detail || !editDate) return;
    try {
      await updateBatch.mutateAsync({ id: detailId, produced_qty: detail.produced_qty, produced_at: new Date(`${editDate}T00:00:00`).toISOString(), selling_price: editPrice ? Number(editPrice) : null });
      setEditOpen(false);
      setSuccess(`Batch #${detailId} updated.`);
    } catch (requestError: any) {
      setError(requestError.response?.data?.detail || "Could not update the batch.");
    }
  };

  const close = () => { setOpen(false); setError(""); };
  const submit = async () => {
    const quantity = scaleMode === "batches" ? Number(batchCount) * (recipes.find((recipe: any) => recipe.id === recipeId)?.batch_qty || 0) : Number(producedQty);
    if (!recipeId || !Number.isFinite(quantity) || quantity <= 0) { setError("Choose a recipe and enter a quantity greater than zero."); return; }
    try {
      const batch = await produce.mutateAsync({ recipe_id: recipeId, produced_qty: quantity, costing_method: method });
      setSuccess(`Batch #${batch.id} recorded successfully.`); close(); setProducedQty(""); setBatchCount("1");
    } catch (requestError: any) { setError(requestError.response?.data?.detail || "Could not record the batch."); }
  };

  const cellSx = { py: 0.75, px: 1, fontSize: { xs: "0.7rem", sm: "0.8rem" } };

  return <Box>
    <Box sx={{ display: "flex", alignItems: { xs: "stretch", sm: "center" }, flexDirection: { xs: "column", sm: "row" }, justifyContent: "space-between", gap: 1.5, mb: 2 }}>
      <Box><Typography variant="h4" sx={{ fontWeight: 700, fontSize: { xs: "1.5rem", sm: "2rem" } }}>Production</Typography><Typography color="text.secondary" sx={{ fontSize: { xs: "0.75rem", sm: "0.875rem" } }}>Record batches and review recent output.</Typography></Box>
      <Button startIcon={<AddRoundedIcon />} variant="contained" size="small" onClick={() => setOpen(true)} disabled={!recipes.length} sx={{ fontSize: { xs: "0.75rem", sm: "0.875rem" } }}>Record batch</Button>
    </Box>
    <Card sx={{ mb: 2, background: "linear-gradient(135deg, #0f766e, #0891b2)", color: "white" }}><CardContent sx={{ p: { xs: 1.5, sm: 2 }, "&:last-child": { pb: { xs: 1.5, sm: 2 } } }}><Typography variant="overline" sx={{ opacity: .8, fontSize: "0.65rem" }}>Production history</Typography><Typography variant="h5" sx={{ fontWeight: 700, fontSize: { xs: "1.25rem", sm: "1.5rem" } }}>{batches.length} batches recorded</Typography></CardContent></Card>
    <TableContainer component={Paper} sx={{ overflowX: "auto" }}>
      <Table size="small"><TableHead><TableRow><TableCell sx={{ ...cellSx, fontWeight: 700 }}>#</TableCell><TableCell sx={{ ...cellSx, fontWeight: 700 }}>Recipe</TableCell><TableCell sx={{ ...cellSx, fontWeight: 700 }}>Date</TableCell><TableCell sx={{ ...cellSx, fontWeight: 700 }}>Qty</TableCell><TableCell sx={{ ...cellSx, fontWeight: 700 }}>Cost</TableCell><TableCell sx={{ ...cellSx, fontWeight: 700 }}>Profit</TableCell></TableRow></TableHead><TableBody>
        {batchesLoading ? <TableRow><TableCell colSpan={6} align="center"><CircularProgress size={24} /></TableCell></TableRow> : batches.length ? batches.map((batch: any) => <TableRow key={batch.id} hover onClick={() => setDetailId(batch.id)} sx={{ cursor: "pointer" }}><TableCell sx={cellSx}>{batch.id}</TableCell><TableCell sx={{ ...cellSx, fontWeight: 600 }}>{batch.recipe_name}</TableCell><TableCell sx={cellSx}>{new Date(batch.produced_at).toLocaleDateString()}</TableCell><TableCell sx={cellSx}>{batch.produced_qty}</TableCell><TableCell sx={cellSx}>₹{batch.total_cost.toFixed(0)}</TableCell><TableCell sx={{ ...cellSx, color: (batch.profit ?? 0) >= 0 ? "success.main" : "error.main", fontWeight: 700 }}>{batch.profit == null ? "—" : `₹${batch.profit.toFixed(0)}`}</TableCell></TableRow>) : <TableRow><TableCell colSpan={6} align="center" sx={{ ...cellSx, py: 3 }}>No production batches recorded yet.</TableCell></TableRow>}
      </TableBody></Table>
    </TableContainer>
    <Dialog open={open} onClose={close} maxWidth="sm" fullWidth><DialogTitle sx={{ fontWeight: 750 }}>Record a batch</DialogTitle><DialogContent>
      {error && <Alert severity="error" sx={{ mb: 1 }}>{error}</Alert>}
      <FormControl fullWidth margin="dense"><InputLabel>Recipe</InputLabel><Select value={recipeId} label="Recipe" onChange={(event) => { const id = Number(event.target.value); setRecipeId(id); if (scaleMode === "batches") { const recipe = recipes.find((item: any) => item.id === id); if (recipe) setProducedQty(String(Number(batchCount) * recipe.batch_qty)); } }}>{recipes.map((recipe: any) => <MenuItem key={recipe.id} value={recipe.id}>{recipe.name}</MenuItem>)}</Select></FormControl>
      <FormControl fullWidth margin="dense"><InputLabel>Scale by</InputLabel><Select value={scaleMode} label="Scale by" onChange={(event) => setScaleMode(event.target.value as "output" | "batches")}><MenuItem value="output">Desired output quantity</MenuItem><MenuItem value="batches">Number of batches</MenuItem></Select></FormControl>
      {scaleMode === "output" ? <TextField margin="dense" label="Desired output quantity" type="number" fullWidth value={producedQty} onChange={(event) => setProducedQty(event.target.value)} /> : <TextField margin="dense" label="Number of batches" type="number" fullWidth value={batchCount} onChange={(event) => { const count = event.target.value; setBatchCount(count); const recipe = recipes.find((item: any) => item.id === recipeId); if (recipe) setProducedQty(String(Number(count) * recipe.batch_qty)); }} slotProps={{ htmlInput: { min: 0, step: "any" } }} />}
      <FormControl fullWidth margin="dense"><InputLabel>Costing method</InputLabel><Select value={method} label="Costing method" onChange={(event) => setMethod(event.target.value as any)}><MenuItem value="FIFO">FIFO</MenuItem><MenuItem value="LIFO">LIFO</MenuItem><MenuItem value="AVG">Weighted average</MenuItem></Select></FormControl>
      {previewLoading && <CircularProgress size={20} sx={{ mt: 2 }} />}
      {preview && <Box sx={{ mt: 2, p: 2, borderRadius: 2, bgcolor: "action.hover" }}><Typography sx={{ fontWeight: 700 }}>Live cost preview</Typography><Typography variant="body2">Scale: {preview.batch_multiplier}× · Estimated cost: ₹{preview.estimated_total_cost.toFixed(2)}{preview.estimated_profit != null ? ` · Estimated profit: ₹${preview.estimated_profit.toFixed(2)}` : ""}{preview.estimated_margin_pct != null ? ` · Margin: ${preview.estimated_margin_pct.toFixed(2)}%` : ""}</Typography>{preview.lines.map((line: any) => <Typography key={line.ingredient_id} variant="caption" sx={{ display: "block" }} color={line.is_short ? "error.main" : "text.secondary"}>{line.ingredient_name}: need {line.needed_qty} {line.unit} (₹{line.estimated_cost.toFixed(2)}), in stock {line.on_hand_qty}{line.is_short ? " — insufficient" : ""}</Typography>)}{preview.lines.some((line: any) => line.is_short) && <Alert severity="error" sx={{ mt: 1 }}>Insufficient stock. Add the missing ingredients before recording this batch.</Alert>}</Box>}
    </DialogContent><DialogActions sx={{ p: 2 }}><Button onClick={close}>Cancel</Button><Button variant="contained" onClick={submit} disabled={produce.isPending || !!preview?.lines.some((line: any) => line.is_short)}>{produce.isPending ? <CircularProgress size={22} /> : "Record batch"}</Button></DialogActions></Dialog>
    <Dialog open={!!detailId} onClose={() => setDetailId(null)} maxWidth="md" fullWidth><DialogTitle>Batch details</DialogTitle><DialogContent>{detailLoading ? <CircularProgress /> : detail && <Box><Typography><strong>#{detail.id} {detail.recipe_name}</strong> · {detail.produced_qty} output · {detail.costing_method}</Typography><Typography sx={{ mt: 1 }}>Cost: ₹{detail.total_cost.toFixed(2)} · Revenue: {detail.total_revenue == null ? "—" : `₹${detail.total_revenue.toFixed(2)}`} · Profit: {detail.profit == null ? "—" : `₹${detail.profit.toFixed(2)}`} · Margin: {detail.margin_pct == null ? "—" : `${detail.margin_pct.toFixed(2)}%`}</Typography><TableContainer component={Paper} sx={{ mt: 2 }}><Table size="small"><TableHead><TableRow><TableCell>Ingredient</TableCell><TableCell>Quantity</TableCell><TableCell>Unit cost</TableCell><TableCell>Line cost</TableCell></TableRow></TableHead><TableBody>{detail.consumptions.map((item: any, index: number) => <TableRow key={`${item.ingredient_name}-${index}`}><TableCell>{item.ingredient_name}</TableCell><TableCell>{item.qty_used}</TableCell><TableCell>₹{item.unit_cost.toFixed(2)}</TableCell><TableCell>₹{item.line_cost.toFixed(2)}</TableCell></TableRow>)}</TableBody></Table></TableContainer></Box>}</DialogContent><DialogActions><Button onClick={openEdit} disabled={!detail || detailLoading}>Edit batch</Button><Button onClick={() => setDetailId(null)}>Close</Button></DialogActions></Dialog>
    <Dialog open={editOpen} onClose={() => { setEditOpen(false); setError(""); }} maxWidth="sm" fullWidth><DialogTitle>Update batch record</DialogTitle><DialogContent>{error && <Alert severity="error" sx={{ mb: 1 }}>{error}</Alert>}<Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>Produced quantity is fixed after recording because it is tied to ingredient consumption and stock.</Typography><TextField fullWidth margin="dense" label="Produced quantity" type="number" value={editQty} disabled /><TextField fullWidth margin="dense" label="Production date" type="date" value={editDate} onChange={(event) => setEditDate(event.target.value)} slotProps={{ inputLabel: { shrink: true } }} /><TextField fullWidth margin="dense" label="Total selling revenue (optional)" type="number" value={editPrice} onChange={(event) => setEditPrice(event.target.value)} /></DialogContent><DialogActions><Button onClick={() => setEditOpen(false)}>Cancel</Button><Button variant="contained" onClick={saveEdit} disabled={updateBatch.isPending}>Save changes</Button></DialogActions></Dialog>
    <Snackbar open={!!success} autoHideDuration={3500} onClose={() => setSuccess("")}><Alert severity="success" variant="filled">{success}</Alert></Snackbar>
  </Box>;
};
