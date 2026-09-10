import { Alert, Autocomplete, Box, Button, Card, CardContent, CircularProgress, Dialog, DialogActions, DialogContent, DialogTitle, FormControl, InputLabel, MenuItem, Paper, Select, Stack, Table, TableBody, TableCell, TableContainer, TableHead, TablePagination, TableRow, TextField, Typography } from "@mui/material";
import { useMemo, useState } from "react";
import { useEmployees, usePackBatch, usePackTypes, useReadyToPack } from "../hooks/useApi";
import { VoiceInput } from "../components/VoiceInput";
import { EmptyState, PageHeader, StatusChip } from "../components/ui";

export const Packing = () => {
  const { data: batches = [], isLoading } = useReadyToPack();
  const { data: packTypes = [], isLoading: packTypesLoading } = usePackTypes();
  const { data: allEmployees = [] } = useEmployees();
  const employees = allEmployees.filter((e: any) => e.is_active);
  const pack = usePackBatch();
  const [selected, setSelected] = useState<any>(null);
  const [packTypeId, setPackTypeId] = useState(0);
  const [count, setCount] = useState("");
  const [employeeId, setEmployeeId] = useState<number | null>(null);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const filteredBatches = useMemo(() => batches.filter((batch: any) => `${batch.id} ${batch.recipe_name}`.toLowerCase().includes(search.toLowerCase()) && (statusFilter === "ALL" || batch.status === statusFilter)), [batches, search, statusFilter]);
  const visibleBatches = filteredBatches.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage);
  const selectedType = packTypes.find((item: any) => item.id === packTypeId);
  const submit = async () => {
    const packCount = Number(count);
    if (!selected || !packTypeId || !Number.isInteger(packCount) || packCount <= 0) { setError("Select a pack type and enter a whole-number box count."); return; }
    try {
      await pack.mutateAsync({ batch_id: selected.id, pack_type_id: packTypeId, pack_count: packCount, employee_id: employeeId || undefined });
      setSelected(null); setCount(""); setEmployeeId(null); setPackTypeId(0); setError("");
    } catch (requestError: any) { setError(requestError.response?.data?.detail || "Could not record packing."); }
  };
  return <Box>
    <PageHeader
      title="Packing queue"
      subtitle="Search and pack prepared batches. Packed quantity becomes ready to ship."
      actions={
        <VoiceInput onResult={(json) => {
          try {
            const parsed = JSON.parse(json);
            const item = parsed.items?.[0] || parsed;
            if (item.count) setCount(String(item.count));
            if (!selected && batches.length) setSelected(batches[0]);
            setError("");
          } catch { /* ignore */ }
        }} label="Quick voice packing" variant="packing" />
      }
    />
    {isLoading ? <CircularProgress /> : <Card><CardContent sx={{ p: { xs: 1.5, sm: 2.5 } }}>
      <Box sx={{ display: "flex", gap: 1.5, flexWrap: "wrap", mb: 2 }}><TextField size="small" label="Search batch or product" value={search} onChange={(event) => { setSearch(event.target.value); setPage(0); }} sx={{ flex: "1 1 240px" }} /><FormControl size="small" sx={{ minWidth: 170 }}><InputLabel>Status</InputLabel><Select value={statusFilter} label="Status" onChange={(event) => { setStatusFilter(event.target.value); setPage(0); }}><MenuItem value="ALL">All statuses</MenuItem><MenuItem value="READY_TO_PACK">Ready to pack</MenuItem><MenuItem value="PARTIALLY_PACKED">Partially packed</MenuItem></Select></FormControl></Box>
      <TableContainer sx={{ maxHeight: { xs: "none", sm: "calc(100vh - 310px)" }, overflowX: "auto", display: { xs: "none", sm: "block" } }}><Table stickyHeader size="small" sx={{ minWidth: 760 }}><TableHead><TableRow><TableCell>Batch</TableCell><TableCell>Product</TableCell><TableCell>Produced</TableCell><TableCell>Packed / ship</TableCell><TableCell>Remaining</TableCell><TableCell>Status</TableCell><TableCell align="right">Action</TableCell></TableRow></TableHead><TableBody>{visibleBatches.length ? visibleBatches.map((batch: any) => <TableRow key={batch.id} hover><TableCell sx={{ fontWeight: 700 }}>#{batch.id}</TableCell><TableCell>{batch.recipe_name}</TableCell><TableCell className="tnum">{batch.produced_qty} kg</TableCell><TableCell sx={{ color: "success.main" }} className="tnum">{batch.packed_qty} kg</TableCell><TableCell sx={{ color: "warning.main" }} className="tnum">{batch.remaining_qty} kg</TableCell><TableCell><StatusChip status={batch.status === "READY_TO_PACK" ? "info" : "warning"} label={batch.status === "READY_TO_PACK" ? "Ready to pack" : "Partially packed"} /></TableCell><TableCell align="right"><Button size="small" variant="contained" onClick={() => setSelected(batch)}>Pack</Button></TableCell></TableRow>) : <TableRow><TableCell colSpan={7} align="center">{batches.length ? "No batches match your filters." : "No batches are waiting to be packed."}</TableCell></TableRow>}</TableBody></Table></TableContainer>
      <Box sx={{ display: { xs: "block", sm: "none" } }}>
        {visibleBatches.length ? (
          <Stack spacing={1.5}>
            {visibleBatches.map((batch: any) => (
              <Card key={batch.id} variant="outlined">
                <CardContent sx={{ p: 2, "&:last-child": { pb: 2 } }}>
                  <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 1, mb: 1 }}>
                    <Box sx={{ minWidth: 0 }}>
                      <Typography variant="subtitle2" sx={{ fontWeight: 700, fontSize: "0.9375rem" }}>{batch.recipe_name}</Typography>
                      <Typography variant="caption" color="text.secondary">Batch #{batch.id}</Typography>
                    </Box>
                    <StatusChip status={batch.status === "READY_TO_PACK" ? "info" : "warning"} label={batch.status === "READY_TO_PACK" ? "Ready" : "Partial"} />
                  </Box>
                  <Box sx={{ display: "flex", gap: 2, mb: 1.5 }} className="tnum">
                    <Box><Typography variant="caption" color="text.secondary" sx={{ display: "block" }}>Produced</Typography><Typography variant="body2" sx={{ fontWeight: 600 }}>{batch.produced_qty} kg</Typography></Box>
                    <Box><Typography variant="caption" color="text.secondary" sx={{ display: "block" }}>Packed</Typography><Typography variant="body2" sx={{ fontWeight: 600, color: "success.main" }}>{batch.packed_qty} kg</Typography></Box>
                    <Box><Typography variant="caption" color="text.secondary" sx={{ display: "block" }}>Remaining</Typography><Typography variant="body2" sx={{ fontWeight: 700, color: "warning.main" }}>{batch.remaining_qty} kg</Typography></Box>
                  </Box>
                  <Button fullWidth variant="contained" onClick={() => setSelected(batch)} sx={{ minHeight: 44 }}>
                    Pack batch #{batch.id}
                  </Button>
                </CardContent>
              </Card>
            ))}
          </Stack>
        ) : (
          <EmptyState
            title={batches.length ? "No batches match your filters." : "No batches are waiting to be packed."}
            actionLabel={batches.length ? "Clear filters" : undefined}
            onAction={batches.length ? () => { setSearch(""); setStatusFilter("ALL"); setPage(0); } : undefined}
          />
        )}
      </Box>
      <TablePagination component="div" count={filteredBatches.length} page={page} onPageChange={(_, nextPage) => setPage(nextPage)} rowsPerPage={rowsPerPage} onRowsPerPageChange={(event) => { setRowsPerPage(Number(event.target.value)); setPage(0); }} rowsPerPageOptions={[10, 25, 50]} />
    </CardContent></Card>}
    <Dialog open={!!selected} onClose={() => { setSelected(null); setError(""); }} maxWidth="sm" fullWidth><DialogTitle>Pack batch #{selected?.id}</DialogTitle><DialogContent>{error && <Alert severity="error" sx={{ mb: 1 }}>{error}</Alert>}{selected && <><Typography sx={{ mb: 2 }}>{selected.recipe_name} · {selected.remaining_qty} kg remaining</Typography><FormControl fullWidth margin="dense" disabled={packTypesLoading}><InputLabel>{packTypesLoading ? "Loading pack types..." : "Pack type"}</InputLabel><Select value={packTypeId} label={packTypesLoading ? "Loading pack types..." : "Pack type"} onChange={(event) => setPackTypeId(Number(event.target.value))}>{packTypes.map((item: any) => <MenuItem key={item.id} value={item.id}>{item.name} · {item.size_grams} g</MenuItem>)}</Select></FormControl><TextField fullWidth margin="dense" label="Number of boxes" type="number" value={count} onChange={(event) => setCount(event.target.value)} /><Autocomplete options={employees} getOptionLabel={(o) => o.name} value={employees.find((e: any) => e.id === employeeId) || null}             onChange={(_, v) => setEmployeeId(v?.id || null)} renderInput={(params) => <TextField {...params} fullWidth margin="dense" label="Packing employee" placeholder="Select employee" />} /><Typography variant="body2" sx={{ mt: 2 }}>This will pack {(((selectedType?.size_grams || 0) * Number(count)) / 1000 || 0).toFixed(3)} kg and leave {Math.max(selected.remaining_qty - ((selectedType?.size_grams || 0) * Number(count)) / 1000, 0).toFixed(3)} kg.</Typography><TableContainer component={Paper} sx={{ mt: 2 }}><Table size="small"><TableHead><TableRow><TableCell>Pack type</TableCell><TableCell>Boxes</TableCell><TableCell>Employee</TableCell></TableRow></TableHead><TableBody>{selected.packages.map((item: any) => <TableRow key={item.id}><TableCell>{item.pack_size_grams} g</TableCell><TableCell>{item.pack_count}</TableCell><TableCell>{item.employee_name || "—"}</TableCell></TableRow>)}</TableBody></Table></TableContainer></>}</DialogContent><DialogActions><Button onClick={() => setSelected(null)}>Cancel</Button><Button variant="contained" onClick={submit} disabled={pack.isPending}>Confirm packing</Button></DialogActions></Dialog>
  </Box>;
};
