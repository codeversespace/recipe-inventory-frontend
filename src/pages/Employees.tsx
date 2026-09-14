import { Alert, Autocomplete, Box, Button, Card, CardContent, CircularProgress, Dialog, DialogActions, DialogContent, DialogTitle, Divider, Paper, Stack, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, TextField, Typography, useMediaQuery, useTheme } from "@mui/material";
import AddRoundedIcon from "@mui/icons-material/AddRounded";
import { useState } from "react";
import { useCreateEmployee, useDeleteEmployee, useEmployeeLedger, useEmployees, usePayEmployee, useToggleEmployee, useUpdateEmployee } from "../hooks/useApi";
import { formatDate } from "../utils/formatDate";
import { formatMoney } from "../utils/formatNumber";
import { ConfirmDialog, EmptyState, ErrorState, OverflowMenu, PageHeader, StatusChip, TableSkeleton } from "../components/ui";

export const Employees = () => {
  const { data: employees = [], isLoading, error: employeesError, refetch } = useEmployees();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));

  const createEmp = useCreateEmployee();
  const updateEmp = useUpdateEmployee();
  const toggleEmp = useToggleEmployee();
  const deleteEmp = useDeleteEmployee();
  const payEmp = usePayEmployee();

  const [formOpen, setFormOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<any>(null);
  const [editId, setEditId] = useState<number | null>(null);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [type, setType] = useState("internal");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [detailId, setDetailId] = useState<number | null>(null);
  const { data: ledger, isLoading: ledgerLoading } = useEmployeeLedger(detailId);
  const [payOpen, setPayOpen] = useState<number | null>(null);
  const [payAmount, setPayAmount] = useState("");
  const [payMethod, setPayMethod] = useState("CASH");
  const [payRef, setPayRef] = useState("");
  const [payNotes, setPayNotes] = useState("");

  const resetForm = () => { setEditId(null); setName(""); setPhone(""); setAddress(""); setType("internal"); setError(""); };

  const saveEmployee = async () => {
    if (!name.trim()) { setError("Name required."); return; }
    try {
      if (editId) {
        await updateEmp.mutateAsync({ id: editId, name: name.trim(), phone: phone || undefined, address: address || undefined, type });
        setSuccess("Employee updated.");
      } else {
        await createEmp.mutateAsync({ name: name.trim(), phone: phone || undefined, address: address || undefined, type });
        setSuccess("Employee created.");
      }
      setFormOpen(false); resetForm();
    } catch (e: any) { setError(e.response?.data?.detail || "Could not save."); }
  };

  const handleToggle = async (emp: any) => {
    try { await toggleEmp.mutateAsync(emp.id); setSuccess(emp.is_active ? "Deactivated." : "Activated."); } catch (e: any) { setError(e.response?.data?.detail || "Could not toggle."); }
  };

  const savePayment = async () => {
    if (!payOpen || !Number(payAmount) || Number(payAmount) <= 0) { setError("Enter a valid amount."); return; }
    try {
      await payEmp.mutateAsync({ employeeId: payOpen, amount: Number(payAmount), method: payMethod, reference: payRef || undefined, notes: payNotes || undefined });
      setPayOpen(null); setPayAmount(""); setPayRef(""); setPayNotes(""); setSuccess("Payment recorded.");
    } catch (e: any) { setError(e.response?.data?.detail || "Could not record payment."); }
  };

  const totalEarned = employees.reduce((s: number, e: any) => s + (e.total_earned || 0), 0);
  const totalPaid = employees.reduce((s: number, e: any) => s + (e.total_paid || 0), 0);
  const totalDue = employees.reduce((s: number, e: any) => s + (e.balance_due || 0), 0);
  const totalPaidThisMonth = employees.reduce((s: number, e: any) => s + (e.paid_this_month || 0), 0);

  const headerSx = { fontWeight: 700, fontSize: { xs: "0.7rem" as const, sm: "0.8rem" as const } };
  const cellSx = { fontSize: { xs: "0.7rem" as const, sm: "0.8rem" as const } };

  return (
    <Box>
      <PageHeader
        title="Employees"
        subtitle="Manage staff and processors/vendors, track earnings and payments"
        actions={
          <Button startIcon={<AddRoundedIcon />} variant="contained" onClick={() => { resetForm(); setFormOpen(true); }}>
            Add Employee
          </Button>
        }
      />

      {success && <Alert severity="success" sx={{ mb: 2 }} onClose={() => setSuccess("")}>{success}</Alert>}
      {error && !formOpen && !payOpen && !detailId && <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError("")}>{error}</Alert>}

      {/* Summary Cards */}
      {!isLoading && employees.length > 0 && (
        <Box sx={{ display: "grid", gridTemplateColumns: { xs: "repeat(2, 1fr)", sm: "repeat(4, 1fr)" }, gap: { xs: 1, sm: 1.5 }, mb: 2 }}>
          <Card sx={{ bgcolor: "grey.50" }}><CardContent sx={{ p: 1, "&:last-child": { pb: 1 } }}><Typography variant="caption" sx={{ fontSize: "0.75rem", color: "text.secondary" }}>Total Earned</Typography><Typography variant="h6" sx={{ fontWeight: 700, fontSize: "1.1rem" }}>{formatMoney(totalEarned)}</Typography></CardContent></Card>
          <Card sx={{ bgcolor: "success.50" }}><CardContent sx={{ p: 1, "&:last-child": { pb: 1 } }}><Typography variant="caption" sx={{ fontSize: "0.75rem", color: "text.secondary" }}>Total Paid</Typography><Typography variant="h6" sx={{ fontWeight: 700, fontSize: "1.1rem", color: "success.main" }}>{formatMoney(totalPaid)}</Typography></CardContent></Card>
          <Card sx={{ bgcolor: "info.50" }}><CardContent sx={{ p: 1, "&:last-child": { pb: 1 } }}><Typography variant="caption" sx={{ fontSize: "0.75rem", color: "text.secondary" }}>Paid This Month</Typography><Typography variant="h6" sx={{ fontWeight: 700, fontSize: "1.1rem", color: "info.main" }}>{formatMoney(totalPaidThisMonth)}</Typography></CardContent></Card>
          <Card sx={{ bgcolor: totalDue > 0 ? "error.50" : "grey.50" }}><CardContent sx={{ p: 1, "&:last-child": { pb: 1 } }}><Typography variant="caption" sx={{ fontSize: "0.75rem", color: "text.secondary" }}>Total Due</Typography><Typography variant="h6" sx={{ fontWeight: 700, fontSize: "1.1rem", color: totalDue > 0 ? "error.main" : "success.main" }}>{formatMoney(totalDue)}</Typography></CardContent></Card>
        </Box>
      )}

      {/* Desktop Table */}
      <Box sx={{ display: { xs: "none", sm: "block" } }}>
        <TableContainer component={Paper}>
          <Table size="small" sx={{ minWidth: 900 }}>
            <TableHead>
              <TableRow>
                <TableCell sx={headerSx}>Name</TableCell>
                <TableCell sx={headerSx}>Type</TableCell>
                <TableCell sx={headerSx}>Phone</TableCell>
                <TableCell sx={{ ...headerSx, display: { md: "table-cell" } }}>Earned</TableCell>
                <TableCell sx={{ ...headerSx, display: { md: "table-cell" } }}>Paid</TableCell>
                <TableCell sx={{ ...headerSx, display: { lg: "table-cell" } }}>This Month</TableCell>
                <TableCell sx={headerSx}>Due</TableCell>
                <TableCell sx={headerSx}>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {isLoading ? (
                <TableSkeleton rows={5} colSpan={8} />
              ) : employeesError ? (
                <TableRow><TableCell colSpan={8} align="center"><ErrorState message={(employeesError as any).message} onRetry={() => refetch()} /></TableCell></TableRow>
              ) : employees.length ? employees.map((emp: any) => (
                <TableRow key={emp.id} hover>
                  <TableCell sx={{ ...cellSx, fontWeight: 600 }}>{emp.name}</TableCell>
                  <TableCell sx={cellSx}><StatusChip status={emp.type === "processor" ? "info" : "success"} label={emp.type} /></TableCell>
                  <TableCell sx={cellSx}>{emp.phone || "—"}</TableCell>
                  <TableCell sx={{ ...cellSx, display: { md: "table-cell" } }} className="tnum">{formatMoney(emp.total_earned || 0)}</TableCell>
                  <TableCell sx={{ ...cellSx, display: { md: "table-cell" } }} className="tnum">{formatMoney(emp.total_paid || 0)}</TableCell>
                  <TableCell sx={{ ...cellSx, display: { lg: "table-cell" } }} className="tnum">{formatMoney(emp.paid_this_month || 0)}</TableCell>
                  <TableCell sx={{ ...cellSx, fontWeight: 700, color: (emp.balance_due || 0) > 0 ? "error.main" : "success.main" }} className="tnum">{formatMoney(emp.balance_due || 0)}</TableCell>
                  <TableCell>
                    <Box sx={{ display: "flex", gap: 0.5 }}>
                      <Button size="small" variant="outlined" onClick={() => setDetailId(emp.id)}>Ledger</Button>
                      {(emp.balance_due || 0) > 0 && (
                        <Button size="small" variant="contained" color="success" onClick={() => { setPayOpen(emp.id); setPayAmount(""); setPayRef(""); setPayNotes(""); }}>Pay</Button>
                      )}
                      <OverflowMenu
                        ariaLabel={`${emp.name} more actions`}
                        actions={[
                          { label: "Edit", onClick: () => { setEditId(emp.id); setName(emp.name); setPhone(emp.phone || ""); setAddress(emp.address || ""); setType(emp.type); setFormOpen(true); } },
                          { label: emp.is_active ? "Deactivate" : "Activate", onClick: () => handleToggle(emp) },
                          { label: "Delete", danger: true, onClick: () => setDeleteTarget(emp) },
                        ]}
                      />
                    </Box>
                  </TableCell>
                </TableRow>
              )) : (
                <TableRow><TableCell colSpan={8} align="center" sx={{ py: 3 }}><EmptyState title="No employees found." message="Add employees or processors/vendors." actionLabel="Add Employee" onAction={() => { resetForm(); setFormOpen(true); }} /></TableCell></TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Box>

      {/* Mobile Cards */}
      <Box sx={{ display: { xs: "block", sm: "none" } }}>
        {isLoading ? (
          <Box sx={{ display: "flex", justifyContent: "center", py: 4 }}><CircularProgress /></Box>
        ) : employeesError ? (
          <ErrorState message={(employeesError as any).message} onRetry={() => refetch()} />
        ) : employees.length ? (
          <Stack spacing={1.5}>
            {employees.map((emp: any) => (
              <Card key={emp.id} variant="outlined">
                <CardContent sx={{ p: 2, "&:last-child": { pb: 2 } }}>
                  <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                    <Box sx={{ minWidth: 0 }}>
                      <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>{emp.name}</Typography>
                      <Typography variant="caption" color="text.secondary">{emp.phone || "No phone"} · {emp.type}</Typography>
                    </Box>
                    <StatusChip status={emp.is_active ? "success" : "error"} label={emp.is_active ? "Active" : "Inactive"} />
                  </Box>

                  {/* Financial Summary Row */}
                  <Box sx={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: 0.5, mt: 1.5, p: 1, bgcolor: "grey.50", borderRadius: 1 }}>
                    <Box>
                      <Typography variant="caption" color="text.secondary" sx={{ fontSize: "0.6rem", display: "block" }}>Earned</Typography>
                      <Typography variant="caption" sx={{ fontWeight: 700, fontSize: "0.75rem" }}>{formatMoney(emp.total_earned || 0)}</Typography>
                    </Box>
                    <Box>
                      <Typography variant="caption" color="text.secondary" sx={{ fontSize: "0.6rem", display: "block" }}>Paid</Typography>
                      <Typography variant="caption" sx={{ fontWeight: 700, fontSize: "0.75rem", color: "success.main" }}>{formatMoney(emp.total_paid || 0)}</Typography>
                    </Box>
                    <Box>
                      <Typography variant="caption" color="text.secondary" sx={{ fontSize: "0.6rem", display: "block" }}>Month</Typography>
                      <Typography variant="caption" sx={{ fontWeight: 700, fontSize: "0.75rem", color: "info.main" }}>{formatMoney(emp.paid_this_month || 0)}</Typography>
                    </Box>
                    <Box>
                      <Typography variant="caption" color="text.secondary" sx={{ fontSize: "0.6rem", display: "block" }}>Due</Typography>
                      <Typography variant="caption" sx={{ fontWeight: 700, fontSize: "0.75rem", color: (emp.balance_due || 0) > 0 ? "error.main" : "success.main" }}>{formatMoney(emp.balance_due || 0)}</Typography>
                    </Box>
                  </Box>

                  <Box sx={{ display: "flex", gap: 1, mt: 1.5 }}>
                    <Button size="small" variant="outlined" onClick={() => setDetailId(emp.id)} sx={{ flex: 1 }}>Ledger</Button>
                    {(emp.balance_due || 0) > 0 && (
                      <Button size="small" variant="contained" color="success" onClick={() => { setPayOpen(emp.id); setPayAmount(""); setPayRef(""); setPayNotes(""); }} sx={{ flex: 1 }}>Pay {formatMoney(emp.balance_due)}</Button>
                    )}
                    <OverflowMenu
                      ariaLabel={`${emp.name} actions`}
                      actions={[
                        { label: "Edit", onClick: () => { setEditId(emp.id); setName(emp.name); setPhone(emp.phone || ""); setAddress(emp.address || ""); setType(emp.type); setFormOpen(true); } },
                        { label: "Delete", danger: true, onClick: () => setDeleteTarget(emp) },
                      ]}
                    />
                  </Box>
                </CardContent>
              </Card>
            ))}
          </Stack>
        ) : (
          <EmptyState title="No employees found." message="Add employees or processors/vendors." actionLabel="Add Employee" onAction={() => { resetForm(); setFormOpen(true); }} />
        )}
      </Box>

      {/* Add/Edit Dialog */}
      <Dialog open={formOpen} onClose={() => setFormOpen(false)} fullScreen={isMobile} maxWidth="xs" fullWidth>
        <DialogTitle sx={{ fontWeight: 700 }}>{editId ? "Edit Employee" : "Add Employee"}</DialogTitle>
        <DialogContent>
          {error && <Alert severity="error" sx={{ mt: 1 }} onClose={() => setError("")}>{error}</Alert>}
          <TextField margin="dense" label="Name" fullWidth value={name} onChange={(e) => setName(e.target.value)} />
          <TextField margin="dense" label="Phone" fullWidth value={phone} onChange={(e) => setPhone(e.target.value)} />
          <TextField margin="dense" label="Address" fullWidth multiline rows={2} value={address} onChange={(e) => setAddress(e.target.value)} />
          <Autocomplete
            options={[{ value: "internal", label: "Internal (production/packing)" }, { value: "processor", label: "Processor/Vendor" }]}
            getOptionLabel={(o) => o.label}
            value={type === "processor" ? { value: "processor", label: "Processor/Vendor" } : { value: "internal", label: "Internal (production/packing)" }}
            onChange={(_, v) => setType(v?.value || "internal")}
            renderInput={(params) => <TextField {...params} margin="dense" label="Type" />}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setFormOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={saveEmployee} disabled={createEmp.isPending || updateEmp.isPending}>
            {(createEmp.isPending || updateEmp.isPending) ? <CircularProgress size={20} /> : "Save"}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Ledger Detail Dialog */}
      <Dialog open={!!detailId} onClose={() => setDetailId(null)} fullScreen={isMobile} maxWidth="md" fullWidth>
        <DialogTitle sx={{ fontWeight: 700, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <span>{ledger ? `${ledger.employee.name} — Ledger` : "Employee Ledger"}</span>
          {ledger && ledger.balance_due > 0 && (
            <Button size="small" variant="contained" color="success" onClick={() => { setPayOpen(ledger.employee.id); setDetailId(null); }} sx={{ ml: 2 }}>
              Pay {formatMoney(ledger.balance_due)}
            </Button>
          )}
        </DialogTitle>
        <DialogContent sx={{ pb: 1 }}>
          {ledgerLoading ? (
            <Box sx={{ display: "flex", justifyContent: "center", py: 4 }}><CircularProgress /></Box>
          ) : ledger ? (
            <>
              {/* Summary Cards */}
              <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr 1fr", sm: "1fr 1fr 1fr" }, gap: 1, mb: 2 }}>
                <Card sx={{ bgcolor: "success.50" }}><CardContent sx={{ p: 1, "&:last-child": { pb: 1 } }}>
                  <Typography variant="caption" color="text.secondary">Total Earned</Typography>
                  <Typography variant="h6" sx={{ fontWeight: 700, fontSize: "1.1rem", color: "success.main" }}>{formatMoney(ledger.total_earned)}</Typography>
                  <Typography variant="caption" color="text.secondary" sx={{ fontSize: "0.65rem" }}>{ledger.earnings.length} earning(s)</Typography>
                </CardContent></Card>
                <Card sx={{ bgcolor: "info.50" }}><CardContent sx={{ p: 1, "&:last-child": { pb: 1 } }}>
                  <Typography variant="caption" color="text.secondary">Total Paid</Typography>
                  <Typography variant="h6" sx={{ fontWeight: 700, fontSize: "1.1rem", color: "info.main" }}>{formatMoney(ledger.total_paid)}</Typography>
                  <Typography variant="caption" color="text.secondary" sx={{ fontSize: "0.65rem" }}>{ledger.payments.length} payment(s)</Typography>
                </CardContent></Card>
                <Card sx={{ bgcolor: ledger.balance_due > 0 ? "error.50" : "success.50" }}><CardContent sx={{ p: 1, "&:last-child": { pb: 1 } }}>
                  <Typography variant="caption" color="text.secondary">Balance Due</Typography>
                  <Typography variant="h6" sx={{ fontWeight: 700, fontSize: "1.1rem", color: ledger.balance_due > 0 ? "error.main" : "success.main" }}>{formatMoney(ledger.balance_due)}</Typography>
                  {ledger.balance_due > 0 && <Typography variant="caption" color="error.main" sx={{ fontSize: "0.65rem" }}>Outstanding</Typography>}
                </CardContent></Card>
              </Box>

              <Divider sx={{ my: 1.5 }} />

              {/* Earnings Table */}
              <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1 }}>Earnings</Typography>
              {ledger.earnings.length ? (
                <TableContainer component={Paper} sx={{ mb: 2, overflowX: "auto" }}>
                  <Table size="small" sx={{ minWidth: 400 }}>
                    <TableHead><TableRow><TableCell sx={{ fontWeight: 700, fontSize: "0.75rem" }}>Date</TableCell><TableCell sx={{ fontWeight: 700, fontSize: "0.75rem" }}>Source</TableCell><TableCell sx={{ fontWeight: 700, fontSize: "0.75rem" }}>Description</TableCell><TableCell sx={{ fontWeight: 700, fontSize: "0.75rem" }}>Amount</TableCell></TableRow></TableHead>
                    <TableBody>{ledger.earnings.map((e: any, i: number) => (
                      <TableRow key={i}>
                        <TableCell sx={{ fontSize: "0.8rem" }}>{formatDate(e.date)}</TableCell>
                        <TableCell sx={{ fontSize: "0.8rem" }}><StatusChip status={e.source === "production" ? "warning" : e.source === "packing" ? "info" : "success"} label={e.source} /></TableCell>
                        <TableCell sx={{ fontSize: "0.8rem" }}>{e.description}</TableCell>
                        <TableCell sx={{ fontSize: "0.8rem", fontWeight: 700 }}>{formatMoney(e.amount)}</TableCell>
                      </TableRow>
                    ))}</TableBody>
                  </Table>
                </TableContainer>
              ) : <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>No earnings recorded yet.</Typography>}

              <Divider sx={{ my: 1.5 }} />

              {/* Payments Table */}
              <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1 }}>Payments</Typography>
              {ledger.payments.length ? (
                <TableContainer component={Paper} sx={{ overflowX: "auto" }}>
                  <Table size="small" sx={{ minWidth: 360 }}>
                    <TableHead><TableRow><TableCell sx={{ fontWeight: 700, fontSize: "0.75rem" }}>Date</TableCell><TableCell sx={{ fontWeight: 700, fontSize: "0.75rem" }}>Amount</TableCell><TableCell sx={{ fontWeight: 700, fontSize: "0.75rem" }}>Method</TableCell><TableCell sx={{ fontWeight: 700, fontSize: "0.75rem" }}>Reference</TableCell></TableRow></TableHead>
                    <TableBody>{ledger.payments.map((p: any) => (
                      <TableRow key={p.id}>
                        <TableCell sx={{ fontSize: "0.8rem" }}>{formatDate(p.paid_at)}</TableCell>
                        <TableCell sx={{ fontSize: "0.8rem", fontWeight: 700 }}>{formatMoney(p.amount)}</TableCell>
                        <TableCell sx={{ fontSize: "0.8rem" }}>{p.method}</TableCell>
                        <TableCell sx={{ fontSize: "0.8rem" }}>{p.reference || "—"}</TableCell>
                      </TableRow>
                    ))}</TableBody>
                  </Table>
                </TableContainer>
              ) : <Typography variant="body2" color="text.secondary">No payments recorded yet.</Typography>}
            </>
          ) : null}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDetailId(null)}>Close</Button>
        </DialogActions>
      </Dialog>

      {/* Payment Dialog */}
      <Dialog open={!!payOpen} onClose={() => setPayOpen(null)} fullScreen={isMobile} maxWidth="xs" fullWidth>
        <DialogTitle sx={{ fontWeight: 700 }}>
          Pay {employees.find((e: any) => e.id === payOpen)?.name || "Employee"}
        </DialogTitle>
        <DialogContent>
          {error && <Alert severity="error" sx={{ mt: 1 }} onClose={() => setError("")}>{error}</Alert>}
          {(() => {
            const emp = employees.find((e: any) => e.id === payOpen);
            if (emp && (emp.balance_due || 0) > 0) {
              return (
                <Alert severity="info" sx={{ mt: 1, fontSize: "0.8rem" }}>
                  Balance due: {formatMoney(emp.balance_due)}. This payment will be recorded against their ledger.
                </Alert>
              );
            }
            return null;
          })()}
          <TextField margin="dense" label="Amount (₹)" type="number" slotProps={{ htmlInput: { inputMode: "decimal", min: 0 } }} fullWidth value={payAmount} onChange={(e) => setPayAmount(e.target.value)} />
          <TextField margin="dense" label="Method" fullWidth value={payMethod} onChange={(e) => setPayMethod(e.target.value)} helperText="CASH, UPI, Bank transfer, etc." />
          <TextField margin="dense" label="Reference" fullWidth value={payRef} onChange={(e) => setPayRef(e.target.value)} />
          <TextField margin="dense" label="Notes" fullWidth multiline rows={2} value={payNotes} onChange={(e) => setPayNotes(e.target.value)} />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setPayOpen(null)}>Cancel</Button>
          <Button variant="contained" color="success" onClick={savePayment} disabled={payEmp.isPending}>
            {payEmp.isPending ? <CircularProgress size={20} /> : "Record Payment"}
          </Button>
        </DialogActions>
      </Dialog>
      <ConfirmDialog
        open={!!deleteTarget}
        title={`Delete "${deleteTarget?.name ?? ""}"?`}
        message="This employee will be permanently removed. This action cannot be undone."
        confirmLabel="Delete"
        danger
        pending={deleteEmp.isPending}
        onCancel={() => setDeleteTarget(null)}
        onConfirm={async () => {
          if (!deleteTarget) return;
          try {
            await deleteEmp.mutateAsync(deleteTarget.id);
            setSuccess("Employee deleted.");
            setDeleteTarget(null);
          } catch (e: any) {
            setError(e.response?.data?.detail || "Could not delete employee.");
            setDeleteTarget(null);
          }
        }}
      />
    </Box>
  );
};
