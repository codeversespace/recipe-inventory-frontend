import { Alert, Autocomplete, Box, Button, Card, CardContent, Chip, CircularProgress, Dialog, DialogActions, DialogContent, DialogTitle, LinearProgress, Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, TextField, Typography } from "@mui/material";
import AddRoundedIcon from "@mui/icons-material/AddRounded";
import WarningAmberRoundedIcon from "@mui/icons-material/WarningAmberRounded";
import CheckCircleOutlineRoundedIcon from "@mui/icons-material/CheckCircleOutlineRounded";
import { useState } from "react";
import { useCreateOrder, useCustomers, useDeleteOrder, useOrders, useSaleableStock, useUpdateOrderStatus } from "../hooks/useApi";
import { formatDate } from "../utils/formatDate";

export const Orders = () => {
  const { data: orders = [], isLoading } = useOrders();
  const { data: customers = [], isLoading: customersLoading } = useCustomers();
  const { data: stock = [], isLoading: stockLoading } = useSaleableStock();
  const createOrder = useCreateOrder();
  const deleteOrder = useDeleteOrder();
  const updateStatus = useUpdateOrderStatus();

  const [createOpen, setCreateOpen] = useState(false);
  const [detailId, setDetailId] = useState<number | null>(null);
  const [customerId, setCustomerId] = useState(0);
  const [expectedDelivery, setExpectedDelivery] = useState("");
  const [notes, setNotes] = useState("");
  const [lines, setLines] = useState<{ stock_item_id: number; name: string; quantity: string; unit_price: string }[]>([]);
  const [selectedStock, setSelectedStock] = useState<number>(0);
  const [lineQty, setLineQty] = useState("");
  const [linePrice, setLinePrice] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const detailOrder = orders.find((o: any) => o.id === detailId);

  const addLine = () => {
    const item = stock.find((s: any) => s.id === selectedStock);
    const qty = Number(lineQty);
    const price = Number(linePrice);
    if (!item || !qty || qty <= 0 || !price || price <= 0) {
      setError("Select an item, quantity, and price."); return;
    }
    if (lines.some((l) => l.stock_item_id === selectedStock)) {
      setError("Item already added."); return;
    }
    setLines([...lines, { stock_item_id: selectedStock, name: item.name, quantity: String(qty), unit_price: String(price) }]);
    setSelectedStock(0); setLineQty(""); setLinePrice(""); setError("");
  };

  const saveOrder = async () => {
    if (!customerId) { setError("Select a customer."); return; }
    if (!lines.length) { setError("Add at least one item."); return; }
    try {
      await createOrder.mutateAsync({
        customer_id: customerId,
        expected_delivery: expectedDelivery || undefined,
        notes: notes || undefined,
        lines: lines.map((l) => ({ stock_item_id: l.stock_item_id, quantity: Number(l.quantity), unit_price: Number(l.unit_price) })),
      });
      setCreateOpen(false); resetForm(); setSuccess("Order created!");
    } catch (e: any) { setError(e.response?.data?.detail || "Could not create order."); }
  };

  const resetForm = () => {
    setCustomerId(0); setExpectedDelivery(""); setNotes(""); setLines([]); setError("");
  };

  const handleDelete = async (orderId: number) => {
    if (!window.confirm("Delete this order?")) return;
    try { await deleteOrder.mutateAsync(orderId); setSuccess("Order deleted."); } catch { setError("Could not delete order."); }
  };

  const hasShortage = (order: any) => order.lines?.some((l: any) => l.shortage > 0);
  const totalShortage = (order: any) => order.lines?.reduce((sum: number, l: any) => sum + l.shortage, 0) || 0;

  return (
    <Box>
      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 2 }}>
        <Box>
          <Typography variant="h4" sx={{ fontWeight: 700, fontSize: { xs: "1.5rem", sm: "2rem" } }}>Orders</Typography>
          <Typography color="text.secondary" sx={{ fontSize: { xs: "0.75rem", sm: "0.875rem" } }}>Track customer orders and stock availability.</Typography>
        </Box>
        <Button startIcon={<AddRoundedIcon />} variant="contained" size="small" onClick={() => { resetForm(); setCreateOpen(true); }} sx={{ fontSize: { xs: "0.75rem", sm: "0.875rem" } }}>New Order</Button>
      </Box>

      {/* Summary Cards */}
      <Box sx={{ display: "grid", gridTemplateColumns: { xs: "repeat(2, 1fr)", sm: "repeat(4, 1fr)" }, gap: { xs: 1, sm: 2 }, mb: 2 }}>
        <Card sx={{ bgcolor: "grey.50" }}><CardContent sx={{ p: { xs: 1, sm: 1.5 }, "&:last-child": { pb: { xs: 1, sm: 1.5 } } }}><Typography variant="caption" sx={{ fontSize: "0.65rem", color: "text.secondary" }}>Total Orders</Typography><Typography variant="h6" sx={{ fontWeight: 700 }}>{isLoading ? <CircularProgress size={18} /> : orders.length}</Typography></CardContent></Card>
        <Card sx={{ bgcolor: "warning.50" }}><CardContent sx={{ p: { xs: 1, sm: 1.5 }, "&:last-child": { pb: { xs: 1, sm: 1.5 } } }}><Typography variant="caption" sx={{ fontSize: "0.65rem", color: "text.secondary" }}>Pending</Typography><Typography variant="h6" sx={{ fontWeight: 700, color: "warning.main" }}>{isLoading ? <CircularProgress size={18} /> : orders.filter((o: any) => o.status === "PENDING").length}</Typography></CardContent></Card>
        <Card sx={{ bgcolor: "error.50" }}><CardContent sx={{ p: { xs: 1, sm: 1.5 }, "&:last-child": { pb: { xs: 1, sm: 1.5 } } }}><Typography variant="caption" sx={{ fontSize: "0.65rem", color: "text.secondary" }}>Stock Shortages</Typography><Typography variant="h6" sx={{ fontWeight: 700, color: "error.main" }}>{isLoading ? <CircularProgress size={18} /> : orders.filter(hasShortage).length}</Typography></CardContent></Card>
        <Card sx={{ bgcolor: "success.50" }}><CardContent sx={{ p: { xs: 1, sm: 1.5 }, "&:last-child": { pb: { xs: 1, sm: 1.5 } } }}><Typography variant="caption" sx={{ fontSize: "0.65rem", color: "text.secondary" }}>Confirmed</Typography><Typography variant="h6" sx={{ fontWeight: 700, color: "success.main" }}>{isLoading ? <CircularProgress size={18} /> : orders.filter((o: any) => o.status === "CONFIRMED").length}</Typography></CardContent></Card>
      </Box>

      {/* Orders Table */}
      <TableContainer component={Paper} sx={{ overflowX: "auto" }}>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell sx={{ fontWeight: 700, fontSize: { xs: "0.7rem", sm: "0.8rem" } }}>#</TableCell>
              <TableCell sx={{ fontWeight: 700, fontSize: { xs: "0.7rem", sm: "0.8rem" } }}>Customer</TableCell>
              <TableCell sx={{ fontWeight: 700, fontSize: { xs: "0.7rem", sm: "0.8rem" }, display: { xs: "none", sm: "table-cell" } }}>Date</TableCell>
              <TableCell sx={{ fontWeight: 700, fontSize: { xs: "0.7rem", sm: "0.8rem" }, display: { xs: "none", md: "table-cell" } }}>Items</TableCell>
              <TableCell sx={{ fontWeight: 700, fontSize: { xs: "0.7rem", sm: "0.8rem" } }}>Amount</TableCell>
              <TableCell sx={{ fontWeight: 700, fontSize: { xs: "0.7rem", sm: "0.8rem" }, display: { xs: "none", sm: "table-cell" } }}>Stock</TableCell>
              <TableCell sx={{ fontWeight: 700, fontSize: { xs: "0.7rem", sm: "0.8rem" } }}>Status</TableCell>
              <TableCell sx={{ fontWeight: 700, fontSize: { xs: "0.7rem", sm: "0.8rem" } }}></TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {isLoading ? (
              <TableRow><TableCell colSpan={8} align="center"><CircularProgress size={24} /></TableCell></TableRow>
            ) : orders.length ? orders.map((order: any) => (
              <TableRow key={order.id} hover sx={{ cursor: "pointer" }}>
                <TableCell sx={{ fontSize: { xs: "0.7rem", sm: "0.8rem" }, fontWeight: 600 }} onClick={() => setDetailId(order.id)}>#{order.id}</TableCell>
                <TableCell sx={{ fontSize: { xs: "0.7rem", sm: "0.8rem" } }} onClick={() => setDetailId(order.id)}>{order.customer_name}</TableCell>
                <TableCell sx={{ fontSize: { xs: "0.7rem", sm: "0.8rem" }, display: { xs: "none", sm: "table-cell" } }} onClick={() => setDetailId(order.id)}>{formatDate(order.ordered_at)}</TableCell>
                <TableCell sx={{ fontSize: { xs: "0.7rem", sm: "0.8rem" }, display: { xs: "none", md: "table-cell" } }} onClick={() => setDetailId(order.id)}>{order.lines?.length || 0}</TableCell>
                <TableCell sx={{ fontSize: { xs: "0.7rem", sm: "0.8rem" }, fontWeight: 700 }} onClick={() => setDetailId(order.id)}>₹{order.total_amount.toFixed(0)}</TableCell>
                <TableCell onClick={() => setDetailId(order.id)} sx={{ display: { xs: "none", sm: "table-cell" } }}>
                  {hasShortage(order) ? (
                    <Chip icon={<WarningAmberRoundedIcon sx={{ fontSize: "0.9rem !important" }} />} label={`${totalShortage(order)} short`} color="error" size="small" sx={{ fontSize: "0.65rem", height: 20 }} />
                  ) : (
                    <Chip icon={<CheckCircleOutlineRoundedIcon sx={{ fontSize: "0.9rem !important" }} />} label="In stock" color="success" size="small" sx={{ fontSize: "0.65rem", height: 20 }} />
                  )}
                </TableCell>
                <TableCell onClick={() => setDetailId(order.id)}>
                  <Chip label={order.status} color={order.status === "CONFIRMED" ? "success" : order.status === "CANCELLED" ? "error" : "warning"} size="small" sx={{ fontSize: "0.65rem", height: 20 }} />
                </TableCell>
                <TableCell>
                  <Button size="small" color="error" onClick={() => handleDelete(order.id)} disabled={deleteOrder.isPending} sx={{ fontSize: "0.65rem", minWidth: "auto", px: 1 }}>Del</Button>
                </TableCell>
              </TableRow>
            )) : (
              <TableRow><TableCell colSpan={8} align="center" sx={{ py: 4, fontSize: "0.85rem", color: "text.secondary" }}>No orders yet.</TableCell></TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Create Order Dialog */}
      <Dialog open={createOpen} onClose={() => setCreateOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ fontWeight: 700 }}>New Customer Order</DialogTitle>
        <DialogContent>
          {error && <Alert severity="error" sx={{ mt: 1 }} onClose={() => setError("")}>{error}</Alert>}
          <Autocomplete
            options={customers}
            getOptionLabel={(c: any) => c.name}
            value={customers.find((c: any) => c.id === customerId) || null}
            onChange={(_, v) => setCustomerId(v?.id || 0)}
            loading={customersLoading}
            disabled={customersLoading}
            renderInput={(params) => <TextField {...params} margin="dense" label={customersLoading ? "Loading customers..." : "Customer"} />}
          />
          <TextField margin="dense" label="Expected delivery date" type="date" fullWidth value={expectedDelivery} onChange={(e) => setExpectedDelivery(e.target.value)} slotProps={{ inputLabel: { shrink: true } }} />
          <TextField margin="dense" label="Notes" fullWidth multiline rows={2} value={notes} onChange={(e) => setNotes(e.target.value)} />

          <Typography variant="subtitle2" sx={{ mt: 2, mb: 1, fontWeight: 700 }}>Order Items</Typography>
          <Box sx={{ display: "flex", gap: 1, alignItems: "center", flexWrap: "wrap" }}>
            <Autocomplete
              sx={{ flex: "1 1 200px" }}
              options={stock.filter((s: any) => !lines.some((l) => l.stock_item_id === s.id))}
              getOptionLabel={(s: any) => `${s.name} (${s.qty} ${s.unit} in stock)`}
              value={stock.find((s: any) => s.id === selectedStock) || null}
              onChange={(_, v) => { setSelectedStock(v?.id || 0); setLinePrice(v?.unit_price > 0 ? String(v.unit_price) : ""); }}
              loading={stockLoading}
              disabled={stockLoading}
              renderInput={(params) => <TextField {...params} size="small" label={stockLoading ? "Loading products..." : "Product"} />}
            />
            <TextField size="small" label="Qty" type="number" value={lineQty} onChange={(e) => setLineQty(e.target.value)} sx={{ width: 80 }} />
            <TextField size="small" label="Price (₹)" type="number" value={linePrice} onChange={(e) => setLinePrice(e.target.value)} sx={{ width: 100 }} />
            <Button onClick={addLine} variant="outlined" size="small">Add</Button>
          </Box>

          {lines.map((line, i) => {
            const item = stock.find((s: any) => s.id === line.stock_item_id);
            const available = item?.qty || 0;
            const shortage = Math.max(Number(line.quantity) - available, 0);
            return (
              <Box key={i} sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mt: 1, py: 0.5, borderBottom: 1, borderColor: "divider" }}>
                <Box>
                  <Typography variant="body2" sx={{ fontWeight: 600 }}>{line.name}</Typography>
                  <Typography variant="caption" color="text.secondary">
                    {line.quantity} × ₹{line.unit_price} = ₹{(Number(line.quantity) * Number(line.unit_price)).toFixed(0)}
                    {shortage > 0 && <span style={{ color: "#d32f2f", fontWeight: 600 }}> · {shortage} short</span>}
                  </Typography>
                </Box>
                <Button size="small" color="error" onClick={() => setLines(lines.filter((_, idx) => idx !== i))}>Remove</Button>
              </Box>
            );
          })}

          {lines.length > 0 && (
            <Box sx={{ mt: 1, p: 1, bgcolor: "action.hover", borderRadius: 1 }}>
              <Typography variant="body2" sx={{ fontWeight: 700 }}>Total: ₹{lines.reduce((sum, l) => sum + Number(l.quantity) * Number(l.unit_price), 0).toFixed(0)}</Typography>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCreateOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={saveOrder} disabled={createOrder.isPending}>
            {createOrder.isPending ? <CircularProgress size={20} /> : "Create Order"}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Order Detail Dialog */}
      <Dialog open={!!detailId} onClose={() => setDetailId(null)} maxWidth="md" fullWidth>
        <DialogTitle sx={{ fontWeight: 700 }}>
          {detailOrder && (
            <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
              Order #{detailOrder.id} — {detailOrder.customer_name}
              <Chip label={detailOrder.status} color={detailOrder.status === "CONFIRMED" ? "success" : detailOrder.status === "CANCELLED" ? "error" : "warning"} size="small" />
            </Box>
          )}
        </DialogTitle>
        <DialogContent>
          {detailOrder && (
            <>
              {/* Shortage Alert */}
              {hasShortage(detailOrder) && (
                <Alert severity="warning" sx={{ mb: 2 }}>
                  <Typography variant="body2" sx={{ fontWeight: 600 }}>Stock Shortage</Typography>
                  {detailOrder.lines.filter((l: any) => l.shortage > 0).map((l: any) => (
                    <Typography key={l.id} variant="caption" sx={{ display: "block" }}>
                      {l.stock_item_name}: need {l.quantity}, have {l.stock_available} → <strong>produce {l.shortage} more</strong>
                    </Typography>
                  ))}
                </Alert>
              )}

              {/* Order Lines */}
              <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1 }}>Order Items</Typography>
              <TableContainer component={Paper} sx={{ mb: 2 }}>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell sx={{ fontWeight: 700, fontSize: "0.75rem" }}>Product</TableCell>
                      <TableCell sx={{ fontWeight: 700, fontSize: "0.75rem" }} align="right">Ordered</TableCell>
                      <TableCell sx={{ fontWeight: 700, fontSize: "0.75rem" }} align="right">In Stock</TableCell>
                      <TableCell sx={{ fontWeight: 700, fontSize: "0.75rem" }} align="right">Shortage</TableCell>
                      <TableCell sx={{ fontWeight: 700, fontSize: "0.75rem" }} align="right">Unit Price</TableCell>
                      <TableCell sx={{ fontWeight: 700, fontSize: "0.75rem" }} align="right">Total</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {detailOrder.lines.map((line: any) => (
                      <TableRow key={line.id}>
                        <TableCell sx={{ fontSize: "0.8rem", fontWeight: 600 }}>{line.stock_item_name}</TableCell>
                        <TableCell sx={{ fontSize: "0.8rem" }} align="right">{line.quantity}</TableCell>
                        <TableCell sx={{ fontSize: "0.8rem" }} align="right">{line.stock_available}</TableCell>
                        <TableCell sx={{ fontSize: "0.8rem", fontWeight: 700, color: line.shortage > 0 ? "error.main" : "success.main" }} align="right">{line.shortage > 0 ? line.shortage : "—"}</TableCell>
                        <TableCell sx={{ fontSize: "0.8rem" }} align="right">₹{line.unit_price.toFixed(0)}</TableCell>
                        <TableCell sx={{ fontSize: "0.8rem", fontWeight: 700 }} align="right">₹{(line.quantity * line.unit_price).toFixed(0)}</TableCell>
                      </TableRow>
                    ))}
                    <TableRow sx={{ bgcolor: "action.hover" }}>
                      <TableCell colSpan={5} sx={{ fontWeight: 700, fontSize: "0.8rem" }}>Total</TableCell>
                      <TableCell sx={{ fontWeight: 700, fontSize: "0.8rem" }} align="right">₹{detailOrder.total_amount.toFixed(0)}</TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </TableContainer>

              {/* Order Info */}
              <Box sx={{ display: "flex", gap: 2, color: "text.secondary", fontSize: "0.8rem" }}>
                <Typography variant="body2">Ordered: {formatDate(detailOrder.ordered_at)}</Typography>
                {detailOrder.expected_delivery && <Typography variant="body2">Expected: {detailOrder.expected_delivery}</Typography>}
                {detailOrder.notes && <Typography variant="body2">Notes: {detailOrder.notes}</Typography>}
              </Box>
            </>
          )}
        </DialogContent>
        <DialogActions sx={{ justifyContent: "space-between" }}>
          <Box>
            {detailOrder?.status === "PENDING" && <Button size="small" color="success" variant="outlined" disabled={updateStatus.isPending} onClick={() => updateStatus.mutateAsync({ orderId: detailOrder.id, status: "CONFIRMED" })}>Confirm</Button>}
            {detailOrder?.status === "CONFIRMED" && <Button size="small" color="warning" variant="outlined" disabled={updateStatus.isPending} onClick={() => updateStatus.mutateAsync({ orderId: detailOrder.id, status: "PENDING" })}>Mark pending</Button>}
            {detailOrder?.status !== "CANCELLED" && <Button size="small" color="error" variant="outlined" disabled={updateStatus.isPending} onClick={() => { if (window.confirm("Cancel this order?")) updateStatus.mutateAsync({ orderId: detailOrder!.id, status: "CANCELLED" }); }}>Cancel order</Button>}
          </Box>
          <Button onClick={() => setDetailId(null)}>Close</Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar */}
      {success && <Alert severity="success" sx={{ position: "fixed", bottom: { xs: 80, sm: 16 }, right: 16, zIndex: 9999 }} onClose={() => setSuccess("")}>{success}</Alert>}
      {error && !createOpen && <Alert severity="error" sx={{ position: "fixed", bottom: { xs: 80, sm: 16 }, right: 16, zIndex: 9999 }} onClose={() => setError("")}>{error}</Alert>}
    </Box>
  );
};
