// src/pages/Purchases.tsx
import {
  Box,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Select,
  MenuItem,
  InputLabel,
  FormControl,
  TableContainer,
  Paper,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  Typography,
} from "@mui/material";
import { useIngredients, usePurchaseLots, useAddPurchaseLot, useDeletePurchaseLot, useUpdatePurchaseLot } from "../hooks/useApi";
import { useState, useEffect } from "react";

export const Purchases = () => {
  const { data: ingredients } = useIngredients();
  const [selectedIngredient, setSelectedIngredient] = useState<number>(0);
  const { data: lots, refetch } = usePurchaseLots(selectedIngredient);
  const addLot = useAddPurchaseLot();
  const updateLot = useUpdatePurchaseLot();
  const deleteLot = useDeletePurchaseLot();

  const [open, setOpen] = useState(false);
  const [qty, setQty] = useState("");
  const [price, setPrice] = useState("");
  const [supplier, setSupplier] = useState("");
  const [reference, setReference] = useState("");
  const [lotNumber, setLotNumber] = useState("");
  const [expiryDate, setExpiryDate] = useState("");
  const [editingLot, setEditingLot] = useState<any>(null);

  // Refresh lots when the selected ingredient changes
  useEffect(() => {
    if (selectedIngredient) refetch();
  }, [selectedIngredient, refetch]);

  const handleAdd = async () => {
    const payload = { ingredient_id: selectedIngredient, qty: parseFloat(qty), unit_price: parseFloat(price), supplier: supplier || undefined, reference: reference || undefined, lot_number: lotNumber || undefined, expiry_date: expiryDate || undefined };
    if (!selectedIngredient || !Number.isFinite(payload.qty) || payload.qty <= 0 || !Number.isFinite(payload.unit_price) || payload.unit_price <= 0) { alert("Enter a valid ingredient, quantity, and unit price."); return; }
    if (editingLot) await updateLot.mutateAsync({ ...payload, id: editingLot.id });
    else await addLot.mutateAsync(payload);
    setOpen(false);
    setQty("");
    setPrice("");
    setSupplier(""); setReference(""); setLotNumber(""); setExpiryDate("");
    setEditingLot(null);
    refetch();
  };
  const editLot = async (lot: any) => {
    setEditingLot(lot); setQty(String(lot.qty)); setPrice(String(lot.unit_price)); setSupplier(lot.supplier || ""); setReference(lot.reference || ""); setLotNumber(lot.lot_number || ""); setExpiryDate(lot.expiry_date || ""); setOpen(true);
  };
  const removeLot = async (lot: any) => {
    if (window.confirm(`Delete purchase lot ${lot.id}?`)) { await deleteLot.mutateAsync({ ingredient_id: selectedIngredient, id: lot.id }); refetch(); }
  };

  return (
    <Box>
      <Box sx={{ display: "flex", justifyContent: "space-between", mb: 2 }}>
        <Typography variant="h4">Purchase Ledger</Typography>
        <Button
          variant="contained"
          onClick={() => { setEditingLot(null); setQty(""); setPrice(""); setSupplier(""); setReference(""); setLotNumber(""); setExpiryDate(""); setOpen(true); }}
          disabled={!ingredients?.length}
        >
          Add Purchase
        </Button>
      </Box>

      {/* ---------- Ingredient selector ---------- */}
      <FormControl fullWidth margin="dense">
        <InputLabel>Ingredient</InputLabel>
        <Select
          value={selectedIngredient}
          label="Ingredient"
          onChange={(e) => setSelectedIngredient(e.target.value as number)}
        >
          {ingredients?.map((ing: any) => (
            <MenuItem key={ing.id} value={ing.id}>
              {ing.name}
            </MenuItem>
          ))}
        </Select>
      </FormControl>

      {/* ---------- Lots table ---------- */}
      {selectedIngredient ? (
        lots?.length ? (
          <TableContainer component={Paper} sx={{ mt: 2 }}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Lot ID</TableCell>
                  <TableCell>Qty</TableCell>
                  <TableCell>Unit Price (₹)</TableCell>
                  <TableCell>Price Change</TableCell>
                  <TableCell>Received At</TableCell>
                  <TableCell>Supplier</TableCell>
                  <TableCell>Invoice / Reference</TableCell>
                  <TableCell>Lot</TableCell>
                  <TableCell>Expiry</TableCell>
                  <TableCell>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {lots?.map((lot: any, index: number) => (
                  <TableRow key={lot.id}>
                    <TableCell>{lot.id}</TableCell>
                    <TableCell>{lot.qty}</TableCell>
                    <TableCell>{lot.unit_price}</TableCell>
                    <TableCell>{index === lots.length - 1 ? "—" : `${lot.unit_price >= lots[index + 1].unit_price ? "+" : ""}${(lot.unit_price - lots[index + 1].unit_price).toFixed(2)}`}</TableCell>
                    <TableCell>
                      {new Date(lot.received_at).toLocaleString()}
                    </TableCell>
                    <TableCell>{lot.supplier || "—"}</TableCell>
                    <TableCell>{lot.reference || "—"}</TableCell>
                    <TableCell>{lot.lot_number || "—"}</TableCell>
                    <TableCell>{lot.expiry_date || "—"}</TableCell>
                    <TableCell><Button size="small" onClick={() => editLot(lot)}>Edit</Button><Button size="small" color="error" onClick={() => removeLot(lot)}>Delete</Button></TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        ) : (
          <Typography sx={{ mt: 2 }}>No lots for this ingredient.</Typography>
        )
      ) : (
        <Typography>Select an ingredient to view its purchase lots.</Typography>
      )}

      {/* ---------- Add purchase dialog ---------- */}
      <Dialog open={open} onClose={() => setOpen(false)}>
        <DialogTitle>{editingLot ? "Edit Purchase Lot" : "Add Purchase Lot"}</DialogTitle>
        <DialogContent>
          <FormControl fullWidth margin="dense">
            <InputLabel>Ingredient</InputLabel>
            <Select
              value={selectedIngredient}
              label="Ingredient"
              onChange={(e) => setSelectedIngredient(e.target.value as number)}
            >
              {ingredients?.map((ing: any) => (
                <MenuItem key={ing.id} value={ing.id}>
                  {ing.name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <TextField
            margin="dense"
            label="Qty"
            fullWidth
            value={qty}
            onChange={(e) => setQty(e.target.value)}
          />
          <TextField margin="dense" label="Supplier" fullWidth value={supplier} onChange={(e) => setSupplier(e.target.value)} />
          <TextField margin="dense" label="Invoice / reference number" fullWidth value={reference} onChange={(e) => setReference(e.target.value)} />
          <TextField margin="dense" label="Lot number" fullWidth value={lotNumber} onChange={(e) => setLotNumber(e.target.value)} />
          <TextField margin="dense" label="Expiry date" type="date" fullWidth value={expiryDate} onChange={(e) => setExpiryDate(e.target.value)} slotProps={{ inputLabel: { shrink: true } }} />
          <TextField
            margin="dense"
            label="Unit Price (₹)"
            fullWidth
            value={price}
            onChange={(e) => setPrice(e.target.value)}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpen(false)}>Cancel</Button>
          <Button onClick={handleAdd} variant="contained">
            {editingLot ? "Update" : "Save"}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};
