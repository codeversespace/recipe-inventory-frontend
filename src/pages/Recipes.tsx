import { Alert, Box, Button, CircularProgress, Dialog, DialogActions, DialogContent, DialogTitle, FormControl, InputLabel, MenuItem, Paper, Select, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, TextField, Typography } from "@mui/material";
import { useAddIngredient, useAddRecipe, useAddRecipeIngredient, useDeleteRecipe, useIngredients, useRecipes, useUpdateRecipe, useRecipeOverheads, useAddRecipeOverhead, useDeleteRecipeOverhead } from "../hooks/useApi";
import { useState } from "react";
import { api } from "../api/client";

type Line = { id?: number; ingredientId: number; name: string; quantity: number; unit: string };
type OverheadLine = { name: string; cost_per_batch: number; overhead_type: string };

export const Recipes = () => {
  const { data: recipes = [], isLoading, error } = useRecipes();
  const { data: ingredients = [] } = useIngredients();
  const addRecipe = useAddRecipe();
  const addRecipeIngredient = useAddRecipeIngredient();
  const addRecipeOverhead = useAddRecipeOverhead();
  const addIngredient = useAddIngredient();
  const updateRecipe = useUpdateRecipe();
  const deleteRecipe = useDeleteRecipe();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [batchQty, setBatchQty] = useState("");
  const [batchUnit, setBatchUnit] = useState("");
  const [ingredientId, setIngredientId] = useState(0);
  const [lineQty, setLineQty] = useState("");
  const [lines, setLines] = useState<Line[]>([]);
  const [formError, setFormError] = useState("");
  const [editingId, setEditingId] = useState<number | null>(null);
  const [newIngredientOpen, setNewIngredientOpen] = useState(false);
  const [newIngredientName, setNewIngredientName] = useState("");
  const [newIngredientUnit, setNewIngredientUnit] = useState("");
  const [newIngredientMinStock, setNewIngredientMinStock] = useState("0");
  const [loadingAction, setLoadingAction] = useState("");
  const [scaleOpen, setScaleOpen] = useState(false);
  const [scaleRecipe, setScaleRecipe] = useState<any>(null);
  const [scaleTarget, setScaleTarget] = useState("");
  const [scaleLines, setScaleLines] = useState<{ name: string; qty: number; unit: string }[]>([]);
  const [overheads, setOverheads] = useState<OverheadLine[]>([]);
  const [overheadName, setOverheadName] = useState("");
  const [overheadCost, setOverheadCost] = useState("");
  const [overheadType, setOverheadType] = useState("other");

  const reset = () => {
    setName(""); setBatchQty(""); setBatchUnit("");
    setIngredientId(0); setLineQty(""); setLines([]); setFormError(""); setEditingId(null);
    setOverheads([]); setOverheadName(""); setOverheadCost(""); setOverheadType("other");
  };
  const close = () => { reset(); setOpen(false); };

  const addLine = () => {
    const ingredient = ingredients.find((item) => item.id === ingredientId);
    const quantity = Number(lineQty);
    if (!ingredient || !Number.isFinite(quantity) || quantity <= 0) {
      setFormError("Choose an ingredient and enter a quantity greater than zero."); return;
    }
    if (lines.some((line) => line.ingredientId === ingredient.id)) {
      setFormError("Each ingredient can appear only once in a recipe."); return;
    }
    setLines([...lines, { ingredientId: ingredient.id, name: ingredient.name, quantity, unit: ingredient.base_unit }]);
    setIngredientId(0); setLineQty(""); setFormError("");
  };

  const save = async () => {
    const quantity = Number(batchQty);
    if (!name.trim() || !Number.isFinite(quantity) || quantity <= 0 || !batchUnit.trim()) {
      setFormError("Enter a recipe name, batch quantity, and batch unit."); return;
    }
    if (!lines.length) { setFormError("Add at least one ingredient to the recipe."); return; }
    try {
      const payload = { name: name.trim(), batch_qty: quantity, batch_unit: batchUnit.trim() };
      const recipe = editingId ? await updateRecipe.mutateAsync({ id: editingId, ...payload }) : await addRecipe.mutateAsync(payload);
      if (editingId) {
        const { data: existingLines } = await api.get(`/recipes/${recipe.id}/ingredients`);
        await Promise.all(existingLines.map((line: any) => api.delete(`/recipes/${recipe.id}/ingredients/${line.id}`)));
      }
      await Promise.all(lines.map((line) => addRecipeIngredient.mutateAsync({ recipe_id: recipe.id, ingredient_id: line.ingredientId, qty_per_batch: line.quantity, unit: line.unit })));
      for (const oh of overheads) {
        await addRecipeOverhead.mutateAsync({ recipe_id: recipe.id, name: oh.name, cost_per_batch: oh.cost_per_batch, overhead_type: oh.overhead_type });
      }
      close();
    } catch (requestError: any) {
      const detail = requestError.response?.data?.detail;
      setFormError(Array.isArray(detail) ? detail.map((item) => item.msg).join("; ") : detail || "Could not save the recipe.");
    }
  };
  const editRecipe = async (recipe: any) => {
    const { data } = await api.get(`/recipes/${recipe.id}/ingredients`);
    const { data: overheadData } = await api.get(`/recipes/${recipe.id}/overheads`);
    setEditingId(recipe.id); setName(recipe.name); setBatchQty(String(recipe.batch_qty)); setBatchUnit(recipe.batch_unit);
    setLines(data.map((line: any) => ({ id: line.id, ingredientId: line.ingredient_id, name: line.ingredient.name, quantity: line.qty_per_batch, unit: line.unit })));
    setOverheads(overheadData.map((oh: any) => ({ name: oh.name, cost_per_batch: oh.cost_per_batch, overhead_type: oh.overhead_type })));
    setOpen(true);
  };
  const removeRecipe = async (recipe: any) => {
    if (window.confirm(`Delete ${recipe.name}?`)) try { await deleteRecipe.mutateAsync(recipe.id); } catch (requestError: any) { alert(requestError.response?.data?.detail || "Could not delete recipe."); }
  };
  const saveNewIngredient = async () => {
    const minStock = Number(newIngredientMinStock);
    if (!newIngredientName.trim() || !newIngredientUnit.trim() || !Number.isFinite(minStock) || minStock < 0) {
      setFormError("Enter a valid ingredient name, unit, and minimum stock.");
      return;
    }
    try {
      const ingredient = await addIngredient.mutateAsync({ name: newIngredientName.trim(), base_unit: newIngredientUnit.trim(), min_stock: minStock });
      setIngredientId(ingredient.id);
      setNewIngredientName("");
      setNewIngredientUnit("");
      setNewIngredientMinStock("0");
      setNewIngredientOpen(false);
      setFormError("");
    } catch (requestError: any) {
      setFormError(requestError.response?.data?.detail || "Could not add ingredient.");
    }
  };

  const cellSx = { py: 0.75, px: 1, fontSize: { xs: "0.7rem", sm: "0.8rem" } };

  const openScale = async (recipe: any) => {
    try {
      const { data } = await api.get(`/recipes/${recipe.id}/ingredients`);
      setScaleRecipe(recipe);
      setScaleTarget(String(recipe.batch_qty));
      setScaleLines(data.map((line: any) => ({ name: line.ingredient.name, qty: line.qty_per_batch, unit: line.unit })));
      setScaleOpen(true);
    } catch { /* ignore */ }
  };

  const scaleMultiplier = scaleRecipe && Number(scaleTarget) > 0 ? Number(scaleTarget) / scaleRecipe.batch_qty : 1;

  return <Box>
    <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 2 }}>
      <Typography variant="h4" sx={{ fontSize: { xs: "1.5rem", sm: "2rem" }, fontWeight: 700 }}>Recipes</Typography>
      <Button variant="contained" size="small" onClick={() => { reset(); setOpen(true); }} sx={{ fontSize: { xs: "0.75rem", sm: "0.875rem" } }}>Add Recipe</Button>
    </Box>
    {isLoading ? <Box sx={{ display: "flex", justifyContent: "center", py: 4 }}><CircularProgress /></Box> : error ? <Typography color="error" sx={{ fontSize: "0.85rem" }}>{(error as Error).message}</Typography> :
      <TableContainer component={Paper} sx={{ overflowX: "auto" }}><Table size="small"><TableHead><TableRow><TableCell sx={{ ...cellSx, fontWeight: 700 }}>Name</TableCell><TableCell sx={{ ...cellSx, fontWeight: 700 }}>Batch</TableCell><TableCell sx={{ ...cellSx, fontWeight: 700 }}>Unit</TableCell><TableCell sx={{ ...cellSx, fontWeight: 700 }}>Actions</TableCell></TableRow></TableHead><TableBody>
        {recipes.map((recipe) => <TableRow key={recipe.id}><TableCell sx={{ ...cellSx, fontWeight: 600 }}>{recipe.name}</TableCell><TableCell sx={cellSx}>{recipe.batch_qty}</TableCell><TableCell sx={cellSx}>{recipe.batch_unit}</TableCell><TableCell sx={cellSx}><Button size="small" sx={{ fontSize: "0.7rem", minWidth: "auto", px: 1.5, minHeight: 32 }} disabled={!!loadingAction} onClick={() => openScale(recipe)}>Scale</Button><Button size="small" sx={{ fontSize: "0.7rem", minWidth: "auto", px: 1.5, minHeight: 32 }} disabled={!!loadingAction} onClick={async () => { setLoadingAction(`edit-${recipe.id}`); try { await editRecipe(recipe); } finally { setLoadingAction(""); } }}>{loadingAction === `edit-${recipe.id}` ? <CircularProgress size={14} /> : "Edit"}</Button><Button size="small" color="error" sx={{ fontSize: "0.7rem", minWidth: "auto", px: 1.5, minHeight: 32 }} disabled={!!loadingAction} onClick={async () => { setLoadingAction(`delete-${recipe.id}`); try { await removeRecipe(recipe); } finally { setLoadingAction(""); } }}>{loadingAction === `delete-${recipe.id}` ? <CircularProgress size={14} /> : "Del"}</Button></TableCell></TableRow>)}
      </TableBody></Table></TableContainer>}
    <Dialog open={open} onClose={close} maxWidth="sm" fullWidth><DialogTitle>{editingId ? "Edit Recipe" : "Add Recipe"}</DialogTitle><DialogContent>
      {formError && <Alert severity="error" sx={{ mt: 1 }}>{formError}</Alert>}
      <TextField margin="dense" label="Name" fullWidth value={name} onChange={(event) => setName(event.target.value)} />
      <TextField margin="dense" label="Batch Qty" fullWidth value={batchQty} onChange={(event) => setBatchQty(event.target.value)} />
      <TextField margin="dense" label="Batch Unit (kg, L, pcs)" fullWidth value={batchUnit} onChange={(event) => setBatchUnit(event.target.value)} />
      <Typography variant="subtitle1" sx={{ mt: 3 }}>Ingredients</Typography>
      {!ingredients.length && <Alert severity="info" sx={{ mt: 1 }}>Add ingredients first from the Ingredients page.</Alert>}
      <Box sx={{ display: "flex", gap: 1, alignItems: "center", mt: 1, flexWrap: "wrap" }}><FormControl sx={{ flex: 1, minWidth: 220 }} size="small"><InputLabel>Ingredient</InputLabel><Select value={ingredientId} label="Ingredient" onChange={(event) => setIngredientId(Number(event.target.value))}><MenuItem value={0}><em>Select an ingredient</em></MenuItem>{ingredients.map((ingredient) => <MenuItem key={ingredient.id} value={ingredient.id}>{ingredient.name} ({ingredient.base_unit})</MenuItem>)}</Select></FormControl><TextField size="small" label="Qty" value={lineQty} onChange={(event) => setLineQty(event.target.value)} sx={{ width: 100 }} /><Button onClick={addLine} variant="outlined" disabled={!ingredients.length}>Add</Button><Button onClick={() => setNewIngredientOpen(true)} variant="text">New ingredient</Button></Box>
      {lines.map((line) => <Box key={line.ingredientId} sx={{ display: "flex", justifyContent: "space-between", mt: 1 }}><Typography>{line.name}: {line.quantity} {line.unit}</Typography><Button size="small" color="error" onClick={() => setLines(lines.filter((item) => item.ingredientId !== line.ingredientId))}>Remove</Button></Box>)}
      {/* Overheads Section */}
      <Typography variant="subtitle1" sx={{ mt: 3 }}>Overheads (labour, fuel, consumables)</Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>Optional: per-batch costs not tied to ingredients.</Typography>
      <Box sx={{ display: "flex", gap: 1, alignItems: "center", flexWrap: "wrap" }}>
        <TextField size="small" label="Name" value={overheadName} onChange={(e) => setOverheadName(e.target.value)} sx={{ flex: "1 1 160px" }} />
        <TextField size="small" label="Cost (₹)" type="number" value={overheadCost} onChange={(e) => setOverheadCost(e.target.value)} sx={{ flex: "0 1 100px" }} />
        <FormControl size="small" sx={{ flex: "0 1 140px" }}>
          <InputLabel>Type</InputLabel>
          <Select value={overheadType} label="Type" onChange={(e) => setOverheadType(e.target.value)}>
            <MenuItem value="labour">Labour</MenuItem>
            <MenuItem value="fuel">Fuel / Electric</MenuItem>
            <MenuItem value="consumable">Consumable</MenuItem>
            <MenuItem value="other">Other</MenuItem>
          </Select>
        </FormControl>
        <Button onClick={() => {
          const cost = Number(overheadCost);
          if (!overheadName.trim() || !Number.isFinite(cost) || cost <= 0) { setFormError("Enter a valid overhead name and cost."); return; }
          setOverheads([...overheads, { name: overheadName.trim(), cost_per_batch: cost, overhead_type: overheadType }]);
          setOverheadName(""); setOverheadCost(""); setOverheadType("other"); setFormError("");
        }} variant="outlined" size="small">Add</Button>
      </Box>
      {overheads.map((oh, i) => <Box key={i} sx={{ display: "flex", justifyContent: "space-between", mt: 1 }}><Typography>{oh.name}: ₹{oh.cost_per_batch} ({oh.overhead_type})</Typography><Button size="small" color="error" onClick={() => setOverheads(overheads.filter((_, idx) => idx !== i))}>Remove</Button></Box>)}
    </DialogContent><DialogActions><Button onClick={close} disabled={addRecipe.isPending || addRecipeIngredient.isPending}>Cancel</Button><Button onClick={save} variant="contained" disabled={addRecipe.isPending || addRecipeIngredient.isPending}>{addRecipe.isPending || addRecipeIngredient.isPending ? <CircularProgress size={20} color="inherit" /> : editingId ? "Update Recipe" : "Save Recipe"}</Button></DialogActions></Dialog>
    <Dialog open={newIngredientOpen} onClose={() => setNewIngredientOpen(false)} maxWidth="xs" fullWidth><DialogTitle>New ingredient</DialogTitle><DialogContent>{formError && <Alert severity="error" sx={{ mb: 1 }}>{formError}</Alert>}<TextField autoFocus margin="dense" label="Name" fullWidth value={newIngredientName} onChange={(event) => setNewIngredientName(event.target.value)} /><TextField margin="dense" label="Unit (kg, L, pcs)" fullWidth value={newIngredientUnit} onChange={(event) => setNewIngredientUnit(event.target.value)} /><TextField margin="dense" label="Minimum stock alert" type="number" fullWidth value={newIngredientMinStock} onChange={(event) => setNewIngredientMinStock(event.target.value)} /></DialogContent><DialogActions><Button onClick={() => setNewIngredientOpen(false)} disabled={addIngredient.isPending}>Cancel</Button><Button onClick={saveNewIngredient} variant="contained" disabled={addIngredient.isPending}>{addIngredient.isPending ? <CircularProgress size={20} color="inherit" /> : "Add ingredient"}</Button></DialogActions></Dialog>
    {/* Scale Calculator Dialog */}
    <Dialog open={scaleOpen} onClose={() => setScaleOpen(false)} maxWidth="xs" fullWidth>
      <DialogTitle sx={{ fontWeight: 700 }}>Scale Recipe: {scaleRecipe?.name}</DialogTitle>
      <DialogContent>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>Original batch: {scaleRecipe?.batch_qty} {scaleRecipe?.batch_unit}</Typography>
        <TextField autoFocus margin="dense" label={`Target quantity (${scaleRecipe?.batch_unit})`} type="number" fullWidth size="small" value={scaleTarget} onChange={(e) => setScaleTarget(e.target.value)} />
        <Typography variant="subtitle2" sx={{ mt: 2, mb: 1, fontWeight: 700 }}>Scaled Ingredients ({scaleMultiplier.toFixed(2)}×)</Typography>
        {scaleLines.map((line, i) => (
          <Box key={i} sx={{ display: "flex", justifyContent: "space-between", py: 0.5, borderBottom: 1, borderColor: "divider" }}>
            <Typography variant="body2" sx={{ fontSize: "0.85rem" }}>{line.name}</Typography>
            <Typography variant="body2" sx={{ fontWeight: 700, fontSize: "0.85rem" }}>{(line.qty * scaleMultiplier).toFixed(2)} {line.unit}</Typography>
          </Box>
        ))}
      </DialogContent>
      <DialogActions><Button onClick={() => setScaleOpen(false)} size="small">Close</Button></DialogActions>
    </Dialog>
  </Box>;
};
