import { Box, Button, Card, CardContent, CircularProgress, FormControl, InputLabel, MenuItem, Paper, Select, Stack, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, TextField, Typography, useMediaQuery, useTheme } from "@mui/material";
import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useDamageRecords, useDamageSummary } from "../hooks/useApi";
import { EmptyState, ErrorState, Money, PageHeader, TableSkeleton } from "../components/ui";
import { formatDate } from "../utils/formatDate";
import { formatMoney } from "../utils/formatNumber";

const cellSx = { py: 0.75, px: 1, fontSize: { xs: "0.875rem", sm: "0.8rem" } };

const TYPE_LABELS: Record<string, string> = {
  ingredient: "Raw material",
  purchase_lot: "Purchase lot",
  manual_stock: "Packing / goods",
  stock_item: "Saleable",
  batch: "Batch",
};

const REASONS = ["damaged", "spoilt", "burnt", "expired", "broken", "other"];

export const DamageLoss = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));
  const navigate = useNavigate();
  const { data: records = [], isLoading, error, refetch } = useDamageRecords(200);
  const { data: summary } = useDamageSummary();
  const [reasonFilter, setReasonFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");
  const [search, setSearch] = useState("");

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return records.filter((r: any) => {
      if (reasonFilter !== "all" && r.reason !== reasonFilter) return false;
      if (typeFilter !== "all" && r.item_type !== typeFilter) return false;
      if (q && !`${r.item_name} ${r.notes || ""}`.toLowerCase().includes(q)) return false;
      return true;
    });
  }, [records, reasonFilter, typeFilter, search]);

  const filteredLoss = useMemo(
    () => filtered.reduce((s: number, r: any) => s + (Number(r.loss_amount) || 0), 0),
    [filtered],
  );

  const stats = [
    { label: "Total loss", value: formatMoney(summary?.total_loss || 0), tone: "error.main" as const },
    { label: "Damage events", value: String(summary?.total_events || 0), tone: "text.primary" as const },
    { label: "Loss · last 30 days", value: formatMoney(summary?.loss_last_30d || 0), tone: "warning.main" as const },
  ];

  return (
    <Box>
      <PageHeader
        title="Damage & Loss"
        subtitle="Wastage ledger — every damaged, spoilt, burnt or expired item with its cost. Record new damage from Inventory or the Production batch page."
        actions={
          <Button variant="outlined" size="small" onClick={() => navigate("/inventory")} sx={{ minHeight: 40 }}>
            Go to Inventory
          </Button>
        }
      />

      <Box sx={{ display: "grid", gridTemplateColumns: { xs: "repeat(3, 1fr)", sm: "repeat(3, 1fr)" }, gap: { xs: 1, sm: 2 }, mb: 2 }}>
        {stats.map((s) => (
          <Card key={s.label} variant="outlined">
            <CardContent sx={{ p: { xs: 1.5, sm: 2 }, "&:last-child": { pb: { xs: 1.5, sm: 2 } } }}>
              <Typography variant="caption" color="text.secondary" sx={{ fontSize: "0.75rem" }}>{s.label}</Typography>
              <Typography variant="h6" sx={{ fontWeight: 700, fontSize: { xs: "1.1rem", sm: "1.5rem" }, color: s.tone }} className="tnum">
                {s.value}
              </Typography>
            </CardContent>
          </Card>
        ))}
      </Box>

      <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap", mb: 2 }}>
        <FormControl size="small" sx={{ flex: "1 1 140px", minWidth: 0 }}>
          <InputLabel>Reason</InputLabel>
          <Select value={reasonFilter} label="Reason" onChange={(e) => setReasonFilter(e.target.value)}>
            <MenuItem value="all">All reasons</MenuItem>
            {REASONS.map((r) => <MenuItem key={r} value={r} sx={{ textTransform: "capitalize" }}>{r}</MenuItem>)}
          </Select>
        </FormControl>
        <FormControl size="small" sx={{ flex: "1 1 160px", minWidth: 0 }}>
          <InputLabel>Stock type</InputLabel>
          <Select value={typeFilter} label="Stock type" onChange={(e) => setTypeFilter(e.target.value)}>
            <MenuItem value="all">All types</MenuItem>
            {Object.entries(TYPE_LABELS).map(([v, l]) => <MenuItem key={v} value={v}>{l}</MenuItem>)}
          </Select>
        </FormControl>
        <TextField size="small" label="Search item / notes" value={search} onChange={(e) => setSearch(e.target.value)} sx={{ flex: "2 1 200px", minWidth: 0 }} />
      </Box>

      {(reasonFilter !== "all" || typeFilter !== "all" || search.trim()) && (
        <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }} className="tnum">
          {filtered.length} event{filtered.length === 1 ? "" : "s"} · Loss in view: {formatMoney(filteredLoss)}
        </Typography>
      )}

      {isLoading ? (
        isMobile ? (
          <Box sx={{ display: "flex", justifyContent: "center", py: 4 }}><CircularProgress /></Box>
        ) : (
          <TableContainer component={Paper} sx={{ overflowX: "auto" }}>
            <Table size="small"><TableHead><TableRow>
              <TableCell sx={{ ...cellSx, fontWeight: 700 }}>Date</TableCell><TableCell sx={{ ...cellSx, fontWeight: 700 }}>Item</TableCell><TableCell sx={{ ...cellSx, fontWeight: 700 }}>Type</TableCell><TableCell sx={{ ...cellSx, fontWeight: 700 }}>Qty</TableCell><TableCell sx={{ ...cellSx, fontWeight: 700 }}>Reason</TableCell><TableCell sx={{ ...cellSx, fontWeight: 700 }}>Loss</TableCell><TableCell sx={{ ...cellSx, fontWeight: 700 }}>Notes</TableCell>
            </TableRow></TableHead>
            <TableBody><TableSkeleton rows={5} colSpan={7} /></TableBody>
            </Table>
          </TableContainer>
        )
      ) : error ? (
        <ErrorState message={(error as any).message} onRetry={() => refetch()} />
      ) : filtered.length === 0 ? (
        <EmptyState title={records.length ? "No damage records match the filters." : "No damage recorded yet."} message={records.length ? "Adjust the filters to see more." : "Damaged, spoilt or burnt stock marked from Inventory or Production will appear here with its cost."} />
      ) : isMobile ? (
        <Stack spacing={1.5}>
          {filtered.map((r: any) => (
            <Card key={r.id} variant="outlined">
              <CardContent sx={{ p: 2, "&:last-child": { pb: 2 } }}>
                <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 1 }}>
                  <Box sx={{ minWidth: 0 }}>
                    <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>{r.item_name}</Typography>
                    <Typography variant="caption" color="text.secondary">{formatDate(r.created_at)} · {TYPE_LABELS[r.item_type] || r.item_type} · <span style={{ textTransform: "capitalize" }}>{r.reason}</span></Typography>
                  </Box>
                  <Typography variant="body2" sx={{ fontWeight: 700, color: "error.main", whiteSpace: "nowrap" }} className="tnum">
                    <Money value={r.loss_amount || 0} />
                  </Typography>
                </Box>
                <Box sx={{ display: "flex", gap: 2, mt: 0.5 }} className="tnum">
                  <Typography variant="body2" color="text.secondary">Qty: <strong>{r.qty}{r.unit ? ` ${r.unit}` : ""}</strong></Typography>
                </Box>
                {r.notes && <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>{r.notes}</Typography>}
              </CardContent>
            </Card>
          ))}
        </Stack>
      ) : (
        <TableContainer component={Paper} sx={{ overflowX: "auto" }}>
          <Table size="small" sx={{ minWidth: 760 }}>
            <TableHead><TableRow>
              <TableCell sx={{ ...cellSx, fontWeight: 700 }}>Date</TableCell>
              <TableCell sx={{ ...cellSx, fontWeight: 700 }}>Item</TableCell>
              <TableCell sx={{ ...cellSx, fontWeight: 700 }}>Type</TableCell>
              <TableCell sx={{ ...cellSx, fontWeight: 700 }}>Qty</TableCell>
              <TableCell sx={{ ...cellSx, fontWeight: 700 }}>Reason</TableCell>
              <TableCell sx={{ ...cellSx, fontWeight: 700 }}>Loss</TableCell>
              <TableCell sx={{ ...cellSx, fontWeight: 700 }}>Notes</TableCell>
            </TableRow></TableHead>
            <TableBody>
              {filtered.map((r: any) => (
                <TableRow key={r.id} hover>
                  <TableCell sx={cellSx}>{formatDate(r.created_at)}</TableCell>
                  <TableCell sx={{ ...cellSx, fontWeight: 600 }}>{r.item_name}</TableCell>
                  <TableCell sx={cellSx}>{TYPE_LABELS[r.item_type] || r.item_type}</TableCell>
                  <TableCell sx={cellSx} className="tnum">{r.qty}{r.unit ? ` ${r.unit}` : ""}</TableCell>
                  <TableCell sx={{ ...cellSx, textTransform: "capitalize" }}>{r.reason}</TableCell>
                  <TableCell sx={{ ...cellSx, fontWeight: 700, color: "error.main" }} className="tnum"><Money value={r.loss_amount || 0} /></TableCell>
                  <TableCell sx={cellSx}>{r.notes || "—"}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}
    </Box>
  );
};
