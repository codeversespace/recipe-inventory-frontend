import { Box, Card, CardContent, CircularProgress, Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Typography } from "@mui/material";
import { useInventory, useSaleableStock } from "../hooks/useApi";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, Cell, Legend } from "recharts";

const cellSx = { py: 0.75, px: 1, fontSize: { xs: "0.7rem", sm: "0.8rem" } };

const CustomBarTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <Card sx={{ p: 1, boxShadow: 3 }}>
      <Typography variant="caption" sx={{ fontWeight: 700 }}>{label}</Typography>
      {payload.map((entry: any, i: number) => (
        <Typography key={i} variant="caption" sx={{ display: "block", color: entry.color }}>
          {entry.name}: {entry.value} ({entry.payload?.unit || ""})
        </Typography>
      ))}
    </Card>
  );
};

export const Inventory = () => {
  const { data: saleableStock = [], isLoading, error } = useSaleableStock();
  const { data: rawMaterials = [], isLoading: rawMaterialsLoading, error: rawMaterialsError } = useInventory();

  const stockBarData = rawMaterials.map((item: any) => ({
    name: item.name.length > 12 ? item.name.slice(0, 12) + "..." : item.name,
    fullName: item.name,
    "On Hand": item.on_hand_qty || 0,
    "Min Stock": item.min_stock || 0,
    unit: item.base_unit,
    isLow: item.is_low_stock,
  }));

  return (
    <Box>
      <Typography variant="h4" sx={{ mb: 1, fontSize: { xs: "1.5rem", sm: "2rem" }, fontWeight: 700 }}>Inventory</Typography>
      <Typography color="text.secondary" sx={{ mb: 2, fontSize: { xs: "0.75rem", sm: "0.875rem" } }}>
        Purchased saleable goods and packaged production stock appear here. Raw materials are tracked separately below.
      </Typography>

      {/* Saleable Stock */}
      <Typography variant="h5" sx={{ mb: 1, fontSize: { xs: "1.1rem", sm: "1.25rem" }, fontWeight: 700 }}>Saleable Inventory</Typography>
      {isLoading ? (
        <Box sx={{ display: "flex", justifyContent: "center", py: 4 }}><CircularProgress /></Box>
      ) : error ? (
        <Typography color="error" sx={{ fontSize: "0.85rem" }}>{(error as any).message}</Typography>
      ) : (
        <TableContainer component={Paper} sx={{ mb: 3, overflowX: "auto" }}>
          <Table size="small">
            <TableHead><TableRow>
              <TableCell sx={{ ...cellSx, fontWeight: 700 }}>Item</TableCell>
              <TableCell sx={{ ...cellSx, fontWeight: 700 }}>Qty</TableCell>
              <TableCell sx={{ ...cellSx, fontWeight: 700 }}>Unit</TableCell>
              <TableCell sx={{ ...cellSx, fontWeight: 700 }}>Cost</TableCell>
              <TableCell sx={{ ...cellSx, fontWeight: 700 }}>Price</TableCell>
            </TableRow></TableHead>
            <TableBody>
              {saleableStock.length ? saleableStock.map((item: any) => (
                <TableRow key={item.id}>
                  <TableCell sx={cellSx}>{item.name}</TableCell>
                  <TableCell sx={{ ...cellSx, fontWeight: 700 }}>{item.qty}</TableCell>
                  <TableCell sx={cellSx}>{item.unit}</TableCell>
                  <TableCell sx={cellSx}>{item.cost_per_unit > 0 ? `₹${item.cost_per_unit.toFixed(0)}` : "—"}</TableCell>
                  <TableCell sx={cellSx}>{item.unit_price > 0 ? `₹${item.unit_price.toFixed(0)}` : "—"}</TableCell>
                </TableRow>
              )) : (
                <TableRow>
                  <TableCell colSpan={5} align="center" sx={{ ...cellSx, py: 3 }}>No saleable goods in stock.</TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      {/* Raw Materials */}
      <Typography variant="h5" sx={{ mb: 1, fontSize: { xs: "1.1rem", sm: "1.25rem" }, fontWeight: 700 }}>Raw Materials</Typography>

      {/* Stock Level Bar Chart */}
      {!rawMaterialsLoading && stockBarData.length > 0 && (
        <Card sx={{ mb: 2 }}>
          <CardContent sx={{ p: { xs: 1, sm: 2 }, "&:last-child": { pb: { xs: 1, sm: 2 } } }}>
            <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 700 }}>Stock Levels vs Minimum Threshold</Typography>
            <ResponsiveContainer width="100%" height={Math.max(200, stockBarData.length * 30)}>
              <BarChart
                data={stockBarData}
                layout="vertical"
                margin={{ top: 5, right: 10, left: 0, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis type="number" tick={{ fontSize: 10 }} />
                <YAxis dataKey="name" type="category" width={90} tick={{ fontSize: 10 }} />
                <RechartsTooltip content={<CustomBarTooltip />} />
                <Legend wrapperStyle={{ fontSize: 11 }} />
                <Bar dataKey="On Hand" fill="#1976d2" radius={[0, 4, 4, 0]} barSize={12}>
                  {stockBarData.map((entry: any, index: number) => (
                    <Cell key={`cell-${index}`} fill={entry.isLow ? "#f57c00" : "#1976d2"} />
                  ))}
                </Bar>
                <Bar dataKey="Min Stock" fill="#e0e0e0" radius={[0, 4, 4, 0]} barSize={12} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}

      {rawMaterialsLoading ? <Box sx={{ display: "flex", justifyContent: "center", py: 4 }}><CircularProgress /></Box> : rawMaterialsError ? (
        <Typography color="error" sx={{ fontSize: "0.85rem" }}>{(rawMaterialsError as any).message}</Typography>
      ) : (
        <TableContainer component={Paper} sx={{ overflowX: "auto" }}>
          <Table size="small">
            <TableHead><TableRow>
              <TableCell sx={{ ...cellSx, fontWeight: 700 }}>Ingredient</TableCell><TableCell sx={{ ...cellSx, fontWeight: 700 }}>Qty</TableCell>
              <TableCell sx={{ ...cellSx, fontWeight: 700 }}>Unit</TableCell><TableCell sx={{ ...cellSx, fontWeight: 700 }}>Avg cost</TableCell><TableCell sx={{ ...cellSx, fontWeight: 700 }}>Status</TableCell>
            </TableRow></TableHead>
            <TableBody>
              {rawMaterials.length ? rawMaterials.map((item: any) => (
                <TableRow key={item.id}>
                  <TableCell sx={cellSx}>{item.name}</TableCell>
                  <TableCell sx={{ ...cellSx, fontWeight: 700 }}>{item.on_hand_qty}</TableCell>
                  <TableCell sx={cellSx}>{item.base_unit}</TableCell>
                  <TableCell sx={cellSx}>₹{item.avg_unit_price.toFixed(0)}</TableCell>
                  <TableCell sx={{ ...cellSx, color: item.is_low_stock ? "error.main" : "text.secondary", fontWeight: item.is_low_stock ? 700 : 400 }}>{item.is_low_stock ? "Low" : "OK"}</TableCell>
                </TableRow>
              )) : <TableRow><TableCell colSpan={5} align="center" sx={{ ...cellSx, py: 3 }}>No raw materials recorded.</TableCell></TableRow>}
            </TableBody>
          </Table>
        </TableContainer>
      )}
    </Box>
  );
};
