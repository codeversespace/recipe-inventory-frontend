import {
  Alert,
  Box,
  Button,
  CircularProgress,
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
  useAddPurchaseLot,
  useDeletePurchaseLot,
  useUpdatePurchaseLot,
  useManualStock,
  usePackingMaterials,
  useAddManualStock, useAllPurchaseLots, useSuppliers,
} from "../hooks/useApi";
import { useState } from "react";

type PurchaseCategory = "raw_material" | "saleable_good" | "packing_material";

export const Purchases = () => {
  const { data: ingredients } = useIngredients();
  const { data: saleableGoods = [] } = useManualStock();
  const { data: packingMaterials = [] } = usePackingMaterials();
  const { data: suppliers = [] } = useSuppliers();
  const [category, setCategory] = useState<PurchaseCategory>("raw_material");
  const [selectedIngredient, setSelectedIngredient] = useState<number>(0);
  const { data: allLots = [], isLoading: allLotsLoading, refetch: refetchAll } = useAllPurchaseLots();
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
  const [supplierId, setSupplierId] = useState(0);

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
    setSupplierId(0);
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
        supplier_id: supplierId || undefined,
        });
        resetForm();
      } catch (requestError: any) {
        setFormError(requestError.response?.data?.detail || "Could not save purchase.");
      }
      return;
    }

    const payload = {
      ingredient_id: selectedIngredient,
      supplier_id: supplierId || undefined,
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
      refetchAll();
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
      await deleteLot.mutateAsync({ ingredient_id: lot.ingredient.id, id: lot.id });
      refetchAll();
    }
  };

  const cellSx = { py: 0.75, px: 1, fontSize: { xs: "0.7rem", sm: "0.8rem" } };

  return (
    <Box>
      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 2 }}>
        <Typography variant="h4" sx={{ fontSize: { xs: "1.5rem", sm: "2rem" }, fontWeight: 700 }}>Purchases</Typography>
        <Button variant="contained" size="small" onClick={() => { setEditingLot(null); resetForm(); setOpen(true); }} disabled={category === "raw_material" && !ingredients?.length} sx={{ fontSize: { xs: "0.75rem", sm: "0.875rem" } }}>Add Purchase</Button>
      </Box>

      <FormControl fullWidth size="small" margin="dense" sx={{ mb: 2 }}>
        <InputLabel>Category</InputLabel>
        <Select value={category} label="Category" onChange={(event) => setCategory(event.target.value as PurchaseCategory)}>
          <MenuItem value="raw_material">Raw material</MenuItem>
          <MenuItem value="saleable_good">Saleable good</MenuItem>
          <MenuItem value="packing_material">Packing material</MenuItem>
        </Select>
      </FormControl>

      {category === "raw_material" ? (
        <>
          <FormControl fullWidth size="small" margin="dense" sx={{ mb: 1 }}>
            <InputLabel>Ingredient</InputLabel>
            <Select value={selectedIngredient} label="Ingredient" onChange={(event) => setSelectedIngredient(event.target.value as number)}>
              {ingredients?.map((ing: any) => <MenuItem key={ing.id} value={ing.id}>{ing.name}</MenuItem>)}
            </Select>
          </FormControl>
          {allLotsLoading ? <Box sx={{ display: "flex", justifyContent: "center", py: 4 }}><CircularProgress size={24} /></Box> : allLots.length ? (
              <TableContainer component={Paper} sx={{ overflowX: "auto" }}>
                <Table size="small">
                  <TableHead><TableRow><TableCell sx={{ ...cellSx, fontWeight: 700 }}>Ingredient</TableCell><TableCell sx={{ ...cellSx, fontWeight: 700 }}>Qty</TableCell><TableCell sx={{ ...cellSx, fontWeight: 700 }}>Price</TableCell><TableCell sx={{ ...cellSx, fontWeight: 700 }}>Supplier</TableCell><TableCell sx={{ ...cellSx, fontWeight: 700 }}>Actions</TableCell></TableRow></TableHead>
                  <TableBody>{allLots.map((lot: any) => (
                    <TableRow key={lot.id}>
                      <TableCell sx={{ ...cellSx, fontWeight: 600 }}>{lot.ingredient.name}</TableCell><TableCell sx={cellSx}>{lot.qty}</TableCell><TableCell sx={cellSx}>₹{lot.unit_price}</TableCell><TableCell sx={cellSx}>{lot.supplier || "—"}</TableCell>
                      <TableCell sx={cellSx}><Button size="small" sx={{ fontSize: "0.7rem", minWidth: "auto", px: 1 }} disabled={deleteLot.isPending || updateLot.isPending} onClick={() => { setSelectedIngredient(lot.ingredient.id); editLot(lot); }}>Edit</Button><Button size="small" color="error" sx={{ fontSize: "0.7rem", minWidth: "auto", px: 1 }} disabled={deleteLot.isPending || updateLot.isPending} onClick={() => removeLot(lot)}>{deleteLot.isPending ? <CircularProgress size={14} /> : "Del"}</Button></TableCell>
                    </TableRow>
                  ))}</TableBody>
                </Table>
              </TableContainer>
            ) : <Typography sx={{ mt: 2, fontSize: "0.85rem", color: "text.secondary" }}>No raw-material purchases recorded.</Typography>}
        </>
      ) : (
        <TableContainer component={Paper} sx={{ overflowX: "auto" }}>
          <Table size="small">
            <TableHead><TableRow><TableCell sx={{ ...cellSx, fontWeight: 700 }}>{category === "packing_material" ? "Material" : "Item"}</TableCell><TableCell sx={{ ...cellSx, fontWeight: 700 }}>Qty</TableCell><TableCell sx={{ ...cellSx, fontWeight: 700 }}>Unit</TableCell><TableCell sx={{ ...cellSx, fontWeight: 700 }}>Cost</TableCell></TableRow></TableHead>
            <TableBody>{(category === "packing_material" ? packingMaterials : saleableGoods).length ? (category === "packing_material" ? packingMaterials : saleableGoods).map((item: any) => (
              <TableRow key={item.id}><TableCell sx={{ ...cellSx, fontWeight: 600 }}>{item.name}</TableCell><TableCell sx={cellSx}>{item.qty}</TableCell><TableCell sx={cellSx}>{item.unit}</TableCell><TableCell sx={cellSx}>₹{item.unit_price}</TableCell></TableRow>
            )) : <TableRow><TableCell colSpan={4} align="center" sx={{ ...cellSx, py: 3 }}>No purchases recorded.</TableCell></TableRow>}</TableBody>
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
          <FormControl fullWidth margin="dense"><InputLabel>Supplier</InputLabel><Select value={supplierId} label="Supplier" onChange={(event) => setSupplierId(Number(event.target.value))}><MenuItem value={0}>No supplier selected</MenuItem>{suppliers.map((supplier: any) => <MenuItem key={supplier.id} value={supplier.id}>{supplier.name}</MenuItem>)}</Select></FormControl>
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
        <DialogActions><Button onClick={resetForm} disabled={addLot.isPending || updateLot.isPending || addSaleableGood.isPending}>Cancel</Button><Button onClick={handleAdd} variant="contained" disabled={addLot.isPending || updateLot.isPending || addSaleableGood.isPending}>{addLot.isPending || updateLot.isPending || addSaleableGood.isPending ? <CircularProgress size={20} color="inherit" /> : "Save"}</Button></DialogActions>
      </Dialog>
    </Box>
  );
};
