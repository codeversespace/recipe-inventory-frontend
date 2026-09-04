import {
  Alert,
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
import {
  useIngredients,
  usePurchaseLots,
  useAddPurchaseLot,
  useDeletePurchaseLot,
  useUpdatePurchaseLot,
  useManualStock,
  usePackingMaterials,
  useAddManualStock,
} from "../hooks/useApi";
import { useState, useEffect } from "react";

type PurchaseCategory = "raw_material" | "saleable_good" | "packing_material";

export const Purchases = () => {
  const { data: ingredients } = useIngredients();
  const { data: saleableGoods = [] } = useManualStock();
  const { data: packingMaterials = [] } = usePackingMaterials();
  const [category, setCategory] = useState<PurchaseCategory>("raw_material");
  const [selectedIngredient, setSelectedIngredient] = useState<number>(0);
  const { data: lots, refetch } = usePurchaseLots(selectedIngredient);
  const addLot = useAddPurchaseLot();
  const updateLot = useUpdatePurchaseLot();
  const deleteLot = useDeletePurchaseLot();
  const addSaleableGood = useAddManualStock();

  const [open, setOpen] = useState(false);
  const [qty, setQty] = useState("");
  const [price, setPrice] = useState("");
  const [supplier, setSupplier] = useState("");
  const [reference, setReference] = useState("");
  const [lotNumber, setLotNumber] = useState("");
  const [expiryDate, setExpiryDate] = useState("");
  const [saleableName, setSaleableName] = useState("");
  const [saleableUnit, setSaleableUnit] = useState("pcs");
  const [editingLot, setEditingLot] = useState<any>(null);
  const [formError, setFormError] = useState("");

  useEffect(() => {
    if (selectedIngredient) refetch();
  }, [selectedIngredient, refetch]);

  const resetForm = () => {
    setOpen(false);
    setQty("");
    setPrice("");
    setSupplier("");
    setReference("");
    setLotNumber("");
    setExpiryDate("");
    setSaleableName("");
    setSaleableUnit("pcs");
    setEditingLot(null);
    setFormError("");
  };

  const handleAdd = async () => {
    const quantity = parseFloat(qty);
    const unitPrice = parseFloat(price);
    if (!Number.isFinite(quantity) || quantity <= 0 || !Number.isFinite(unitPrice) || unitPrice <= 0) {
      setFormError("Enter a valid quantity and unit price.");
      return;
    }

    if (category !== "raw_material") {
      if (!saleableName.trim() || !saleableUnit.trim()) {
        setFormError("Enter a product name and unit.");
        return;
      }
      try {
        await addSaleableGood.mutateAsync({
        name: saleableName.trim(),
        qty: quantity,
        unit: saleableUnit.trim(),
        unit_price: unitPrice,
        category: category === "packing_material" ? "packing_material" : "saleable_good",
        });
        resetForm();
      } catch (requestError: any) {
        setFormError(requestError.response?.data?.detail || "Could not save purchase.");
      }
      return;
    }

    const payload = {
      ingredient_id: selectedIngredient,
      qty: quantity,
      unit_price: unitPrice,
      supplier: supplier || undefined,
      reference: reference || undefined,
      lot_number: lotNumber || undefined,
      expiry_date: expiryDate || undefined,
    };
    if (!selectedIngredient) {
      setFormError("Select an ingredient.");
      return;
    }
    try {
      if (editingLot) await updateLot.mutateAsync({ ...payload, id: editingLot.id });
      else await addLot.mutateAsync(payload);
      resetForm();
      refetch();
    } catch (requestError: any) {
      setFormError(requestError.response?.data?.detail || "Could not save purchase.");
    }
  };

  const editLot = (lot: any) => {
    setEditingLot(lot);
    setQty(String(lot.qty));
    setPrice(String(lot.unit_price));
    setSupplier(lot.supplier || "");
    setReference(lot.reference || "");
    setLotNumber(lot.lot_number || "");
    setExpiryDate(lot.expiry_date || "");
    setCategory("raw_material");
    setOpen(true);
  };

  const removeLot = async (lot: any) => {
    if (window.confirm(`Delete purchase lot ${lot.id}?`)) {
      await deleteLot.mutateAsync({ ingredient_id: selectedIngredient, id: lot.id });
      refetch();
    }
  };

  return (
    <Box>
      <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1.5, alignItems: "center", justifyContent: "space-between", mb: 2 }}>
        <Typography variant="h4">Purchase Ledger</Typography>
        <Button
          variant="contained"
          onClick={() => { setEditingLot(null); resetForm(); setOpen(true); }}
          disabled={category === "raw_material" && !ingredients?.length}
        >
          Add Purchase
        </Button>
      </Box>

      <FormControl fullWidth margin="dense">
        <InputLabel>Purchase category</InputLabel>
        <Select value={category} label="Purchase category" onChange={(event) => setCategory(event.target.value as PurchaseCategory)}>
          <MenuItem value="raw_material">Raw material / ingredient</MenuItem>
          <MenuItem value="saleable_good">Saleable good</MenuItem>
          <MenuItem value="packing_material">Packing material</MenuItem>
        </Select>
      </FormControl>

      {category === "raw_material" ? (
        <>
          <FormControl fullWidth margin="dense">
            <InputLabel>Ingredient</InputLabel>
            <Select value={selectedIngredient} label="Ingredient" onChange={(event) => setSelectedIngredient(event.target.value as number)}>
              {ingredients?.map((ing: any) => <MenuItem key={ing.id} value={ing.id}>{ing.name}</MenuItem>)}
            </Select>
          </FormControl>
          {selectedIngredient ? (
            lots?.length ? (
              <TableContainer component={Paper} sx={{ mt: 2 }}>
                <Table>
                  <TableHead><TableRow><TableCell>Lot ID</TableCell><TableCell>Qty</TableCell><TableCell>Unit Price (₹)</TableCell><TableCell>Received At</TableCell><TableCell>Supplier</TableCell><TableCell>Reference</TableCell><TableCell>Lot</TableCell><TableCell>Expiry</TableCell><TableCell>Actions</TableCell></TableRow></TableHead>
                  <TableBody>{lots.map((lot: any) => (
                    <TableRow key={lot.id}>
                      <TableCell>{lot.id}</TableCell><TableCell>{lot.qty}</TableCell><TableCell>{lot.unit_price}</TableCell><TableCell>{new Date(lot.received_at).toLocaleString()}</TableCell><TableCell>{lot.supplier || "—"}</TableCell><TableCell>{lot.reference || "—"}</TableCell><TableCell>{lot.lot_number || "—"}</TableCell><TableCell>{lot.expiry_date || "—"}</TableCell>
                      <TableCell><Button size="small" onClick={() => editLot(lot)}>Edit</Button><Button size="small" color="error" onClick={() => removeLot(lot)}>Delete</Button></TableCell>
                    </TableRow>
                  ))}</TableBody>
                </Table>
              </TableContainer>
            ) : <Typography sx={{ mt: 2 }}>No lots for this ingredient.</Typography>
          ) : <Typography sx={{ mt: 2 }}>Select an ingredient to view its purchase lots.</Typography>}
        </>
      ) : (
        <TableContainer component={Paper} sx={{ mt: 2 }}>
          <Table>
            <TableHead><TableRow><TableCell>{category === "packing_material" ? "Packing material" : "Saleable good"}</TableCell><TableCell>Quantity</TableCell><TableCell>Unit</TableCell><TableCell>Average cost (₹)</TableCell></TableRow></TableHead>
            <TableBody>{(category === "packing_material" ? packingMaterials : saleableGoods).length ? (category === "packing_material" ? packingMaterials : saleableGoods).map((item: any) => (
              <TableRow key={item.id}><TableCell>{item.name}</TableCell><TableCell>{item.qty}</TableCell><TableCell>{item.unit}</TableCell><TableCell>{item.unit_price}</TableCell></TableRow>
            )) : <TableRow><TableCell colSpan={4} align="center">No purchases recorded.</TableCell></TableRow>}</TableBody>
          </Table>
        </TableContainer>
      )}

      <Dialog open={open} onClose={resetForm}>
        <DialogTitle>{category === "saleable_good" ? "Add Saleable Good Purchase" : category === "packing_material" ? "Add Packing Material Purchase" : editingLot ? "Edit Raw Material Purchase" : "Add Raw Material Purchase"}</DialogTitle>
        <DialogContent>
          {formError && <Alert severity="error" sx={{ mb: 1 }}>{formError}</Alert>}
          {category !== "raw_material" ? (
            <>
              <TextField margin="dense" label="Product name" fullWidth value={saleableName} onChange={(event) => setSaleableName(event.target.value)} />
              <TextField margin="dense" label="Unit" fullWidth value={saleableUnit} onChange={(event) => setSaleableUnit(event.target.value)} />
            </>
          ) : (
            <FormControl fullWidth margin="dense">
              <InputLabel>Ingredient</InputLabel>
              <Select value={selectedIngredient} label="Ingredient" onChange={(event) => setSelectedIngredient(event.target.value as number)}>
                {ingredients?.map((ing: any) => <MenuItem key={ing.id} value={ing.id}>{ing.name}</MenuItem>)}
              </Select>
            </FormControl>
          )}
          <TextField margin="dense" label="Quantity" type="number" fullWidth value={qty} onChange={(event) => setQty(event.target.value)} />
          <TextField margin="dense" label="Unit Price (₹)" type="number" fullWidth value={price} onChange={(event) => setPrice(event.target.value)} />
          {category === "raw_material" && (
            <>
              <TextField margin="dense" label="Supplier" fullWidth value={supplier} onChange={(event) => setSupplier(event.target.value)} />
              <TextField margin="dense" label="Invoice / reference number" fullWidth value={reference} onChange={(event) => setReference(event.target.value)} />
              <TextField margin="dense" label="Lot number" fullWidth value={lotNumber} onChange={(event) => setLotNumber(event.target.value)} />
              <TextField margin="dense" label="Expiry date" type="date" fullWidth value={expiryDate} onChange={(event) => setExpiryDate(event.target.value)} slotProps={{ inputLabel: { shrink: true } }} />
            </>
          )}
        </DialogContent>
        <DialogActions><Button onClick={resetForm}>Cancel</Button><Button onClick={handleAdd} variant="contained">Save</Button></DialogActions>
      </Dialog>
    </Box>
  );
};
