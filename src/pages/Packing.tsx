import { Alert, Box, Button, Card, CardContent, CircularProgress, Dialog, DialogActions, DialogContent, DialogTitle, FormControl, InputLabel, MenuItem, Paper, Select, Table, TableBody, TableCell, TableContainer, TableHead, TablePagination, TableRow, TextField, Typography } from "@mui/material";
import { useMemo, useState } from "react";
import { usePackBatch, useReadyToPack } from "../hooks/useApi";

export const Packing = () => {
  const { data: batches = [], isLoading } = useReadyToPack();
  const pack = usePackBatch();
  const [selected, setSelected] = useState<any>(null);
  const [size, setSize] = useState("250");
  const [count, setCount] = useState("");
  const [employee, setEmployee] = useState("");
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const filteredBatches = useMemo(() => batches.filter((batch: any) => {
    const matchesSearch = `${batch.id} ${batch.recipe_name}`.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === "ALL" || batch.status === statusFilter;
    return matchesSearch && matchesStatus;
  }), [batches, search, statusFilter]);
  const visibleBatches = filteredBatches.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage);
  const submit = async () => {
    const packSize = Number(size);
    const packCount = Number(count);
    if (!selected || !Number.isFinite(packSize) || packSize <= 0 || !Number.isInteger(packCount) || packCount <= 0) { setError("Enter a valid pack size and whole-number box count."); return; }
    try { await pack.mutateAsync({ batch_id: selected.id, pack_size_grams: packSize, pack_count: packCount, employee_name: employee || undefined }); setSelected(null); setCount(""); setEmployee(""); setError(""); }
    catch (requestError: any) { setError(requestError.response?.data?.detail || "Could not record packing."); }
  };
  return <Box><Typography variant="h4" gutterBottom>Packing queue</Typography><Typography color="text.secondary" sx={{ mb: 3 }}>Search and pack prepared batches. Packed quantity becomes ready to ship.</Typography>{error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}{isLoading ? <CircularProgress /> : <Card><CardContent sx={{ p: { xs: 1.5, sm: 2.5 } }}><Box sx={{ display: "flex", gap: 1.5, flexWrap: "wrap", mb: 2 }}><TextField size="small" label="Search batch or product" value={search} onChange={(event) => { setSearch(event.target.value); setPage(0); }} sx={{ flex: "1 1 240px" }} /><FormControl size="small" sx={{ minWidth: 170 }}><InputLabel>Status</InputLabel><Select value={statusFilter} label="Status" onChange={(event) => { setStatusFilter(event.target.value); setPage(0); }}><MenuItem value="ALL">All statuses</MenuItem><MenuItem value="READY_TO_PACK">Ready to pack</MenuItem><MenuItem value="PARTIALLY_PACKED">Partially packed</MenuItem></Select></FormControl></Box><TableContainer sx={{ maxHeight: "calc(100vh - 310px)", overflowX: "auto" }}><Table stickyHeader size="small" sx={{ minWidth: 760 }}><TableHead><TableRow><TableCell>Batch</TableCell><TableCell>Product</TableCell><TableCell>Produced</TableCell><TableCell>Packed / ship</TableCell><TableCell>Remaining</TableCell><TableCell>Status</TableCell><TableCell align="right">Action</TableCell></TableRow></TableHead><TableBody>{visibleBatches.length ? visibleBatches.map((batch: any) => <TableRow key={batch.id} hover><TableCell sx={{ fontWeight: 700 }}>#{batch.id}</TableCell><TableCell>{batch.recipe_name}</TableCell><TableCell>{batch.produced_qty} kg</TableCell><TableCell sx={{ color: "success.main" }}>{batch.packed_qty} kg</TableCell><TableCell sx={{ color: "warning.main" }}>{batch.remaining_qty} kg</TableCell><TableCell>{batch.status.replace("_", " ")}</TableCell><TableCell align="right"><Button size="small" variant="contained" onClick={() => setSelected(batch)}>Pack</Button></TableCell></TableRow>) : <TableRow><TableCell colSpan={7} align="center">{batches.length ? "No batches match your filters." : "No batches are waiting to be packed."}</TableCell></TableRow>}</TableBody></Table></TableContainer><TablePagination component="div" count={filteredBatches.length} page={page} onPageChange={(_, nextPage) => setPage(nextPage)} rowsPerPage={rowsPerPage} onRowsPerPageChange={(event) => { setRowsPerPage(Number(event.target.value)); setPage(0); }} rowsPerPageOptions={[10, 25, 50]} /></CardContent></Card>}<Dialog open={!!selected} onClose={() => setSelected(null)} maxWidth="sm" fullWidth><DialogTitle>Pack batch #{selected?.id}</DialogTitle><DialogContent>{selected && <><Typography sx={{ mb: 2 }}>{selected.recipe_name} · {selected.remaining_qty} kg remaining</Typography><TextField fullWidth margin="dense" label="Pack size (grams)" type="number" value={size} onChange={(e) => setSize(e.target.value)} /><TextField fullWidth margin="dense" label="Number of boxes" type="number" value={count} onChange={(e) => setCount(e.target.value)} /><TextField fullWidth margin="dense" label="Packing employee" value={employee} onChange={(e) => setEmployee(e.target.value)} /><Typography variant="body2" sx={{ mt: 2 }}>This will pack {((Number(size) * Number(count)) / 1000 || 0).toFixed(3)} kg and leave {Math.max(selected.remaining_qty - (Number(size) * Number(count)) / 1000, 0).toFixed(3)} kg.</Typography><TableContainer component={Paper} sx={{ mt: 2 }}><Table size="small"><TableHead><TableRow><TableCell>Pack size</TableCell><TableCell>Boxes</TableCell><TableCell>Employee</TableCell></TableRow></TableHead><TableBody>{selected.packages.map((item: any) => <TableRow key={item.id}><TableCell>{item.pack_size_grams} g</TableCell><TableCell>{item.pack_count}</TableCell><TableCell>{item.employee_name || "—"}</TableCell></TableRow>)}</TableBody></Table></TableContainer></>}</DialogContent><DialogActions><Button onClick={() => setSelected(null)}>Cancel</Button><Button variant="contained" onClick={submit} disabled={pack.isPending}>Confirm packing</Button></DialogActions></Dialog></Box>;
};
