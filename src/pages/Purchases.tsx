import {
  Alert,
  Autocomplete,
  Box,
  Button,
  Card,
  CardContent,
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
  Checkbox,
  FormControlLabel,
} from "@mui/material";
import {
  useAllSupplierPurchases,
  useCreateSupplierPurchase,
  useUpdateSupplierPurchase,
  useDeleteSupplierPurchase,
  useSuppliers,
  useIngredients,
  useManualStock,
  useAddIngredient,
} from "../hooks/useApi";
import { useState, useMemo } from "react";
import { LineChart, Line, ResponsiveContainer } from "recharts";
import { formatDate } from "../utils/formatDate";
import { formatMoney } from "../utils/formatNumber";

export const Purchases = () => {
  const { data: suppliers = [] } = useSuppliers();
  const { data: purchases = [], isLoading } = useAllSupplierPurchases();
  const createPurchase = useCreateSupplierPurchase();
  const updatePurchase = useUpdateSupplierPurchase();
  const deletePurchase = useDeleteSupplierPurchase();
  const { data: ingredients = [] } = useIngredients();
  const { data: manualStockItems = [] } = useManualStock();
  const addIngredient = useAddIngredient();

  const [open, setOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [formError, setFormError] = useState("");
  const [addingNew, setAddingNew] = useState(false);
  const [newItemName, setNewItemName] = useState("");
  const [newItemUnit, setNewItemUnit] = useState("kg");

  const [supplierId, setSupplierId] = useState(0);
  const [category, setCategory] = useState("raw_material");
  const [itemName, setItemName] = useState("");
  const [unit, setUnit] = useState("kg");
  const [qty, setQty] = useState("");
  const [price, setPrice] = useState("");
  const [sellingPrice, setSellingPrice] = useState("");
  const [reference, setReference] = useState("");
  const [payNow, setPayNow] = useState(false);
  const [paymentAmount, setPaymentAmount] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("CASH");
  const [paymentReference, setPaymentReference] = useState("");

  const resetForm = () => {
    setOpen(false);
    setEditingId(null);
    setFormError("");
    setSupplierId(0);
    setCategory("raw_material");
    setItemName("");
    setUnit("kg");
    setQty("");
    setPrice("");
    setSellingPrice("");
    setReference("");
    setPayNow(false);
    setPaymentAmount("");
    setPaymentMethod("CASH");
    setPaymentReference("");
    setAddingNew(false);
    setNewItemName("");
    setNewItemUnit("kg");
  };

  const categoryItemOptions = useMemo(() => {
    if (category === "raw_material") {
      return ingredients.map((i: any) => i.name);
    }
    return manualStockItems
      .filter((m: any) => m.category === category)
      .map((m: any) => m.name);
  }, [category, ingredients, manualStockItems]);

  const handleAddNewItem = async () => {
    if (!newItemName.trim()) { setFormError("Enter a new item name."); return; }
    try {
      const created = await addIngredient.mutateAsync({
        name: newItemName.trim(),
        base_unit: newItemUnit.trim() || "kg",
        min_stock: 0,
        category,
      });
      setItemName(created.name);
      setUnit(created.base_unit);
      setAddingNew(false);
      setNewItemName("");
      setNewItemUnit("kg");
      setFormError("");
    } catch (e: any) {
      setFormError(e.response?.data?.detail || "Could not add item.");
    }
  };

  const handleAdd = async () => {
    const quantity = parseFloat(qty);
    const unitPrice = parseFloat(price);
    if (!supplierId) { setFormError("Select a supplier."); return; }
    if (!itemName.trim()) { setFormError("Enter item name."); return; }
    if (!Number.isFinite(quantity) || quantity <= 0) { setFormError("Enter a valid quantity."); return; }
    if (!Number.isFinite(unitPrice) || unitPrice <= 0) { setFormError("Enter a valid unit price."); return; }

    const total = quantity * unitPrice;
    let paymentAmt = 0;
    if (payNow) {
      paymentAmt = parseFloat(paymentAmount) || total;
      if (paymentAmt > total + 0.01) { setFormError("Payment cannot exceed total amount."); return; }
    }

    try {
      if (editingId) {
        await updatePurchase.mutateAsync({
          id: editingId,
          data: {
            supplier_id: supplierId,
            category,
            item_name: itemName.trim(),
            unit: unit.trim() || "kg",
            quantity,
            unit_price: unitPrice,
            selling_price: category === "saleable_good" && sellingPrice ? parseFloat(sellingPrice) : undefined,
            reference: reference || undefined,
          },
        });
      } else {
        await createPurchase.mutateAsync({
          supplier_id: supplierId,
          category,
          item_name: itemName.trim(),
          unit: unit.trim() || "kg",
          quantity,
          unit_price: unitPrice,
          selling_price: category === "saleable_good" && sellingPrice ? parseFloat(sellingPrice) : undefined,
          reference: reference || undefined,
          payment_amount: payNow ? paymentAmt : undefined,
          payment_method: paymentMethod,
          payment_reference: paymentReference || undefined,
        });
      }
      resetForm();
    } catch (e: any) {
      setFormError(e.response?.data?.detail || "Could not save purchase.");
    }
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm("Delete this purchase record? Inventory will be adjusted.")) return;
    try {
      await deletePurchase.mutateAsync(id);
    } catch (e: any) {
      alert(e.response?.data?.detail || "Could not delete purchase.");
    }
  };

  const handleEdit = (p: any) => {
    setEditingId(p.id);
    setSupplierId(p.supplier_id);
    setCategory(p.category);
    setItemName(p.item_name);
    setUnit(p.unit);
    setQty(String(p.quantity));
    setPrice(String(p.unit_price));
    setSellingPrice(p.selling_price ? String(p.selling_price) : "");
    setReference(p.reference || "");
    setPayNow(false);
    setOpen(true);
  };

  const totalAmount = (parseFloat(qty) || 0) * (parseFloat(price) || 0);

  const priceHistory = useMemo(() => {
    const history: Record<string, { date: string; price: number }[]> = {};
    purchases.forEach((p: any) => {
      history[p.item_name] = history[p.item_name] || [];
      history[p.item_name].push({
        date: p.purchased_at?.slice(0, 10) || "",
        price: p.unit_price,
      });
    });
    return history;
  }, [purchases]);

  const cellSx = { py: 0.75, px: 1, fontSize: { xs: "0.7rem", sm: "0.8rem" } };

  return (
    <Box>
      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 2 }}>
        <Typography variant="h4" sx={{ fontSize: { xs: "1.5rem", sm: "2rem" }, fontWeight: 700 }}>Purchases</Typography>
        <Button variant="contained" size="small" onClick={() => { resetForm(); setOpen(true); }} sx={{ fontSize: { xs: "0.75rem", sm: "0.875rem" } }}>Add Purchase</Button>
      </Box>

      {isLoading ? (
        <Box sx={{ display: "flex", justifyContent: "center", py: 4 }}><CircularProgress size={24} /></Box>
      ) : purchases.length ? (
        <TableContainer component={Paper} sx={{ overflowX: "auto" }}>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell sx={{ ...cellSx, fontWeight: 700 }}>Date</TableCell>
                <TableCell sx={{ ...cellSx, fontWeight: 700 }}>Supplier</TableCell>
                <TableCell sx={{ ...cellSx, fontWeight: 700 }}>Item</TableCell>
                <TableCell sx={{ ...cellSx, fontWeight: 700 }}>Category</TableCell>
                <TableCell sx={{ ...cellSx, fontWeight: 700 }}>Qty</TableCell>
                <TableCell sx={{ ...cellSx, fontWeight: 700 }}>Price</TableCell>
                <TableCell sx={{ ...cellSx, fontWeight: 700 }}>Trend</TableCell>
                <TableCell sx={{ ...cellSx, fontWeight: 700 }}>Total</TableCell>
                <TableCell sx={{ ...cellSx, fontWeight: 700 }}>Reference</TableCell>
                <TableCell sx={{ ...cellSx, fontWeight: 700 }}>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {purchases.map((p: any) => (
                <TableRow key={p.id}>
                  <TableCell sx={cellSx}>{formatDate(p.purchased_at)}</TableCell>
                  <TableCell sx={{ ...cellSx, fontWeight: 600 }}>{p.supplier_name || "—"}</TableCell>
                  <TableCell sx={cellSx}>{p.item_name}</TableCell>
                  <TableCell sx={cellSx}>{p.category}</TableCell>
                  <TableCell sx={cellSx}>{p.quantity} {p.unit}</TableCell>
                  <TableCell sx={cellSx}>{formatMoney(p.unit_price)}</TableCell>
                  <TableCell sx={cellSx}>
                    <ResponsiveContainer width={80} height={24}>
                      <LineChart data={(priceHistory[p.item_name] || []).slice(-5)}>
                        <Line type="monotone" dataKey="price" stroke="#1976d2" strokeWidth={1.5} dot={false} />
                      </LineChart>
                    </ResponsiveContainer>
                  </TableCell>
                  <TableCell sx={{ ...cellSx, fontWeight: 700 }}>{formatMoney(p.total_amount)}</TableCell>
                  <TableCell sx={cellSx}>{p.reference || "—"}</TableCell>
                  <TableCell sx={cellSx}>
                    <Button size="small" sx={{ fontSize: "0.7rem", minWidth: "auto", px: 1 }} onClick={() => handleEdit(p)}>Edit</Button>
                    <Button size="small" color="error" sx={{ fontSize: "0.7rem", minWidth: "auto", px: 1 }} onClick={() => handleDelete(p.id)} disabled={deletePurchase.isPending}>Del</Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      ) : (
        <Typography sx={{ mt: 2, fontSize: "0.85rem", color: "text.secondary" }}>No purchases recorded yet.</Typography>
      )}

      <Dialog open={open} onClose={resetForm} maxWidth="sm" fullWidth>
        <DialogTitle>{editingId ? "Edit Purchase" : "Add Purchase"}</DialogTitle>
        <DialogContent>
          {formError && <Alert severity="error" sx={{ mb: 1 }}>{formError}</Alert>}
          <Autocomplete
            options={suppliers}
            getOptionLabel={(option: any) => option.name}
            value={suppliers.find((s: any) => s.id === supplierId) || null}
            onChange={(_, newValue) => setSupplierId(newValue?.id || 0)}
            renderInput={(params) => <TextField {...params} margin="dense" label="Supplier" placeholder="Search suppliers..." />}
            isOptionEqualToValue={(option: any, value: any) => option.id === value?.id}
            fullWidth
            size="small"
          />
          <FormControl fullWidth margin="dense" size="small">
            <InputLabel>Category</InputLabel>
            <Select value={category} label="Category" onChange={(e) => { setCategory(e.target.value); setItemName(""); setAddingNew(false); }}>
              <MenuItem value="raw_material">Raw material</MenuItem>
              <MenuItem value="saleable_good">Saleable good</MenuItem>
              <MenuItem value="packing_material">Packing material</MenuItem>
            </Select>
          </FormControl>
          {addingNew ? (
            <Box sx={{ mt: 1, p: 1.5, border: 1, borderColor: "divider", borderRadius: 1 }}>
              <Typography variant="body2" sx={{ fontWeight: 600, mb: 1 }}>New item</Typography>
              <TextField margin="dense" label="Item name" fullWidth size="small" value={newItemName} onChange={(e) => setNewItemName(e.target.value)} />
              <TextField margin="dense" label="Unit" fullWidth size="small" value={newItemUnit} onChange={(e) => setNewItemUnit(e.target.value)} sx={{ maxWidth: 120, mt: 1 }} />
              <Box sx={{ display: "flex", gap: 1, mt: 1 }}>
                <Button size="small" onClick={() => { setAddingNew(false); setNewItemName(""); setNewItemUnit("kg"); }}>Cancel</Button>
                <Button size="small" variant="contained" onClick={handleAddNewItem} disabled={addIngredient.isPending}>
                  {addIngredient.isPending ? <CircularProgress size={16} color="inherit" /> : "Add item"}
                </Button>
              </Box>
            </Box>
          ) : (
            <Autocomplete
              options={[...categoryItemOptions, "__add_new__"]}
              getOptionLabel={(option) => option === "__add_new__" ? "+ Add new item" : option}
              renderOption={(props, option) => (
                <li {...props} key={option} style={option === "__add_new__" ? { fontWeight: 700, color: "primary.main" } : {}}>
                  {option === "__add_new__" ? "+ Add new item" : option}
                </li>
              )}
              value={itemName || null}
              onChange={(_, newValue) => {
                if (newValue === "__add_new__") {
                  setAddingNew(true);
                  setItemName("");
                } else {
                  setItemName(newValue || "");
                  const existing = categoryItemOptions.find((n) => n === newValue);
                  if (existing && category === "raw_material") {
                    const found = ingredients.find((i: any) => i.name === newValue);
                    if (found) setUnit(found.base_unit);
                  }
                }
              }}
              freeSolo
              onInputChange={(_, value) => setItemName(value || "")}
              renderInput={(params) => <TextField {...params} margin="dense" label="Item name" placeholder="Search items..." />}
              fullWidth
              size="small"
            />
          )}
          <Box sx={{ display: "flex", gap: 1 }}>
            <TextField margin="dense" label="Quantity" type="number" fullWidth value={qty} onChange={(e) => setQty(e.target.value)} />
            <TextField margin="dense" label="Unit" fullWidth value={unit} onChange={(e) => setUnit(e.target.value)} sx={{ maxWidth: 120 }} />
          </Box>
          <TextField margin="dense" label="Unit Price (₹)" type="number" fullWidth value={price} onChange={(e) => setPrice(e.target.value)} />
          {category === "saleable_good" && (
            <TextField margin="dense" label="Selling Price (₹)" type="number" fullWidth value={sellingPrice} onChange={(e) => setSellingPrice(e.target.value)} helperText="Price at which this item will be sold" />
          )}
          {totalAmount > 0 && (
            <Typography variant="body2" sx={{ mt: 1, fontWeight: 700, color: "primary.main" }}>Total: {formatMoney(totalAmount)}</Typography>
          )}
          <TextField margin="dense" label="Invoice / reference" fullWidth value={reference} onChange={(e) => setReference(e.target.value)} />

          {!editingId && (
          <Box sx={{ mt: 2, p: 1.5, bgcolor: "grey.50", borderRadius: 1 }}>
            <FormControlLabel
              control={<Checkbox checked={payNow} onChange={(e) => {
                setPayNow(e.target.checked);
                if (e.target.checked && totalAmount > 0) setPaymentAmount(String(totalAmount.toFixed(2)));
              }} />}
              label={<Typography variant="body2" sx={{ fontWeight: 600 }}>Record payment now</Typography>}
            />
            {payNow && (
              <Box sx={{ mt: 1 }}>
                <Box sx={{ display: "flex", gap: 1 }}>
                  <TextField margin="dense" label="Payment amount (₹)" type="number" fullWidth value={paymentAmount} onChange={(e) => setPaymentAmount(e.target.value)} size="small" />
                  <FormControl sx={{ minWidth: 120 }} size="small" margin="dense">
                    <InputLabel>Method</InputLabel>
                    <Select value={paymentMethod} label="Method" onChange={(e) => setPaymentMethod(e.target.value)}>
                      <MenuItem value="CASH">Cash</MenuItem>
                      <MenuItem value="BANK_TRANSFER">Bank Transfer</MenuItem>
                      <MenuItem value="UPI">UPI</MenuItem>
                      <MenuItem value="CHEQUE">Cheque</MenuItem>
                    </Select>
                  </FormControl>
                </Box>
                <TextField margin="dense" label="Payment reference" fullWidth value={paymentReference} onChange={(e) => setPaymentReference(e.target.value)} size="small" />
              </Box>
            )}
          </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={resetForm} disabled={createPurchase.isPending}>Cancel</Button>
          <Button onClick={handleAdd} variant="contained" disabled={createPurchase.isPending}>
            {createPurchase.isPending ? <CircularProgress size={20} color="inherit" /> : "Save"}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};
