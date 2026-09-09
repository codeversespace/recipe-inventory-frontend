import { Alert, Autocomplete, Box, Button, Card, CardContent, CircularProgress, Dialog, DialogActions, DialogContent, DialogTitle, Divider, IconButton, Menu, MenuItem, Paper, Stack, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, TextField, Typography, useMediaQuery, useTheme } from "@mui/material";
import AddRoundedIcon from "@mui/icons-material/AddRounded";
import MoreVertRoundedIcon from "@mui/icons-material/MoreVertRounded";
import { useState, useMemo } from "react";
import { useCreateProcessingOrder, useCreateProcessor, useCollectiveProcessingPayment, useDeleteIngredient, useDeleteProcessingOrder, useDeleteProcessor, useIngredients, useProcessingOrders, useProcessingPayment, useProcessors, useReceiveProcessing } from "../hooks/useApi";
import { formatDate } from "../utils/formatDate";
import { formatMoney } from "../utils/formatNumber";
import { DeleteButton, EmptyState, ErrorState, FormSection, PageHeader, StatusChip, TableSkeleton } from "../components/ui";

export const Processing = () => {
  const [processorFilter, setProcessorFilter] = useState<number | null>(null);
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const filterParams: any = useMemo(() => {
    const params: any = {};
    if (processorFilter) params.processor_id = processorFilter;
    if (dateFrom) params.start_date = dateFrom;
    if (dateTo) params.end_date = dateTo;
    return params;
  }, [processorFilter, dateFrom, dateTo]);

  const { data: orders = [], isLoading, error: ordersError, refetch: refetchOrders } = useProcessingOrders(filterParams);
  const { data: ingredients = [], isLoading: ingredientsLoading } = useIngredients();
  const { data: processors = [], isLoading: processorsLoading } = useProcessors();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));
  const [menuAnchor, setMenuAnchor] = useState<null | HTMLElement>(null);
  const createOrder = useCreateProcessingOrder();
  const receiveProcessing = useReceiveProcessing();
  const addPayment = useProcessingPayment();
  const deleteOrder = useDeleteProcessingOrder();
  const createProcessor = useCreateProcessor();
  const deleteProcessor = useDeleteProcessor();
  const deleteIngredient = useDeleteIngredient();
  const collectivePayment = useCollectiveProcessingPayment();

  const [createOpen, setCreateOpen] = useState(false);
  const [collectivePayOpen, setCollectivePayOpen] = useState(false);
  const [collectiveProcId, setCollectiveProcId] = useState(0);
  const [collectiveAmount, setCollectiveAmount] = useState("");
  const [collectiveMethod, setCollectiveMethod] = useState("CASH");
  const [collectiveRef, setCollectiveRef] = useState("");
  const [detailId, setDetailId] = useState<number | null>(null);
  const [receiveOpen, setReceiveOpen] = useState<number | null>(null);
  const [payOpen, setPayOpen] = useState<number | null>(null);
  const [processorOpen, setProcessorOpen] = useState(false);

  const [rawId, setRawId] = useState(0);
  const [selectedProcessorId, setSelectedProcessorId] = useState(0);
  const [qtySent, setQtySent] = useState("");
  const [costPerKg, setCostPerKg] = useState("");
  const [notes, setNotes] = useState("");

  const [qtyReceived, setQtyReceived] = useState("");

  const [payAmount, setPayAmount] = useState("");
  const [payMethod, setPayMethod] = useState("CASH");
  const [payRef, setPayRef] = useState("");

  const [newProcName, setNewProcName] = useState("");
  const [newProcPhone, setNewProcPhone] = useState("");
  const [newProcAddr, setNewProcAddr] = useState("");

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const detailOrder = orders.find((o: any) => o.id === detailId);

  const resetCreate = () => { setRawId(0); setSelectedProcessorId(0); setQtySent(""); setCostPerKg(""); setNotes(""); setError(""); };

  const saveOrder = async () => {
    const raw = ingredients.find((i: any) => i.id === rawId);
    if (!raw || !selectedProcessorId || !Number(qtySent) || Number(qtySent) <= 0 || !Number(costPerKg) || Number(costPerKg) < 0) {
      setError("Fill all fields with valid values."); return;
    }
    if (Number(qtySent) > (raw.on_hand_qty || 0)) {
      setError(`Insufficient stock. Available: ${raw.on_hand_qty} ${raw.base_unit}`); return;
    }
    try {
      await createOrder.mutateAsync({ raw_ingredient_id: rawId, processor_id: selectedProcessorId, quantity_sent: Number(qtySent), cost_per_expected_kg: Number(costPerKg), notes: notes || undefined });
      setCreateOpen(false); resetCreate(); setSuccess("Processing order created. Stock deducted.");
    } catch (e: any) { setError(e.response?.data?.detail || "Could not create order."); }
  };

  const saveReceive = async () => {
    if (!receiveOpen || !Number(qtyReceived) || Number(qtyReceived) <= 0) { setError("Enter a valid quantity received."); return; }
    try {
      await receiveProcessing.mutateAsync({ orderId: receiveOpen, quantity_received: Number(qtyReceived) });
      setReceiveOpen(null); setQtyReceived(""); setSuccess("Received! Processed ingredient added to stock."); setDetailId(null);
    } catch (e: any) { setError(e.response?.data?.detail || "Could not receive."); }
  };

  const savePayment = async () => {
    if (!payOpen || !Number(payAmount) || Number(payAmount) <= 0) { setError("Enter a valid amount."); return; }
    try {
      await addPayment.mutateAsync({ orderId: payOpen, amount: Number(payAmount), method: payMethod, reference: payRef || undefined });
      setPayOpen(null); setPayAmount(""); setPayRef(""); setPayMethod("CASH"); setSuccess("Payment recorded.");
    } catch (e: any) { setError(e.response?.data?.detail || "Could not record payment."); }
  };

  const saveCollectivePayment = async () => {
    if (!collectiveProcId || !Number(collectiveAmount) || Number(collectiveAmount) <= 0) { setError("Select processor and enter a valid amount."); return; }
    try {
      const result = await collectivePayment.mutateAsync({ processor_id: collectiveProcId, amount: Number(collectiveAmount), method: collectiveMethod, reference: collectiveRef || undefined });
      setCollectivePayOpen(false); setCollectiveProcId(0); setCollectiveAmount(""); setCollectiveRef(""); setCollectiveMethod("CASH");
      setSuccess(`Payment allocated across ${result?.length || 0} order(s).`);
    } catch (e: any) { setError(e.response?.data?.detail || "Could not record payment."); }
  };

  const handleDelete = (orderId: number) =>
    deleteOrder.mutateAsync(orderId).then(
      () => setSuccess("Order deleted. Stock restored."),
      (e: any) => setError(e.response?.data?.detail || "Could not delete."),
    );

  const saveProcessor = async () => {
    if (!newProcName.trim()) { setError("Processor name required."); return; }
    try {
      await createProcessor.mutateAsync({ name: newProcName.trim(), phone: newProcPhone || undefined, address: newProcAddr || undefined });
      setNewProcName(""); setNewProcPhone(""); setNewProcAddr(""); setProcessorOpen(false); setSuccess("Processor created.");
    } catch (e: any) { setError(e.response?.data?.detail || "Could not create processor."); }
  };

  const handleDeleteProcessor = async (id: number) => {
    try { await deleteProcessor.mutateAsync(id); setSuccess("Processor deleted."); } catch (e: any) { setError(e.response?.data?.detail || "Could not delete processor."); }
  };

  const pending = orders.filter((o: any) => o.status === "PENDING");
  const completed = orders.filter((o: any) => o.status === "COMPLETED");
  const totalSent = orders.reduce((s: number, o: any) => s + o.quantity_sent, 0);
  const totalReceived = orders.reduce((s: number, o: any) => s + (o.quantity_received || 0), 0);
  const totalPaid = orders.reduce((s: number, o: any) => s + (o.total_paid || 0), 0);
  const totalDue = orders.reduce((s: number, o: any) => s + (o.balance_due || 0), 0);
  const headerSx = { fontWeight: 700, fontSize: { xs: "0.7rem" as const, sm: "0.8rem" as const } };
  const cellSx = { fontSize: { xs: "0.7rem" as const, sm: "0.8rem" as const } };

  return (
    <Box>
      <PageHeader
        title="Processing"
        subtitle="Track raw material processing (seed removal, peeling, etc.)"
        actions={
          <Box sx={{ display: "flex", gap: 1, width: { xs: "100%", sm: "auto" } }}>
            <Button startIcon={<AddRoundedIcon />} variant="contained" onClick={() => { resetCreate(); setCreateOpen(true); }} sx={{ flex: { xs: 1, sm: "0 0 auto" } }}>
              New Order
            </Button>
            <IconButton aria-label="More processing actions" aria-haspopup="menu" onClick={(e) => setMenuAnchor(e.currentTarget)} sx={{ minWidth: 44, border: 1, borderColor: "divider", borderRadius: 2 }}>
              <MoreVertRoundedIcon />
            </IconButton>
          </Box>
        }
      />
      <Menu anchorEl={menuAnchor} open={!!menuAnchor} onClose={() => setMenuAnchor(null)}>
        <MenuItem onClick={() => { setMenuAnchor(null); setProcessorOpen(true); }}>Manage processors</MenuItem>
        <MenuItem onClick={() => { setMenuAnchor(null); setCollectiveProcId(0); setCollectiveAmount(""); setCollectiveRef(""); setCollectivePayOpen(true); }}>Pay processor</MenuItem>
      </Menu>

      {/* Filters */}
      <Box sx={{ display: "flex", gap: 1, mb: 2, flexWrap: "wrap" }}>
        <Autocomplete
          options={[{ id: 0, name: "All Processors" }, ...processors]}
          getOptionLabel={(p: any) => p.name}
          value={processors.find((p: any) => p.id === processorFilter) || { id: 0, name: "All Processors" }}
          onChange={(_, v) => setProcessorFilter(v?.id || null)}
          renderInput={(params) => <TextField {...params} label="Filter by processor" size="small" />}
          sx={{ minWidth: 200 }}
        />
        <TextField label="From" type="date" size="small" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} slotProps={{ inputLabel: { shrink: true } }} />
        <TextField label="To" type="date" size="small" value={dateTo} onChange={(e) => setDateTo(e.target.value)} slotProps={{ inputLabel: { shrink: true } }} />
      </Box>

      {/* Summary */}
      <Box sx={{ display: "grid", gridTemplateColumns: { xs: "repeat(2, 1fr)", sm: "repeat(3, 1fr)", md: "repeat(6, 1fr)" }, gap: { xs: 1, sm: 1.5 }, mb: 2 }}>
        <Card sx={{ bgcolor: "grey.50" }}><CardContent sx={{ p: 1, "&:last-child": { pb: 1 } }}><Typography variant="caption" sx={{ fontSize: "0.75rem", color: "text.secondary" }}>Orders</Typography><Typography variant="h6" sx={{ fontWeight: 700, fontSize: "1.1rem" }}>{isLoading ? <CircularProgress size={16} /> : orders.length}</Typography></CardContent></Card>
        <Card sx={{ bgcolor: "warning.50" }}><CardContent sx={{ p: 1, "&:last-child": { pb: 1 } }}><Typography variant="caption" sx={{ fontSize: "0.75rem", color: "text.secondary" }}>Pending</Typography><Typography variant="h6" sx={{ fontWeight: 700, fontSize: "1.1rem", color: "warning.main" }}>{isLoading ? <CircularProgress size={16} /> : pending.length}</Typography></CardContent></Card>
        <Card sx={{ bgcolor: "info.50" }}><CardContent sx={{ p: 1, "&:last-child": { pb: 1 } }}><Typography variant="caption" sx={{ fontSize: "0.75rem", color: "text.secondary" }}>Sent (kg)</Typography><Typography variant="h6" sx={{ fontWeight: 700, fontSize: "1.1rem" }}>{isLoading ? <CircularProgress size={16} /> : totalSent.toFixed(0)}</Typography></CardContent></Card>
        <Card sx={{ bgcolor: "success.50" }}><CardContent sx={{ p: 1, "&:last-child": { pb: 1 } }}><Typography variant="caption" sx={{ fontSize: "0.75rem", color: "text.secondary" }}>Received (kg)</Typography><Typography variant="h6" sx={{ fontWeight: 700, fontSize: "1.1rem", color: "success.main" }}>{isLoading ? <CircularProgress size={16} /> : totalReceived.toFixed(0)}</Typography></CardContent></Card>
        <Card sx={{ bgcolor: "primary.50" }}><CardContent sx={{ p: 1, "&:last-child": { pb: 1 } }}><Typography variant="caption" sx={{ fontSize: "0.75rem", color: "text.secondary" }}>Paid</Typography><Typography variant="h6" sx={{ fontWeight: 700, fontSize: "1.1rem", color: "primary.main" }}>{isLoading ? <CircularProgress size={16} /> : formatMoney(totalPaid)}</Typography></CardContent></Card>
        <Card sx={{ bgcolor: "error.50" }}><CardContent sx={{ p: 1, "&:last-child": { pb: 1 } }}><Typography variant="caption" sx={{ fontSize: "0.75rem", color: "text.secondary" }}>Due</Typography><Typography variant="h6" sx={{ fontWeight: 700, fontSize: "1.1rem", color: "error.main" }}>{isLoading ? <CircularProgress size={16} /> : formatMoney(totalDue)}</Typography></CardContent></Card>
      </Box>

      {/* Orders Table (desktop) / Cards (mobile) */}
      <Box sx={{ display: { xs: "none", sm: "block" } }}>
      <TableContainer component={Paper} sx={{ overflowX: "auto" }}>
        <Table size="small" sx={{ minWidth: 760 }}>
          <TableHead>
            <TableRow>
              <TableCell sx={headerSx}>#</TableCell>
              <TableCell sx={headerSx}>Processor</TableCell>
              <TableCell sx={{ ...headerSx, display: { xs: "none", sm: "table-cell" } }}>Raw ingredient</TableCell>
              <TableCell sx={headerSx}>Sent</TableCell>
              <TableCell sx={{ ...headerSx, display: { xs: "none", md: "table-cell" } }}>Received</TableCell>
              <TableCell sx={{ ...headerSx, display: { xs: "none", md: "table-cell" } }}>Yield</TableCell>
              <TableCell sx={headerSx}>Status</TableCell>
              <TableCell sx={headerSx}>Balance</TableCell>
              <TableCell sx={headerSx}>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {isLoading ? (
              <TableSkeleton rows={5} colSpan={9} />
            ) : ordersError ? (
              <TableRow><TableCell colSpan={9} align="center"><ErrorState message={(ordersError as any).message} onRetry={() => refetchOrders()} /></TableCell></TableRow>
            ) : orders.length ? orders.map((order: any) => (
              <TableRow key={order.id} hover>
                <TableCell sx={{ ...cellSx, fontWeight: 600 }}>#{order.id}</TableCell>
                <TableCell sx={cellSx}>{order.processor_name}</TableCell>
                <TableCell sx={{ ...cellSx, display: { xs: "none", sm: "table-cell" } }}>{order.raw_ingredient_name}</TableCell>
                <TableCell sx={{ ...cellSx, fontWeight: 700 }} className="tnum">{order.quantity_sent} kg</TableCell>
                <TableCell sx={{ ...cellSx, display: { xs: "none", md: "table-cell" } }} className="tnum">{order.quantity_received > 0 ? `${order.quantity_received} kg` : "—"}</TableCell>
                <TableCell sx={{ ...cellSx, display: { xs: "none", md: "table-cell" } }} className="tnum">{order.yield_pct > 0 ? `${order.yield_pct.toFixed(1)}%` : "—"}</TableCell>
                <TableCell>
                  <StatusChip status={order.status === "COMPLETED" ? "success" : "warning"} label={order.status} />
                </TableCell>
                <TableCell sx={{ ...cellSx, fontWeight: 700, color: order.balance_due > 0 ? "error.main" : "success.main" }} className="tnum">{formatMoney(order.balance_due)}</TableCell>
                <TableCell>
                  <Box sx={{ display: "flex", gap: 0.5 }}>
                    <Button size="small" onClick={() => setDetailId(order.id)} aria-label={`View processing order ${order.id}`}>View</Button>
                    {order.status === "PENDING" && (
                      <DeleteButton
                        label="Delete"
                        itemName={`processing order ${order.id}`}
                        confirmMessage="Delete this processing order? Consumed stock will be restored. This cannot be undone."
                        onDelete={() => handleDelete(order.id)}
                      />
                    )}
                  </Box>
                </TableCell>
              </TableRow>
            )) : (
              <TableRow><TableCell colSpan={9} align="center" sx={{ py: 3 }}><EmptyState title="No processing orders found." message="Create an order to send raw material for processing." actionLabel="New Order" onAction={() => { resetCreate(); setCreateOpen(true); }} /></TableCell></TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>
      </Box>
      <Box sx={{ display: { xs: "block", sm: "none" } }}>
        {isLoading ? (
          <Box sx={{ display: "flex", justifyContent: "center", py: 4 }}><CircularProgress /></Box>
        ) : ordersError ? (
          <ErrorState message={(ordersError as any).message} onRetry={() => refetchOrders()} />
        ) : orders.length ? (
          <Stack spacing={1.5}>
            {orders.map((order: any) => (
              <Card key={order.id} variant="outlined">
                <CardContent sx={{ p: 2, "&:last-child": { pb: 2 } }}>
                  <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 1 }}>
                    <Box sx={{ minWidth: 0 }}>
                      <Typography variant="subtitle2" sx={{ fontWeight: 700, fontSize: "0.9375rem" }}>{order.processor_name}</Typography>
                      <Typography variant="caption" color="text.secondary">#{order.id} · {order.raw_ingredient_name} · {formatDate(order.sent_at)}</Typography>
                    </Box>
                    <StatusChip status={order.status === "COMPLETED" ? "success" : "warning"} label={order.status} />
                  </Box>
                  <Box sx={{ display: "flex", gap: 2, mt: 1 }} className="tnum">
                    <Box><Typography variant="caption" color="text.secondary" sx={{ display: "block" }}>Sent</Typography><Typography variant="body2" sx={{ fontWeight: 700 }}>{order.quantity_sent} kg</Typography></Box>
                    <Box><Typography variant="caption" color="text.secondary" sx={{ display: "block" }}>Received</Typography><Typography variant="body2" sx={{ fontWeight: 600 }}>{order.quantity_received > 0 ? `${order.quantity_received} kg` : "—"}</Typography></Box>
                    <Box><Typography variant="caption" color="text.secondary" sx={{ display: "block" }}>Balance</Typography><Typography variant="body2" sx={{ fontWeight: 700, color: order.balance_due > 0 ? "error.main" : "success.main" }}>{formatMoney(order.balance_due)}</Typography></Box>
                  </Box>
                  <Box sx={{ display: "flex", gap: 1, mt: 1.5 }}>
                    <Button variant="outlined" onClick={() => setDetailId(order.id)} aria-label={`View processing order ${order.id}`} sx={{ flex: 1, minHeight: 44 }}>
                      Details
                    </Button>
                    {order.status === "PENDING" && (
                      <Box sx={{ flex: 1 }}>
                        <DeleteButton
                          fullWidth
                          label="Delete"
                          itemName={`processing order ${order.id}`}
                          confirmMessage="Delete this processing order? Consumed stock will be restored. This cannot be undone."
                          onDelete={() => handleDelete(order.id)}
                        />
                      </Box>
                    )}
                  </Box>
                </CardContent>
              </Card>
            ))}
          </Stack>
        ) : (
          <EmptyState title="No processing orders found." message="Create an order to send raw material for processing." actionLabel="New Order" onAction={() => { resetCreate(); setCreateOpen(true); }} />
        )}
      </Box>

      {/* Create Dialog */}
      <Dialog open={createOpen} onClose={() => setCreateOpen(false)} fullScreen={isMobile} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ fontWeight: 700 }}>New Processing Order</DialogTitle>
        <DialogContent sx={{ pb: 1 }}>
          {error && <Alert severity="error" sx={{ mt: 1 }} onClose={() => setError("")}>{error}</Alert>}
          <FormSection title="Processor & Ingredient">
          <Autocomplete
            options={processors}
            getOptionLabel={(p: any) => p.name}
            value={processors.find((p: any) => p.id === selectedProcessorId) || null}
            onChange={(_, v) => setSelectedProcessorId(v?.id || 0)}
            loading={processorsLoading}
            disabled={processorsLoading}
            renderInput={(params) => <TextField {...params} margin="dense" label={processorsLoading ? "Loading processors..." : "Processor"} />}
          />
          <Autocomplete
            options={ingredients}
            getOptionLabel={(i: any) => `${i.name} (${i.on_hand_qty || 0} ${i.base_unit})`}
            value={ingredients.find((i: any) => i.id === rawId) || null}
            onChange={(_, v) => setRawId(v?.id || 0)}
            loading={ingredientsLoading}
            disabled={ingredientsLoading}
            renderInput={(params) => <TextField {...params} margin="dense" label={ingredientsLoading ? "Loading ingredients..." : "Raw ingredient"} />}
          />
          </FormSection>
          <FormSection title="Quantity & Cost">
          <Box sx={{ display: "flex", gap: 1, mt: 1, flexDirection: { xs: "column", sm: "row" } }}>
            <TextField margin="dense" label="Quantity sent (kg)" type="number" slotProps={{ htmlInput: { inputMode: "decimal", min: 0 } }} fullWidth value={qtySent} onChange={(e) => setQtySent(e.target.value)} />
            <TextField margin="dense" label="Cost per kg (₹)" type="number" slotProps={{ htmlInput: { inputMode: "decimal", min: 0 } }} fullWidth value={costPerKg} onChange={(e) => setCostPerKg(e.target.value)} />
          </Box>
          <TextField margin="dense" label="Notes" fullWidth multiline rows={2} value={notes} onChange={(e) => setNotes(e.target.value)} />
          </FormSection>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCreateOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={saveOrder} disabled={createOrder.isPending}>
            {createOrder.isPending ? <CircularProgress size={20} /> : "Create"}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Detail Dialog */}
      <Dialog open={!!detailId} onClose={() => setDetailId(null)} fullScreen={isMobile} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ fontWeight: 700 }}>
          {detailOrder && `#${detailOrder.id} — ${detailOrder.processor_name}`}
        </DialogTitle>
        <DialogContent sx={{ pb: 1 }}>
          {detailOrder && (
            <>
              <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr" }, gap: 1, mb: 2 }}>
                <Card sx={{ bgcolor: "grey.50" }}><CardContent sx={{ p: 1, "&:last-child": { pb: 1 } }}>
                  <Typography variant="caption" color="text.secondary">Raw ingredient</Typography>
                  <Typography variant="body2" sx={{ fontWeight: 700 }}>{detailOrder.raw_ingredient_name}</Typography>
                </CardContent></Card>
                <Card sx={{ bgcolor: "grey.50" }}><CardContent sx={{ p: 1, "&:last-child": { pb: 1 } }}>
                  <Typography variant="caption" color="text.secondary">Quantity sent</Typography>
                  <Typography variant="body2" sx={{ fontWeight: 700 }}>{detailOrder.quantity_sent} kg</Typography>
                </CardContent></Card>
                <Card sx={{ bgcolor: "grey.50" }}><CardContent sx={{ p: 1, "&:last-child": { pb: 1 } }}>
                  <Typography variant="caption" color="text.secondary">Cost/kg</Typography>
                  <Typography variant="body2" sx={{ fontWeight: 700 }}>{formatMoney(detailOrder.cost_per_expected_kg)}</Typography>
                </CardContent></Card>
                <Card sx={{ bgcolor: "grey.50" }}><CardContent sx={{ p: 1, "&:last-child": { pb: 1 } }}>
                  <Typography variant="caption" color="text.secondary">Total cost</Typography>
                  <Typography variant="body2" sx={{ fontWeight: 700 }}>{formatMoney(detailOrder.total_cost)}</Typography>
                </CardContent></Card>
                {detailOrder.quantity_received > 0 && (
                  <>
                    <Card sx={{ bgcolor: "success.50" }}><CardContent sx={{ p: 1, "&:last-child": { pb: 1 } }}>
                      <Typography variant="caption" color="text.secondary">Received</Typography>
                      <Typography variant="body2" sx={{ fontWeight: 700 }}>{detailOrder.quantity_received} kg</Typography>
                    </CardContent></Card>
                    <Card sx={{ bgcolor: "success.50" }}><CardContent sx={{ p: 1, "&:last-child": { pb: 1 } }}>
                      <Typography variant="caption" color="text.secondary">Yield</Typography>
                      <Typography variant="body2" sx={{ fontWeight: 700 }}>{detailOrder.yield_pct.toFixed(1)}%</Typography>
                    </CardContent></Card>
                    <Card sx={{ bgcolor: "info.50" }}><CardContent sx={{ p: 1, "&:last-child": { pb: 1 } }}>
                      <Typography variant="caption" color="text.secondary">Cost/kg received</Typography>
                      <Typography variant="body2" sx={{ fontWeight: 700 }}>{formatMoney(detailOrder.cost_per_received_kg)}</Typography>
                    </CardContent></Card>
                  </>
                )}
                <Card sx={{ bgcolor: detailOrder.balance_due > 0 ? "error.50" : "success.50" }}><CardContent sx={{ p: 1, "&:last-child": { pb: 1 } }}>
                  <Typography variant="caption" color="text.secondary">Balance due</Typography>
                  <Typography variant="body2" sx={{ fontWeight: 700, color: detailOrder.balance_due > 0 ? "error.main" : "success.main" }}>{formatMoney(detailOrder.balance_due)}</Typography>
                </CardContent></Card>
              </Box>

              {detailOrder.notes && <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>Notes: {detailOrder.notes}</Typography>}

              {detailOrder.payments.length > 0 && (
                <>
                  <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1 }}>Payments</Typography>
                  <TableContainer component={Paper} sx={{ mb: 1, overflowX: "auto" }}>
                    <Table size="small" sx={{ minWidth: 360 }}>
                      <TableHead><TableRow><TableCell sx={{ fontWeight: 700, fontSize: "0.75rem" }}>Date</TableCell><TableCell sx={{ fontWeight: 700, fontSize: "0.75rem" }}>Amount</TableCell><TableCell sx={{ fontWeight: 700, fontSize: "0.75rem" }}>Method</TableCell></TableRow></TableHead>
                      <TableBody>{detailOrder.payments.map((p: any) => (
                        <TableRow key={p.id}>
                          <TableCell sx={{ fontSize: "0.8rem" }}>{formatDate(p.paid_at)}</TableCell>
                          <TableCell sx={{ fontSize: "0.8rem", fontWeight: 700 }}>{formatMoney(p.amount)}</TableCell>
                          <TableCell sx={{ fontSize: "0.8rem" }}>{p.method}</TableCell>
                        </TableRow>
                      ))}</TableBody>
                    </Table>
                  </TableContainer>
                </>
              )}
            </>
          )}
        </DialogContent>
        <DialogActions sx={{ justifyContent: "space-between", flexWrap: "wrap", gap: 1 }}>
          <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap" }}>
            {detailOrder?.status === "PENDING" && <Button size="small" variant="outlined" color="success" sx={{ minHeight: 44 }} onClick={() => { setReceiveOpen(detailOrder.id); setDetailId(null); }}>Mark received</Button>}
            {detailOrder && detailOrder.balance_due > 0 && <Button size="small" variant="outlined" sx={{ minHeight: 44 }} onClick={() => { setPayOpen(detailOrder.id); setDetailId(null); }}>Pay</Button>}
          </Box>
          <Button onClick={() => setDetailId(null)}>Close</Button>
        </DialogActions>
      </Dialog>

      {/* Receive Dialog */}
      <Dialog open={!!receiveOpen} onClose={() => setReceiveOpen(null)} fullScreen={isMobile} maxWidth="xs" fullWidth>
        <DialogTitle sx={{ fontWeight: 700 }}>Receive processed ingredient</DialogTitle>
        <DialogContent>
          {error && <Alert severity="error" sx={{ mt: 1 }} onClose={() => setError("")}>{error}</Alert>}
          <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
            Processed ingredient will be auto-created as "{detailOrder?.raw_ingredient_name} (Processed)"
          </Typography>
          <TextField margin="dense" label="Quantity received (kg)" type="number" slotProps={{ htmlInput: { inputMode: "decimal", min: 0 } }} fullWidth value={qtyReceived} onChange={(e) => setQtyReceived(e.target.value)} />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setReceiveOpen(null)}>Cancel</Button>
          <Button variant="contained" onClick={saveReceive} disabled={receiveProcessing.isPending}>
            {receiveProcessing.isPending ? <CircularProgress size={20} /> : "Receive"}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Payment Dialog */}
      <Dialog open={!!payOpen} onClose={() => setPayOpen(null)} fullScreen={isMobile} maxWidth="xs" fullWidth>
        <DialogTitle sx={{ fontWeight: 700 }}>Record payment</DialogTitle>
        <DialogContent>
          {error && <Alert severity="error" sx={{ mt: 1 }} onClose={() => setError("")}>{error}</Alert>}
          <TextField margin="dense" label="Amount (₹)" type="number" slotProps={{ htmlInput: { inputMode: "decimal", min: 0 } }} fullWidth value={payAmount} onChange={(e) => setPayAmount(e.target.value)} />
          <TextField margin="dense" label="Method" fullWidth value={payMethod} onChange={(e) => setPayMethod(e.target.value)} helperText="Free text, e.g. CASH, UPI, Bank transfer" />
          <TextField margin="dense" label="Reference" fullWidth value={payRef} onChange={(e) => setPayRef(e.target.value)} />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setPayOpen(null)}>Cancel</Button>
          <Button variant="contained" onClick={savePayment} disabled={addPayment.isPending}>
            {addPayment.isPending ? <CircularProgress size={20} /> : "Pay"}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Create Processor Dialog */}
      <Dialog open={processorOpen} onClose={() => setProcessorOpen(false)} fullScreen={isMobile} maxWidth="xs" fullWidth>
        <DialogTitle sx={{ fontWeight: 700 }}>Add Processor</DialogTitle>
        <DialogContent>
          {error && <Alert severity="error" sx={{ mt: 1 }} onClose={() => setError("")}>{error}</Alert>}
          <TextField margin="dense" label="Name" fullWidth value={newProcName} onChange={(e) => setNewProcName(e.target.value)} />
          <TextField margin="dense" label="Phone" fullWidth value={newProcPhone} onChange={(e) => setNewProcPhone(e.target.value)} />
          <TextField margin="dense" label="Address" fullWidth value={newProcAddr} onChange={(e) => setNewProcAddr(e.target.value)} />
          {processors.length > 0 && (
            <>
              <Divider sx={{ my: 1 }} />
              <Typography variant="caption" color="text.secondary">Existing processors:</Typography>
              <Stack spacing={0.5} sx={{ mt: 0.5 }}>
                {processors.map((p: any) => (
                  <Box key={p.id} sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 1 }}>
                    <Typography variant="body2">{p.name} {p.phone ? `— ${p.phone}` : ""}</Typography>
                    <DeleteButton
                      iconOnly
                      label={`Delete processor ${p.name}`}
                      itemName={p.name}
                      confirmMessage={`Delete processor "${p.name}"? Orders linked to this processor will block deletion.`}
                      onDelete={() => handleDeleteProcessor(p.id)}
                    />
                  </Box>
                ))}
              </Stack>
            </>
          )}
          {(() => {
            const processed = ingredients.filter((i: any) => i.name.endsWith(" (Processed)"));
            if (processed.length === 0) return null;
            return (
              <>
                <Divider sx={{ my: 1 }} />
                <Typography variant="caption" color="text.secondary">Processed ingredients (delete to re-process with correct cost):</Typography>
                <Stack spacing={0.5} sx={{ mt: 0.5 }}>
                  {processed.map((i: any) => (
                    <Box key={i.id} sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 1 }}>
                      <Typography variant="body2">{i.name} — {i.on_hand_qty} {i.base_unit}</Typography>
                      <DeleteButton
                        iconOnly
                        label={`Delete ${i.name}`}
                        itemName={i.name}
                        confirmMessage={`Delete "${i.name}"? This cannot be undone.`}
                        onDelete={() => deleteIngredient.mutateAsync({ id: i.id, force: true })}
                        onSuccess={() => setSuccess("Deleted.")}
                        onError={(e: any) => setError(e.response?.data?.detail || "Could not delete.")}
                      />
                    </Box>
                  ))}
                </Stack>
              </>
            );
          })()}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setProcessorOpen(false)}>Close</Button>
          <Button variant="contained" onClick={saveProcessor} disabled={createProcessor.isPending}>
            {createProcessor.isPending ? <CircularProgress size={20} /> : "Add"}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Collective Payment Dialog */}
      <Dialog open={collectivePayOpen} onClose={() => setCollectivePayOpen(false)} fullScreen={isMobile} maxWidth="xs" fullWidth>
        <DialogTitle sx={{ fontWeight: 700 }}>Pay Processor (collective)</DialogTitle>
        <DialogContent>
          {error && <Alert severity="error" sx={{ mt: 1 }} onClose={() => setError("")}>{error}</Alert>}
          <Typography variant="body2" color="text.secondary" sx={{ mb: 1, fontSize: "0.8rem" }}>
            Allocate a lump-sum payment across all pending orders for this processor (oldest first).
          </Typography>
          <Autocomplete
            options={processors}
            getOptionLabel={(p: any) => p.name}
            value={processors.find((p: any) => p.id === collectiveProcId) || null}
            onChange={(_, v) => setCollectiveProcId(v?.id || 0)}
            renderInput={(params) => <TextField {...params} margin="dense" label="Processor" />}
          />
          <TextField margin="dense" label="Amount" type="number" slotProps={{ htmlInput: { inputMode: "decimal", min: 0 } }} fullWidth value={collectiveAmount} onChange={(e) => setCollectiveAmount(e.target.value)} />
          <TextField margin="dense" label="Method" fullWidth value={collectiveMethod} onChange={(e) => setCollectiveMethod(e.target.value)} helperText="Free text, e.g. CASH, UPI, Bank transfer" />
          <TextField margin="dense" label="Reference" fullWidth value={collectiveRef} onChange={(e) => setCollectiveRef(e.target.value)} />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCollectivePayOpen(false)}>Cancel</Button>
          <Button variant="contained" color="success" onClick={saveCollectivePayment} disabled={collectivePayment.isPending}>
            {collectivePayment.isPending ? <CircularProgress size={20} /> : "Pay & Allocate"}
          </Button>
        </DialogActions>
      </Dialog>

      {success && <Alert severity="success" sx={{ position: "fixed", bottom: { xs: 80, sm: 16 }, right: 16, zIndex: 9999 }} onClose={() => setSuccess("")}>{success}</Alert>}
      {error && !createOpen && !receiveOpen && !payOpen && !detailId && !processorOpen && !collectivePayOpen && <Alert severity="error" sx={{ position: "fixed", bottom: { xs: 80, sm: 16 }, right: 16, zIndex: 9999 }} onClose={() => setError("")}>{error}</Alert>}
    </Box>
  );
};
