// src/pages/Ingredients.tsx
import {
  Box,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  TableContainer,
  Paper,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  CircularProgress,
  Typography,
} from "@mui/material";
import { useIngredients, useAddIngredient, useDeleteIngredient, useUpdateIngredient } from "../hooks/useApi";
import { useState } from "react";

export const Ingredients = () => {
  const { data:ingredients = [], isLoading, error } = useIngredients();
  const addIngredient = useAddIngredient();
  const updateIngredient = useUpdateIngredient();
  const deleteIngredient = useDeleteIngredient();

  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [unit, setUnit] = useState("");
  const [minStock, setMinStock] = useState("");
  const [editingId, setEditingId] = useState<number | null>(null);

  const handleSave = async () => {
    const threshold = Number(minStock);
    if (!name.trim() || !unit.trim() || !Number.isFinite(threshold) || threshold < 0) { alert("Enter valid ingredient details and a non-negative minimum stock."); return; }
    if (editingId) await updateIngredient.mutateAsync({ id: editingId, name, base_unit: unit, min_stock: threshold });
    else await addIngredient.mutateAsync({ name, base_unit: unit, min_stock: threshold });
    setOpen(false);
    setName("");
    setUnit("");
    setMinStock("");
    setEditingId(null);
  };

  const editIngredient = async (ingredient: any) => {
    setEditingId(ingredient.id);
    setName(ingredient.name);
    setUnit(ingredient.base_unit);
    setMinStock(String(ingredient.min_stock ?? 0));
    setOpen(true);
  };

  const removeIngredient = async (ingredient: any) => {
    if (window.confirm(`Delete ${ingredient.name}?`)) {
      try { await deleteIngredient.mutateAsync(ingredient.id); }
      catch (requestError: any) { alert(requestError.response?.data?.detail || "Could not delete ingredient."); }
    }
  };

  return (
    <Box>
      <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1.5, alignItems: "center", justifyContent: "space-between", mb: 2 }}>
        <Typography variant="h4">Ingredients</Typography>
        <Button variant="contained" onClick={() => { setEditingId(null); setName(""); setUnit(""); setMinStock(""); setOpen(true); }}>
          Add Ingredient
        </Button>
      </Box>

      {isLoading ? (
        <CircularProgress />
      ) : error ? (
        <Typography color="error">{(error as any).message}</Typography>
      ) : (
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>ID</TableCell>
                <TableCell>Name</TableCell>
                <TableCell>Unit</TableCell>
                <TableCell>Minimum Stock</TableCell>
                <TableCell>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {ingredients?.map((ing: any) => (
                <TableRow key={ing.id}>
                  <TableCell>{ing.id}</TableCell>
                  <TableCell>{ing.name}</TableCell>
                  <TableCell>{ing.base_unit}</TableCell>
                  <TableCell>{ing.min_stock ?? 0}</TableCell>
                  <TableCell><Button size="small" onClick={() => editIngredient(ing)}>Edit</Button><Button size="small" color="error" onClick={() => removeIngredient(ing)}>Delete</Button></TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      {/* ---------- Add dialog ---------- */}
      <Dialog open={open} onClose={() => setOpen(false)}>
        <DialogTitle>{editingId ? "Edit Ingredient" : "Add Ingredient"}</DialogTitle>
        <DialogContent>
          <TextField
            margin="dense"
            label="Name"
            fullWidth
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
          <TextField
            margin="dense"
            label="Minimum stock alert level"
            type="number"
            fullWidth
            value={minStock}
            onChange={(e) => setMinStock(e.target.value)}
            slotProps={{ htmlInput: { min: 0, step: "any" } }}
          />
          <TextField
            margin="dense"
            label="Unit (e.g. kg, L, pcs)"
            fullWidth
            value={unit}
            onChange={(e) => setUnit(e.target.value)}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpen(false)}>Cancel</Button>
          <Button onClick={handleSave} variant="contained">
            {editingId ? "Update" : "Save"}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};
