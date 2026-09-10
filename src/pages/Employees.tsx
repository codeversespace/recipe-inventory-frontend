import { Alert, Autocomplete, Box, Button, Card, CardContent, CircularProgress, Dialog, DialogActions, DialogContent, DialogTitle, Paper, Stack, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, TextField, Typography, useMediaQuery, useTheme } from "@mui/material";
import AddRoundedIcon from "@mui/icons-material/AddRounded";
import { useState } from "react";
import { useCreateEmployee, useDeleteEmployee, useEmployeeLedger, useEmployees, usePayEmployee, useToggleEmployee, useUpdateEmployee } from "../hooks/useApi";
import { formatDate } from "../utils/formatDate";
import { formatMoney } from "../utils/formatNumber";
import { DeleteButton, EmptyState, ErrorState, PageHeader, StatusChip, TableSkeleton } from "../components/ui";

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

  const handleDelete = async (id: number) => {
    try { await deleteEmp.mutateAsync(id); setSuccess("Employee deleted."); } catch (e: any) { setError(e.response?.data?.detail || "Could not delete."); }
  };

  const savePayment = async () => {
    if (!payOpen || !Number(payAmount) || Number(payAmount) <= 0) { setError("Enter a valid amount."); return; }
    try {
      await payEmp.mutateAsync({ employeeId: payOpen, amount: Number(payAmount), method: payMethod, reference: payRef || undefined, notes: payNotes || undefined });
      setPayOpen(null); setPayAmount(""); setPayRef(""); setPayNotes(""); setSuccess("Payment recorded.");
    } catch (e: any) { setError(e.response?.data?.detail || "Could not record payment."); }
  };

  const headerSx = { fontWeight: 700, fontSize: { xs: "0.7rem" as const, sm: "0.8rem" as const } };
  const cellSx = { fontSize: { xs: "0.7rem" as const, sm: "0.8rem" as const } };

  return (
    <Box>
      <PageHeader
        title="Employees"
        subtitle="Manage staff and processor/vendors, track earnings and payments"
        actions={
          <Button startIcon={<AddRoundedIcon />} variant="contained" onClick={() => { resetForm(); setFormOpen(true); }}>
            Add Employee
          </Button>
        }
      />

      {success && <Alert severity="success" sx={{ mb: 2 }} onClose={() => setSuccess("")}>{success}</Alert>}
      {error && !formOpen && !payOpen && !detailId && <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError("")}>{error}</Alert>}

      {/* Desktop Table */}
      <Box sx={{ display: { xs: "none", sm: "block" } }}>
        <TableContainer component={Paper}>
          <Table size="small" sx={{ minWidth: 600 }}>
            <TableHead>
              <TableRow>
                <TableCell sx={headerSx}>Name</TableCell>
                <TableCell sx={headerSx}>Type</TableCell>
                <TableCell sx={headerSx}>Phone</TableCell>
                <TableCell sx={{ ...headerSx, display: { xs: "none", md: "table-cell" } }}>Status</TableCell>
                <TableCell sx={headerSx}>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {isLoading ? (
                <TableSkeleton rows={5} colSpan={5} />
              ) : employeesError ? (
                <TableRow><TableCell colSpan={5} align="center"><ErrorState message={(employeesError as any).message} onRetry={() => refetch()} /></TableCell></TableRow>
              ) : employees.length ? employees.map((emp: any) => (
                <TableRow key={emp.id} hover>
                  <TableCell sx={{ ...cellSx, fontWeight: 600 }}>{emp.name}</TableCell>
                  <TableCell sx={cellSx}><StatusChip status={emp.type === "processor" ? "info" : "success"} label={emp.type} /></TableCell>
                  <TableCell sx={cellSx}>{emp.phone || "—"}</TableCell>
                  <TableCell sx={{ ...cellSx, display: { xs: "none", md: "table-cell" } }}><StatusChip status={emp.is_active ? "success" : "error"} label={emp.is_active ? "Active" : "Inactive"} /></TableCell>
                  <TableCell>
                    <Box sx={{ display: "flex", gap: 0.5 }}>
                      <Button size="small" onClick={() => setDetailId(emp.id)}>Ledger</Button>
                      <Button size="small" onClick={() => { setEditId(emp.id); setName(emp.name); setPhone(emp.phone || ""); setAddress(emp.address || ""); setType(emp.type); setFormOpen(true); }}>Edit</Button>
                      <Button size="small" color={emp.is_active ? "warning" : "success"} onClick={() => handleToggle(emp)}>{emp.is_active ? "Deactivate" : "Activate"}</Button>
                      <DeleteButton label="Delete" itemName={emp.name} confirmMessage={`Delete "${emp.name}"?`} onDelete={() => handleDelete(emp.id)} />
                    </Box>
                  </TableCell>
                </TableRow>
              )) : (
                <TableRow><TableCell colSpan={5} align="center" sx={{ py: 3 }}><EmptyState title="No employees found." message="Add employees or processors/vendors." actionLabel="Add Employee" onAction={() => { resetForm(); setFormOpen(true); }} /></TableCell></TableRow>
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
                    <Box>
                      <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>{emp.name}</Typography>
                      <Typography variant="caption" color="text.secondary">{emp.phone || "No phone"} · {emp.type}</Typography>
                    </Box>
                    <StatusChip status={emp.is_active ? "success" : "error"} label={emp.is_active ? "Active" : "Inactive"} />
                  </Box>
                  <Box sx={{ display: "flex", gap: 1, mt: 1.5, flexWrap: "wrap" }}>
                    <Button size="small" variant="outlined" onClick={() => setDetailId(emp.id)} sx={{ flex: 1, minHeight: 44 }}>Ledger</Button>
                    <Button size="small" variant="outlined" onClick={() => { setEditId(emp.id); setName(emp.name); setPhone(emp.phone || ""); setAddress(emp.address || ""); setType(emp.type); setFormOpen(true); }} sx={{ flex: 1, minHeight: 44 }}>Edit</Button>
                    <DeleteButton fullWidth label="Delete" itemName={emp.name} confirmMessage={`Delete "${emp.name}"?`} onDelete={() => handleDelete(emp.id)} />
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
        <DialogTitle sx={{ fontWeight: 700 }}>
          {ledger ? `${ledger.employee.name} — Ledger` : "Employee Ledger"}
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
                </CardContent></Card>
                <Card sx={{ bgcolor: "info.50" }}><CardContent sx={{ p: 1, "&:last-child": { pb: 1 } }}>
                  <Typography variant="caption" color="text.secondary">Total Paid</Typography>
                  <Typography variant="h6" sx={{ fontWeight: 700, fontSize: "1.1rem", color: "info.main" }}>{formatMoney(ledger.total_paid)}</Typography>
                </CardContent></Card>
                <Card sx={{ bgcolor: ledger.balance_due > 0 ? "error.50" : "success.50" }}><CardContent sx={{ p: 1, "&:last-child": { pb: 1 } }}>
                  <Typography variant="caption" color="text.secondary">Balance Due</Typography>
                  <Typography variant="h6" sx={{ fontWeight: 700, fontSize: "1.1rem", color: ledger.balance_due > 0 ? "error.main" : "success.main" }}>{formatMoney(ledger.balance_due)}</Typography>
                </CardContent></Card>
              </Box>

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

              {/* Payments Table */}
              <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 1 }}>
                <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>Payments</Typography>
                {ledger.balance_due > 0 && (
                  <Button size="small" variant="contained" onClick={() => { setPayOpen(ledger.employee.id); setDetailId(null); }}>Record Payment</Button>
                )}
              </Box>
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
        <DialogTitle sx={{ fontWeight: 700 }}>Record Payment</DialogTitle>
        <DialogContent>
          {error && <Alert severity="error" sx={{ mt: 1 }} onClose={() => setError("")}>{error}</Alert>}
          <TextField margin="dense" label="Amount (₹)" type="number" slotProps={{ htmlInput: { inputMode: "decimal", min: 0 } }} fullWidth value={payAmount} onChange={(e) => setPayAmount(e.target.value)} />
          <TextField margin="dense" label="Method" fullWidth value={payMethod} onChange={(e) => setPayMethod(e.target.value)} helperText="CASH, UPI, Bank transfer, etc." />
          <TextField margin="dense" label="Reference" fullWidth value={payRef} onChange={(e) => setPayRef(e.target.value)} />
          <TextField margin="dense" label="Notes" fullWidth multiline rows={2} value={payNotes} onChange={(e) => setPayNotes(e.target.value)} />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setPayOpen(null)}>Cancel</Button>
          <Button variant="contained" onClick={savePayment} disabled={payEmp.isPending}>
            {payEmp.isPending ? <CircularProgress size={20} /> : "Pay"}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};
