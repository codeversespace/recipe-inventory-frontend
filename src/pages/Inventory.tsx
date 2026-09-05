import { Box, CircularProgress, Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Typography } from "@mui/material";
import { useInventory, useSaleableStock } from "../hooks/useApi";

const cellSx = { py: 0.75, px: 1, fontSize: { xs: "0.7rem", sm: "0.8rem" } };

export const Inventory = () => {
  const { data: saleableStock = [], isLoading, error } = useSaleableStock();
  const { data: rawMaterials = [], isLoading: rawMaterialsLoading, error: rawMaterialsError } = useInventory();

  return (
    <Box>
      <Typography variant="h4" sx={{ mb: 1, fontSize: { xs: "1.5rem", sm: "2rem" }, fontWeight: 700 }}>Saleable Inventory</Typography>
      <Typography color="text.secondary" sx={{ mb: 2, fontSize: { xs: "0.75rem", sm: "0.875rem" } }}>
        Purchased saleable goods and packaged production stock appear here. Raw materials are tracked separately below.
      </Typography>
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
      <Typography variant="h5" sx={{ mb: 1, fontSize: { xs: "1.1rem", sm: "1.25rem" }, fontWeight: 700 }}>Raw Materials</Typography>
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
                  <TableCell sx={{ ...cellSx, color: item.is_low_stock ? "error.main" : "text.secondary" }}>{item.is_low_stock ? "Low" : "OK"}</TableCell>
                </TableRow>
              )) : <TableRow><TableCell colSpan={5} align="center" sx={{ ...cellSx, py: 3 }}>No raw materials recorded.</TableCell></TableRow>}
            </TableBody>
          </Table>
        </TableContainer>
      )}
    </Box>
  );
};
