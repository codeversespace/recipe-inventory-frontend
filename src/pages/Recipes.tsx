import { Alert, Box, Button, CircularProgress, Dialog, DialogActions, DialogContent, DialogTitle, FormControl, InputLabel, MenuItem, Paper, Select, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, TextField, Typography } from "@mui/material";
import { useAddRecipe, useAddRecipeIngredient, useDeleteRecipe, useIngredients, useRecipes, useUpdateRecipe } from "../hooks/useApi";
import { useState } from "react";
import { api } from "../api/client";

type Line = { id?: number; ingredientId: number; name: string; quantity: number; unit: string };

export const Recipes = () => {
  const { data: recipes = [], isLoading, error } = useRecipes();
  const { data: ingredients = [] } = useIngredients();
  const addRecipe = useAddRecipe();
  const addRecipeIngredient = useAddRecipeIngredient();
  const updateRecipe = useUpdateRecipe();
  const deleteRecipe = useDeleteRecipe();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [batchQty, setBatchQty] = useState("");
  const [batchUnit, setBatchUnit] = useState("");
  const [sellPrice, setSellPrice] = useState("");
  const [ingredientId, setIngredientId] = useState(0);
  const [lineQty, setLineQty] = useState("");
  const [lines, setLines] = useState<Line[]>([]);
  const [formError, setFormError] = useState("");
  const [editingId, setEditingId] = useState<number | null>(null);

  const reset = () => {
    setName(""); setBatchQty(""); setBatchUnit(""); setSellPrice("");
    setIngredientId(0); setLineQty(""); setLines([]); setFormError(""); setEditingId(null);
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
      const payload = { name: name.trim(), batch_qty: quantity, batch_unit: batchUnit.trim(), selling_price: sellPrice ? Number(sellPrice) : null };
      const recipe = editingId ? await updateRecipe.mutateAsync({ id: editingId, ...payload }) : await addRecipe.mutateAsync(payload);
      if (editingId) await Promise.all(lines.filter((line) => line.id).map((line) => api.delete(`/recipes/${recipe.id}/ingredients/${line.id}`)));
      await Promise.all(lines.map((line) => addRecipeIngredient.mutateAsync({ recipe_id: recipe.id, ingredient_id: line.ingredientId, qty_per_batch: line.quantity, unit: line.unit })));
      close();
    } catch (requestError: any) {
      const detail = requestError.response?.data?.detail;
      setFormError(Array.isArray(detail) ? detail.map((item) => item.msg).join("; ") : detail || "Could not save the recipe.");
    }
  };
  const editRecipe = async (recipe: any) => {
    const { data } = await api.get(`/recipes/${recipe.id}/ingredients`);
    setEditingId(recipe.id); setName(recipe.name); setBatchQty(String(recipe.batch_qty)); setBatchUnit(recipe.batch_unit); setSellPrice(recipe.selling_price ?? "");
    setLines(data.map((line: any) => ({ id: line.id, ingredientId: line.ingredient_id, name: line.ingredient.name, quantity: line.qty_per_batch, unit: line.unit })));
    setOpen(true);
  };
  const removeRecipe = async (recipe: any) => {
    if (window.confirm(`Delete ${recipe.name}?`)) try { await deleteRecipe.mutateAsync(recipe.id); } catch (requestError: any) { alert(requestError.response?.data?.detail || "Could not delete recipe."); }
  };

  return <Box>
    <Box sx={{ display: "flex", justifyContent: "space-between", mb: 2 }}><Typography variant="h4">Recipes</Typography><Button variant="contained" onClick={() => { reset(); setOpen(true); }}>Add Recipe</Button></Box>
    {isLoading ? <CircularProgress /> : error ? <Typography color="error">{(error as Error).message}</Typography> :
      <TableContainer component={Paper}><Table><TableHead><TableRow><TableCell>Name</TableCell><TableCell>Batch Qty</TableCell><TableCell>Batch Unit</TableCell><TableCell>Default Sell (per kg)</TableCell><TableCell>Actions</TableCell></TableRow></TableHead><TableBody>
        {recipes.map((recipe) => <TableRow key={recipe.id}><TableCell>{recipe.name}</TableCell><TableCell>{recipe.batch_qty}</TableCell><TableCell>{recipe.batch_unit}</TableCell><TableCell>{recipe.selling_price ?? "—"}</TableCell><TableCell><Button size="small" onClick={() => editRecipe(recipe)}>Edit</Button><Button size="small" color="error" onClick={() => removeRecipe(recipe)}>Delete</Button></TableCell></TableRow>)}
      </TableBody></Table></TableContainer>}
    <Dialog open={open} onClose={close} maxWidth="sm" fullWidth><DialogTitle>{editingId ? "Edit Recipe" : "Add Recipe"}</DialogTitle><DialogContent>
      {formError && <Alert severity="error" sx={{ mt: 1 }}>{formError}</Alert>}
      <TextField margin="dense" label="Name" fullWidth value={name} onChange={(event) => setName(event.target.value)} />
      <TextField margin="dense" label="Batch Qty" fullWidth value={batchQty} onChange={(event) => setBatchQty(event.target.value)} />
      <TextField margin="dense" label="Batch Unit (kg, L, pcs)" fullWidth value={batchUnit} onChange={(event) => setBatchUnit(event.target.value)} />
      <TextField margin="dense" label="Default selling price per kg (optional)" fullWidth value={sellPrice} onChange={(event) => setSellPrice(event.target.value)} />
      <Typography variant="subtitle1" sx={{ mt: 3 }}>Ingredients</Typography>
      {!ingredients.length && <Alert severity="info" sx={{ mt: 1 }}>Add ingredients first from the Ingredients page.</Alert>}
      <Box sx={{ display: "flex", gap: 1, alignItems: "center", mt: 1 }}><FormControl fullWidth size="small"><InputLabel>Ingredient</InputLabel><Select value={ingredientId} label="Ingredient" onChange={(event) => setIngredientId(Number(event.target.value))}><MenuItem value={0}><em>Select an ingredient</em></MenuItem>{ingredients.map((ingredient) => <MenuItem key={ingredient.id} value={ingredient.id}>{ingredient.name} ({ingredient.base_unit})</MenuItem>)}</Select></FormControl><TextField size="small" label="Qty" value={lineQty} onChange={(event) => setLineQty(event.target.value)} sx={{ width: 100 }} /><Button onClick={addLine} variant="outlined" disabled={!ingredients.length}>Add</Button></Box>
      {lines.map((line) => <Box key={line.ingredientId} sx={{ display: "flex", justifyContent: "space-between", mt: 1 }}><Typography>{line.name}: {line.quantity} {line.unit}</Typography><Button size="small" color="error" onClick={() => setLines(lines.filter((item) => item.ingredientId !== line.ingredientId))}>Remove</Button></Box>)}
    </DialogContent><DialogActions><Button onClick={close}>Cancel</Button><Button onClick={save} variant="contained" disabled={addRecipe.isPending || addRecipeIngredient.isPending}>{editingId ? "Update Recipe" : "Save Recipe"}</Button></DialogActions></Dialog>
  </Box>;
};
