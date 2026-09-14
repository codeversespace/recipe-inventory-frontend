import { Alert, Autocomplete, Box, Button, Card, CardContent, CircularProgress, Dialog, DialogActions, DialogContent, DialogTitle, Divider, Fab, IconButton, Menu, MenuItem, Paper, Stack, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, TextField, Typography, useMediaQuery, useTheme } from "@mui/material";
import AddRoundedIcon from "@mui/icons-material/AddRounded";
import AddIcon from "@mui/icons-material/Add";
import MoreVertRoundedIcon from "@mui/icons-material/MoreVertRounded";
import { useState, useMemo } from "react";
import { useCreateProcessingOrder, useDeleteIngredient, useDeleteProcessingOrder, useEmployees, useIngredients, useProcessingOrders, useReceiveProcessing, useUpdateProcessingOrder } from "../hooks/useApi";
import { formatDate } from "../utils/formatDate";
import { formatMoney } from "../utils/formatNumber";
import { ConfirmDialog, DeleteButton, EmptyState, ErrorState, FormSection, ListItemCard, OverflowMenu, PageHeader, StatusChip, StatStrip, TableSkeleton } from "../components/ui";
import { useAuth } from "../auth/AuthContext";

export const Processing = () => {
  const { user } = useAuth();
  const isSuperAdmin = user?.role === "super_admin";
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
  const { data: allEmployees = [], isLoading: employeesLoading } = useEmployees();
  const processors = allEmployees.filter((e: any) => e.type === "processor" && e.is_active);
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));
  const [menuAnchor, setMenuAnchor] = useState<null | HTMLElement>(null);
  const [deleteTarget, setDeleteTarget] = useState<any>(null);
  const createOrder = useCreateProcessingOrder();
  const receiveProcessing = useReceiveProcessing();
  const deleteOrder = useDeleteProcessingOrder();
  const updateOrder = useUpdateProcessingOrder();
  const deleteIngredient = useDeleteIngredient();

  const [createOpen, setCreateOpen] = useState(false);
  const [detailId, setDetailId] = useState<number | null>(null);
  const [receiveOpen, setReceiveOpen] = useState<number | null>(null);
  const [processorOpen, setProcessorOpen] = useState(false);
  const [editOpen, setEditOpen] = useState<number | null>(null);
  const [editRawId, setEditRawId] = useState(0);
  const [editProcessorId, setEditProcessorId] = useState(0);
  const [editQtySent, setEditQtySent] = useState("");
  const [editCostPerKg, setEditCostPerKg] = useState("");
  const [editNotes, setEditNotes] = useState("");

  const [rawId, setRawId] = useState(0);
  const [selectedProcessorId, setSelectedProcessorId] = useState(0);
  const [qtySent, setQtySent] = useState("");
  const [costPerKg, setCostPerKg] = useState("");
  const [notes, setNotes] = useState("");

  const [qtyReceived, setQtyReceived] = useState("");

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

  const handleDelete = (orderId: number) =>
    deleteOrder.mutateAsync(orderId).then(
      () => setSuccess("Order deleted. Stock restored."),
      (e: any) => setError(e.response?.data?.detail || "Could not delete."),
    );

  const handleEdit = async () => {
    if (!editOpen || !editRawId || !editProcessorId || !Number(editQtySent) || Number(editQtySent) <= 0 || !Number(editCostPerKg) || Number(editCostPerKg) < 0) {
      setError("Fill all fields with valid values."); return;
    }
    const raw = ingredients.find((i: any) => i.id === editRawId);
    if (raw && Number(editQtySent) > (raw.on_hand_qty || 0)) {
      setError(`Insufficient stock. Available: ${raw.on_hand_qty} ${raw.base_unit}`); return;
    }
    try {
      await updateOrder.mutateAsync({
        orderId: editOpen,
        raw_ingredient_id: editRawId,
        processor_id: editProcessorId,
        quantity_sent: Number(editQtySent),
        cost_per_expected_kg: Number(editCostPerKg),
        notes: editNotes || undefined,
      });
      setEditOpen(null); setSuccess("Order updated. Stock recalculated.");
    } catch (e: any) { setError(e.response?.data?.detail || "Could not update order."); }
  };

  const pending = orders.filter((o: any) => o.status === "PENDING");
  const totalSent = orders.reduce((s: number, o: any) => s + o.quantity_sent, 0);
  const totalReceived = orders.reduce((s: number, o: any) => s + (o.quantity_received || 0), 0);
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
        <MenuItem onClick={() => { setMenuAnchor(null); window.location.href = "/employees"; }}>Manage employees</MenuItem>
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
      <Box sx={{ mb: 2 }}>
        <StatStrip stats={[
          { label: "Orders", value: isLoading ? <CircularProgress size={16} /> : orders.length },
          { label: "Pending", value: isLoading ? <CircularProgress size={16} /> : pending.length, color: "warning.main" },
          { label: "Sent (kg)", value: isLoading ? <CircularProgress size={16} /> : totalSent.toFixed(0) },
          { label: "Received (kg)", value: isLoading ? <CircularProgress size={16} /> : totalReceived.toFixed(0), color: "success.main" },
        ]} />
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
              <TableCell sx={headerSx}>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {isLoading ? (
              <TableSkeleton rows={5} colSpan={8} />
            ) : ordersError ? (
              <TableRow><TableCell colSpan={8} align="center"><ErrorState message={(ordersError as any).message} onRetry={() => refetchOrders()} /></TableCell></TableRow>
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
                    {order.status === "COMPLETED" && isSuperAdmin && (
                      <>
                        <Button size="small" onClick={() => { setEditOpen(order.id); setEditRawId(order.raw_ingredient_id); setEditProcessorId(order.processor_id); setEditQtySent(String(order.quantity_sent)); setEditCostPerKg(String(order.cost_per_expected_kg)); setEditNotes(order.notes || ""); }}>Edit</Button>
                        <DeleteButton
                          label="Delete"
                          itemName={`completed processing order ${order.id}`}
                          confirmMessage="Super admin: Delete this completed order? Processed stock will be reversed, downstream batches deleted. This cannot be undone."
                          onDelete={() => handleDelete(order.id)}
                        />
                      </>
                    )}
                  </Box>
                </TableCell>
              </TableRow>
            )) : (
              <TableRow><TableCell colSpan={8} align="center" sx={{ py: 3 }}><EmptyState title="No processing orders found." message="Create an order to send raw material for processing." actionLabel="New Order" onAction={() => { resetCreate(); setCreateOpen(true); }} /></TableCell></TableRow>
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
              <ListItemCard
                key={order.id}
                title={order.processor_name}
                subtitle={`#${order.id} · ${order.raw_ingredient_name} · ${formatDate(order.sent_at)}`}
                primaryValue={`${order.quantity_sent} kg`}
                status={{ kind: order.status === "COMPLETED" ? "success" : "warning", label: order.status }}
                meta={[
                  { label: "Received", value: order.quantity_received > 0 ? `${order.quantity_received} kg` : "—" },
                  { label: "Raw ingredient", value: order.raw_ingredient_name },
                ]}
                onClick={() => setDetailId(order.id)}
                actions={
                  <Box sx={{ display: "flex", gap: 1 }}>
                    {order.status === "PENDING" && (
                      <OverflowMenu
                        ariaLabel={`Order ${order.id} actions`}
                        actions={[
                          { label: "Details", onClick: () => setDetailId(order.id) },
                          { label: "Delete", danger: true, onClick: () => setDeleteTarget({ order, message: "Delete this processing order? Consumed stock will be restored. This cannot be undone." }) },
                        ]}
                      />
                    )}
                    {order.status === "COMPLETED" && isSuperAdmin && (
                      <OverflowMenu
                        ariaLabel={`Order ${order.id} actions`}
                        actions={[
                          { label: "Details", onClick: () => setDetailId(order.id) },
                          { label: "Edit", onClick: () => { setEditOpen(order.id); setEditRawId(order.raw_ingredient_id); setEditProcessorId(order.processor_id); setEditQtySent(String(order.quantity_sent)); setEditCostPerKg(String(order.cost_per_expected_kg)); setEditNotes(order.notes || ""); } },
                          { label: "Delete", danger: true, onClick: () => setDeleteTarget({ order, message: "Super admin: Delete this completed order? Processed stock will be reversed, downstream batches deleted. This cannot be undone." }) },
                        ]}
                      />
                    )}
                  </Box>
                }
              />
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
            loading={employeesLoading}
            disabled={employeesLoading}
            renderInput={(params) => <TextField {...params} margin="dense" label={employeesLoading ? "Loading employees..." : "Processor/Vendor"} />}
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
              </Box>

              {detailOrder.notes && <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>Notes: {detailOrder.notes}</Typography>}
            </>
          )}
        </DialogContent>
        <DialogActions sx={{ justifyContent: "space-between", flexWrap: "wrap", gap: 1 }}>
          <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap" }}>
            {detailOrder?.status === "PENDING" && <Button size="small" variant="outlined" color="success" sx={{ minHeight: 44 }} onClick={() => { setReceiveOpen(detailOrder.id); setDetailId(null); }}>Mark received</Button>}
            {detailOrder?.status === "COMPLETED" && isSuperAdmin && (
              <Button size="small" variant="outlined" sx={{ minHeight: 44 }} onClick={() => { setEditOpen(detailOrder.id); setEditRawId(detailOrder.raw_ingredient_id); setEditProcessorId(detailOrder.processor_id); setEditQtySent(String(detailOrder.quantity_sent)); setEditCostPerKg(String(detailOrder.cost_per_expected_kg)); setEditNotes(detailOrder.notes || ""); setDetailId(null); }}>
                Edit
              </Button>
            )}
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

      {/* Processor Manager Dialog — redirects to Employees page */}
      <Dialog open={processorOpen} onClose={() => setProcessorOpen(false)} fullScreen={isMobile} maxWidth="xs" fullWidth>
        <DialogTitle sx={{ fontWeight: 700 }}>Manage Processors/Vendors</DialogTitle>
        <DialogContent>
          <Alert severity="info" sx={{ mb: 1 }}>Processor/vendor management has moved to the Employees page.</Alert>
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
          <Button variant="contained" onClick={() => { window.location.href = "/employees"; }}>Go to Employees</Button>
        </DialogActions>
      </Dialog>

      {/* Edit Dialog (super_admin only) */}
      <Dialog open={!!editOpen} onClose={() => setEditOpen(null)} fullScreen={isMobile} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ fontWeight: 700 }}>
          Edit Processing Order #{editOpen}
        </DialogTitle>
        <DialogContent sx={{ pb: 1 }}>
          {error && <Alert severity="error" sx={{ mt: 1 }} onClose={() => setError("")}>{error}</Alert>}
          <Alert severity="warning" sx={{ mt: 1 }}>
            Editing a completed order will recalculate raw stock, processed ingredient cost, and downstream batch costs. Batches that have already been packed or sold cannot be recalculated. Changing the raw ingredient on a completed order is not allowed.
          </Alert>
          <FormSection title="Processor & Ingredient">
          <Autocomplete
            options={processors}
            getOptionLabel={(p: any) => p.name}
            value={processors.find((p: any) => p.id === editProcessorId) || null}
            onChange={(_, v) => setEditProcessorId(v?.id || 0)}
            renderInput={(params) => <TextField {...params} margin="dense" label="Processor" />}
          />
          <Autocomplete
            options={ingredients}
            getOptionLabel={(i: any) => `${i.name} (${i.on_hand_qty || 0} ${i.base_unit})`}
            value={ingredients.find((i: any) => i.id === editRawId) || null}
            onChange={(_, v) => setEditRawId(v?.id || 0)}
            renderInput={(params) => <TextField {...params} margin="dense" label="Raw ingredient" />}
          />
          </FormSection>
          <FormSection title="Quantity & Cost">
            <TextField margin="dense" label="Quantity sent (kg)" type="number" slotProps={{ htmlInput: { inputMode: "decimal", min: 0 } }} fullWidth value={editQtySent} onChange={(e) => setEditQtySent(e.target.value)} />
            <TextField margin="dense" label="Cost per kg (₹)" type="number" slotProps={{ htmlInput: { inputMode: "decimal", min: 0 } }} fullWidth value={editCostPerKg} onChange={(e) => setEditCostPerKg(e.target.value)} />
            <TextField margin="dense" label="Notes" fullWidth multiline rows={2} value={editNotes} onChange={(e) => setEditNotes(e.target.value)} />
          </FormSection>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditOpen(null)}>Cancel</Button>
          <Button variant="contained" onClick={handleEdit} disabled={updateOrder.isPending}>
            {updateOrder.isPending ? <CircularProgress size={20} /> : "Save"}
          </Button>
        </DialogActions>
      </Dialog>

      <ConfirmDialog
        open={!!deleteTarget}
        title={`Delete order ${deleteTarget?.order?.id ?? ""}?`}
        message={deleteTarget?.message || "This cannot be undone."}
        confirmLabel="Delete"
        danger
        pending={deleteOrder.isPending}
        onCancel={() => setDeleteTarget(null)}
        onConfirm={async () => {
          if (!deleteTarget) return;
          try {
            await handleDelete(deleteTarget.order.id);
            setDeleteTarget(null);
          } catch {
            setDeleteTarget(null);
          }
        }}
      />

      {success && <Alert severity="success" sx={{ position: "fixed", bottom: { xs: 80, sm: 16 }, right: 16, zIndex: 9999 }} onClose={() => setSuccess("")}>{success}</Alert>}
      {error && !createOpen && !receiveOpen && !detailId && !processorOpen && !editOpen && <Alert severity="error" sx={{ position: "fixed", bottom: { xs: 80, sm: 16 }, right: 16, zIndex: 9999 }} onClose={() => setError("")}>{error}</Alert>}
      <Fab
        color="primary"
        aria-label="New order"
        sx={{ position: "fixed", bottom: { xs: 80, sm: 24 }, right: 24, zIndex: 1000 }}
        onClick={() => { resetCreate(); setCreateOpen(true); }}
      >
        <AddIcon />
      </Fab>
    </Box>
  );
};
