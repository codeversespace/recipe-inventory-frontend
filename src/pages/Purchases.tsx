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
  Chip,
  Collapse,
  FormControlLabel,
  IconButton,
  Stack,
  useMediaQuery,
  useTheme,
} from "@mui/material";
import ExpandMoreRoundedIcon from "@mui/icons-material/ExpandMoreRounded";
import ExpandLessRoundedIcon from "@mui/icons-material/ExpandLessRounded";
import CloseRoundedIcon from "@mui/icons-material/CloseRounded";
import {
  useAllSupplierPurchases,
  useCreateSupplierPurchase,
  useUpdateSupplierPurchase,
  useDeleteSupplierPurchase,
  useSuppliers,
  useIngredients,
  useManualStock,
  useAddIngredient,
  useAddManualStock,
} from "../hooks/useApi";
import { useState, useMemo } from "react";
import { useSearchParams } from "react-router-dom";
import { LineChart, Line, ResponsiveContainer } from "recharts";
import { formatDate } from "../utils/formatDate";
import { formatMoney } from "../utils/formatNumber";
import { groupByUnit, purchasesForItem } from "../utils/priceComparison";
import { DeleteButton, EmptyState, ErrorState, FormActions, FormSection, Money, PageHeader, TableSkeleton } from "../components/ui";

