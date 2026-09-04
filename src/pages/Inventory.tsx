import { Box, CircularProgress, Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Typography } from "@mui/material";
import { useInventory, useSaleableStock } from "../hooks/useApi";

export const Inventory = () => {
  const { data: saleableStock = [], isLoading, error } = useSaleableStock();
  const { data: rawMaterials = [], isLoading: rawMaterialsLoading, error: rawMaterialsError } = useInventory();

  return (
    <Box>
      <Typography variant="h4" gutterBottom>Saleable Inventory</Typography>
      <Typography color="text.secondary" sx={{ mb: 2 }}>
        Purchased saleable goods and packaged production stock appear here. Raw materials are tracked separately below.
      </Typography>
      {isLoading ? (
        <CircularProgress />
      ) : error ? (
        <Typography color="error">{(error as any).message}</Typography>
      ) : (
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Saleable item</TableCell>
                <TableCell>Available quantity</TableCell>
                <TableCell>Unit</TableCell>
                <TableCell>Cost per unit</TableCell>
                <TableCell>Selling price</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {saleableStock.length ? saleableStock.map((item: any) => (
                <TableRow key={item.id}>
                  <TableCell>{item.name}</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>{item.qty}</TableCell>
                  <TableCell>{item.unit}</TableCell>
                  <TableCell>{item.cost_per_unit > 0 ? `₹${item.cost_per_unit.toFixed(2)}` : "Not calculated"}</TableCell>
                  <TableCell>{item.unit_price > 0 ? `₹${item.unit_price.toFixed(2)}` : "Not set"}</TableCell>
                </TableRow>
              )) : (
                <TableRow>
                  <TableCell colSpan={5} align="center">No saleable goods in stock.</TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
      )}
      <Typography variant="h4" gutterBottom sx={{ mt: 4 }}>Raw Materials</Typography>
      {rawMaterialsLoading ? <CircularProgress /> : rawMaterialsError ? (
        <Typography color="error">{(rawMaterialsError as any).message}</Typography>
      ) : (
        <TableContainer component={Paper}>
          <Table>
            <TableHead><TableRow>
              <TableCell>Ingredient</TableCell><TableCell>Available quantity</TableCell>
              <TableCell>Unit</TableCell><TableCell>Average cost</TableCell><TableCell>Stock status</TableCell>
            </TableRow></TableHead>
            <TableBody>
              {rawMaterials.length ? rawMaterials.map((item: any) => (
                <TableRow key={item.id}>
                  <TableCell>{item.name}</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>{item.on_hand_qty}</TableCell>
                  <TableCell>{item.base_unit}</TableCell>
                  <TableCell>₹{item.avg_unit_price.toFixed(2)}</TableCell>
                  <TableCell>{item.is_low_stock ? "Low stock" : "Available"}</TableCell>
                </TableRow>
              )) : <TableRow><TableCell colSpan={5} align="center">No raw materials recorded.</TableCell></TableRow>}
            </TableBody>
          </Table>
        </TableContainer>
      )}
    </Box>
  );
};