export const Purchases = () => {
  const { data: suppliers = [], isLoading: suppliersLoading } = useSuppliers();
  const { data: purchases = [], isLoading, error: purchasesError, refetch: refetchPurchases } = useAllSupplierPurchases();
  const createPurchase = useCreateSupplierPurchase();
  const updatePurchase = useUpdateSupplierPurchase();
  const deletePurchase = useDeleteSupplierPurchase();
  const { data: ingredients = [], isLoading: ingredientsLoading } = useIngredients();
  const { data: manualStockItems = [], isLoading: manualStockLoading } = useManualStock();
  const addIngredient = useAddIngredient();
  const addManualStock = useAddManualStock();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));
  const [pageError, setPageError] = useState("");
  const [expanded, setExpanded] = useState<Record<number, boolean>>({});
  const [searchParams, setSearchParams] = useSearchParams();
  const itemFilter = searchParams.get("item") || "";
  const visiblePurchases = itemFilter
    ? purchases.filter((p: any) => p.item_name === itemFilter)
    : purchases;

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
      return ingredients
        .filter((i: any) => i.category === "raw_material")
        .map((i: any) => i.name);
    }
    return manualStockItems
      .filter((m: any) => m.category === category)
      .map((m: any) => m.name);
  }, [category, ingredients, manualStockItems]);

  const handleAddNewItem = async () => {
    if (!newItemName.trim()) { setFormError("Enter a new item name."); return; }
    try {
      if (category === "raw_material") {
        const created = await addIngredient.mutateAsync({
          name: newItemName.trim(),
          base_unit: newItemUnit.trim() || "kg",
          min_stock: 0,
          category,
        });
        setItemName(created.name);
        setUnit(created.base_unit);
      } else {
        // Packing materials and saleable goods live in ManualStockItem, which is
        // what the category dropdown reads. Creating an Ingredient here would
        // pollute the raw-material list and stay invisible in this dropdown.
        const { data: created } = await addManualStock.mutateAsync({
          name: newItemName.trim(),
          unit: newItemUnit.trim() || "pcs",
          qty: 0,
          unit_price: 0,
          category: category as "saleable_good" | "packing_material",
        });
        setItemName(created.name);
        setUnit(created.unit);
      }
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

  const catLabel = (category: string) =>
    category === "raw_material" ? "Raw material" : category === "saleable_good" ? "Saleable good" : category === "packing_material" ? "Packing material" : category;

  // Presentational mapping of the existing formError string onto fields.
  const fieldError = (match: string) => (formError.includes(match) ? formError : "");

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
      <PageHeader
        title="Purchases"
        subtitle="Supplier purchase records. Deleting a record reverses its inventory effect."
        actions={
          <Button variant="contained" onClick={() => { resetForm(); setOpen(true); }}>
            Add Purchase
          </Button>
        }
      />
      {pageError && <Alert severity="error" sx={{ mb: 2 }} onClose={() => setPageError("")}>{pageError}</Alert>}
      {itemFilter && (
        <Box sx={{ mb: 1.5 }}>
          <Typography variant="h6" sx={{ fontWeight: 700, fontSize: { xs: "1rem", sm: "1.25rem" } }}>{itemFilter}</Typography>
          <Typography variant="caption" color="text.secondary" sx={{ display: "block", mb: 1 }}>Purchase History</Typography>
          {(() => {
            const groups = groupByUnit(purchasesForItem(purchases, itemFilter));
            const g = groups[0];
            if (!g) return null;
            return (
              <Typography variant="body2" color="text.secondary" className="tnum">
                Total Purchases: {g.rows.length} · Suppliers: {g.suppliers.length} · Latest Price: {formatMoney(g.latest?.price ?? 0)}/{g.unit}
              </Typography>
            );
          })()}
          <Chip
            label={`Filtered: ${itemFilter}`}
            onDelete={() => setSearchParams({})}
            deleteIcon={<CloseRoundedIcon />}
            color="primary"
            variant="outlined"
            sx={{ minHeight: 44, mt: 1 }}
            aria-label={`Clear item filter ${itemFilter}`}
          />
        </Box>
      )}
      {isLoading ? (
        isMobile ? (
          <Box sx={{ display: "flex", justifyContent: "center", py: 4 }}><CircularProgress size={24} /></Box>
        ) : (
          <TableContainer component={Paper} sx={{ overflowX: "auto" }}>
            <Table size="small"><TableHead>
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
            <TableBody><TableSkeleton rows={5} colSpan={10} /></TableBody>
            </Table>
          </TableContainer>
        )
      ) : purchasesError ? (
        <ErrorState message={(purchasesError as any).message} onRetry={() => refetchPurchases()} />
      ) : visiblePurchases.length ? (
        isMobile ? (
          <Stack spacing={1.5}>
            {visiblePurchases.map((p: any) => {
              const open = !!expanded[p.id];
              return (
                <Card key={p.id} variant="outlined">
                  <CardContent sx={{ p: 2, "&:last-child": { pb: 2 } }}>
                    <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 1 }}>
                      <Box sx={{ minWidth: 0 }}>
                        <Typography variant="subtitle2" sx={{ fontWeight: 700, fontSize: "0.9375rem" }}>{p.supplier_name || "—"}</Typography>
                        <Typography variant="caption" color="text.secondary">{formatDate(p.purchased_at)} · {p.item_name}</Typography>
                      </Box>
                      <Typography variant="h6" sx={{ fontWeight: 700, whiteSpace: "nowrap" }} className="tnum"><Money value={p.total_amount} /></Typography>
                    </Box>
                    <Typography variant="caption" color="text.secondary" sx={{ display: "block", mt: 0.5 }} className="tnum">
                      {p.quantity} {p.unit} · {catLabel(p.category)}{p.reference ? ` · ${p.reference}` : ""}
                    </Typography>
                    <Collapse in={open} timeout="auto" unmountOnExit>
                      <Box sx={{ display: "flex", gap: 2, mt: 1, flexWrap: "wrap", alignItems: "center" }}>
                        <Box><Typography variant="caption" color="text.secondary" sx={{ display: "block" }}>Unit price</Typography><Typography variant="body2" className="tnum"><Money value={p.unit_price} /></Typography></Box>
                        <Box><Typography variant="caption" color="text.secondary" sx={{ display: "block" }}>Price trend</Typography>
                          <ResponsiveContainer width={80} height={24}>
                            <LineChart data={(priceHistory[p.item_name] || []).slice(-5)}>
                              <Line type="monotone" dataKey="price" stroke="#1976d2" strokeWidth={1.5} dot={false} />
                            </LineChart>
                          </ResponsiveContainer>
                        </Box>
                      </Box>
                    </Collapse>
                    <Box sx={{ display: "flex", gap: 1, mt: 1.5 }}>
                      <IconButton
                        size="small"
                        aria-label={open ? `Hide details for purchase ${p.id}` : `Show details for purchase ${p.id}`}
                        aria-expanded={open}
                        onClick={() => setExpanded((prev) => ({ ...prev, [p.id]: !prev[p.id] }))}
                        sx={{ minWidth: 44 }}
                      >
                        {open ? <ExpandLessRoundedIcon /> : <ExpandMoreRoundedIcon />}
                      </IconButton>
                      <Button variant="outlined" onClick={() => handleEdit(p)} sx={{ flex: 1, minHeight: 44 }} aria-label={`Edit purchase ${p.id}`}>
                        Edit
                      </Button>
                      <Box sx={{ flex: 1 }}>
                        <DeleteButton
                          fullWidth
                          label="Delete"
                          itemName={`purchase ${p.id}`}
                          confirmMessage="Delete this purchase record? Inventory will be adjusted. This cannot be undone."
                          onDelete={() => deletePurchase.mutateAsync(p.id)}
                          onError={(e: any) => setPageError(e.response?.data?.detail || "Could not delete purchase.")}
                        />
                      </Box>
                    </Box>
                  </CardContent>
                </Card>
              );
            })}
          </Stack>
        ) : (
        <TableContainer component={Paper} sx={{ overflowX: "auto" }}>
          <Table size="small" sx={{ minWidth: 900 }}>
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
              {visiblePurchases.map((p: any) => (
                <TableRow key={p.id}>
                  <TableCell sx={cellSx}>{formatDate(p.purchased_at)}</TableCell>
                  <TableCell sx={{ ...cellSx, fontWeight: 600 }}>{p.supplier_name || "—"}</TableCell>
                  <TableCell sx={cellSx}>{p.item_name}</TableCell>
                  <TableCell sx={cellSx}>{catLabel(p.category)}</TableCell>
                  <TableCell sx={cellSx} className="tnum">{p.quantity} {p.unit}</TableCell>
                  <TableCell sx={cellSx} className="tnum"><Money value={p.unit_price} /></TableCell>
                  <TableCell sx={cellSx}>
                    <ResponsiveContainer width={80} height={24}>
                      <LineChart data={(priceHistory[p.item_name] || []).slice(-5)}>
                        <Line type="monotone" dataKey="price" stroke="#1976d2" strokeWidth={1.5} dot={false} />
                      </LineChart>
                    </ResponsiveContainer>
                  </TableCell>
                  <TableCell sx={{ ...cellSx, fontWeight: 700 }} className="tnum"><Money value={p.total_amount} /></TableCell>
                  <TableCell sx={cellSx}>{p.reference || "—"}</TableCell>
                  <TableCell sx={cellSx}>
                    <Box sx={{ display: "flex", gap: 0.5 }}>
                      <Button size="small" onClick={() => handleEdit(p)} aria-label={`Edit purchase ${p.id}`}>Edit</Button>
                      <DeleteButton
                        label="Delete"
                        itemName={`purchase ${p.id}`}
                        confirmMessage="Delete this purchase record? Inventory will be adjusted. This cannot be undone."
                        onDelete={() => deletePurchase.mutateAsync(p.id)}
                        onError={(e: any) => setPageError(e.response?.data?.detail || "Could not delete purchase.")}
                      />
                    </Box>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
        )
      ) : (
        <EmptyState
          title={itemFilter ? `No purchases of ${itemFilter} yet.` : "No purchases recorded yet."}
          message={itemFilter ? "Purchases of this item will appear here." : "Record your first supplier purchase to start tracking inventory."}
          actionLabel="Add Purchase"
          onAction={() => { resetForm(); setOpen(true); }}
        />
      )}

      <Dialog open={open} onClose={resetForm} fullScreen={isMobile} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ fontWeight: 700 }}>{editingId ? "Edit Purchase" : "Add Purchase"}</DialogTitle>
        <DialogContent sx={{ pb: 1 }}>
          <FormSection title="Purchase Details">
          <Autocomplete
            options={suppliers}
            getOptionLabel={(option: any) => option.name}
            value={suppliers.find((s: any) => s.id === supplierId) || null}
            onChange={(_, newValue) => { setSupplierId(newValue?.id || 0); setFormError(""); }}
            loading={suppliersLoading}
            disabled={suppliersLoading}
            renderInput={(params) => <TextField {...params} margin="dense" label={suppliersLoading ? "Loading suppliers..." : "Supplier"} placeholder="Search suppliers..." error={!!fieldError("Select a supplier")} helperText={fieldError("Select a supplier")} />}
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
          <TextField margin="dense" label="Invoice / reference" fullWidth value={reference} onChange={(e) => setReference(e.target.value)} />
          </FormSection>

          <FormSection title="Item">
          {addingNew ? (
            <Box sx={{ mt: 1, p: 1.5, border: 1, borderColor: "divider", borderRadius: 1 }}>
              <Typography variant="body2" sx={{ fontWeight: 600, mb: 1 }}>New item</Typography>
              <TextField margin="dense" label="Item name" fullWidth size="small" value={newItemName} onChange={(e) => setNewItemName(e.target.value)} error={!!fieldError("Enter a new item name")} helperText={fieldError("Enter a new item name")} />
              <TextField margin="dense" label="Unit" fullWidth size="small" value={newItemUnit} onChange={(e) => setNewItemUnit(e.target.value)} sx={{ maxWidth: { xs: "100%", sm: 120 }, mt: 1 }} />
              <Box sx={{ display: "flex", gap: 1, mt: 1, flexDirection: { xs: "column", sm: "row" } }}>
                <Button onClick={() => { setAddingNew(false); setNewItemName(""); setNewItemUnit("kg"); }} sx={{ minHeight: 44 }}>Cancel</Button>
                <Button variant="contained" onClick={handleAddNewItem} disabled={addIngredient.isPending || addManualStock.isPending} sx={{ minHeight: 44, flex: { xs: 1, sm: "0 0 auto" } }}>
                  {(addIngredient.isPending || addManualStock.isPending) ? <CircularProgress size={16} color="inherit" /> : "Add item"}
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
              loading={ingredientsLoading || manualStockLoading}
              disabled={ingredientsLoading || manualStockLoading}
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
                  } else if (existing) {
                    const found = manualStockItems.find((m: any) => m.name === newValue && m.category === category);
                    if (found) setUnit(found.unit);
                  }
                }
                setFormError("");
              }}
              freeSolo
              onInputChange={(_, value) => setItemName(value || "")}
              renderInput={(params) => <TextField {...params} margin="dense" label={(ingredientsLoading || manualStockLoading) ? "Loading items..." : "Item name"} placeholder="Search items..." error={!!fieldError("Enter item name")} helperText={fieldError("Enter item name")} />}
              fullWidth
              size="small"
            />
          )}
          <Box sx={{ display: "flex", gap: 1, flexDirection: { xs: "column", sm: "row" }, mt: 1 }}>
            <TextField margin="dense" label="Quantity" type="number" slotProps={{ htmlInput: { inputMode: "decimal", min: 0 } }} fullWidth value={qty} onChange={(e) => setQty(e.target.value)} error={!!fieldError("valid quantity")} helperText={fieldError("valid quantity")} sx={{ flex: { sm: 1 } }} />
            <TextField margin="dense" label="Unit" fullWidth value={unit} onChange={(e) => setUnit(e.target.value)} sx={{ flex: { sm: "0 0 120px" } }} />
            <TextField margin="dense" label="Unit Price (₹)" type="number" slotProps={{ htmlInput: { inputMode: "decimal", min: 0 } }} fullWidth value={price} onChange={(e) => setPrice(e.target.value)} error={!!fieldError("valid unit price")} helperText={fieldError("valid unit price")} sx={{ flex: { sm: 1 } }} />
          </Box>
          {category === "saleable_good" && (
            <TextField margin="dense" label="Selling Price (₹)" type="number" slotProps={{ htmlInput: { inputMode: "decimal", min: 0 } }} fullWidth value={sellingPrice} onChange={(e) => setSellingPrice(e.target.value)} helperText="Price at which this item will be sold" />
          )}
          </FormSection>

          {!editingId && (
          <FormSection title="Payment">
          <Box sx={{ p: 1.5, bgcolor: "grey.50", borderRadius: 1 }}>
            <FormControlLabel
              control={<Checkbox checked={payNow} onChange={(e) => {
                setPayNow(e.target.checked);
                if (e.target.checked && totalAmount > 0) setPaymentAmount(String(totalAmount.toFixed(2)));
              }} sx={{ p: 1.25 }} />}
              label={<Typography variant="body2" sx={{ fontWeight: 600 }}>Record payment now</Typography>}
            />
            {payNow && (
              <Box sx={{ mt: 1 }}>
                <Box sx={{ display: "flex", gap: 1, flexDirection: { xs: "column", sm: "row" } }}>
                  <TextField margin="dense" label="Payment amount (₹)" type="number" slotProps={{ htmlInput: { inputMode: "decimal", min: 0 } }} fullWidth value={paymentAmount} onChange={(e) => setPaymentAmount(e.target.value)} size="small" error={!!fieldError("Payment cannot exceed")} helperText={fieldError("Payment cannot exceed")} />
                  <FormControl sx={{ minWidth: { xs: "100%", sm: 120 } }} size="small" margin="dense">
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
          </FormSection>
          )}

          <FormSection title="Summary">
          {totalAmount > 0 ? (
            <Typography variant="h6" sx={{ fontWeight: 700, color: "primary.main" }} className="tnum">Total: <Money value={totalAmount} /></Typography>
          ) : (
            <Typography color="text.secondary" sx={{ fontSize: "0.8125rem" }}>Enter quantity and unit price to see the total.</Typography>
          )}
          </FormSection>
        </DialogContent>
        <FormActions
          onCancel={resetForm}
          submitLabel={editingId ? "Update Purchase" : "Save Purchase"}
          onSubmit={handleAdd}
          pending={createPurchase.isPending || updatePurchase.isPending}
          error={formError && !fieldError("Select a supplier") && !fieldError("Enter item name") && !fieldError("valid quantity") && !fieldError("valid unit price") && !fieldError("Payment cannot exceed") && !fieldError("Enter a new item name") ? formError : ""}
        />
      </Dialog>
    </Box>
  );
};
