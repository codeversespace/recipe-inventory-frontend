// src/pages/Inventory.tsx
import {
  Box,
  CircularProgress,
  TableContainer,
  Paper,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  Typography,
} from "@mui/material";
import { useFinishedInventory, useInventory } from "../hooks/useApi";

export const Inventory = () => {
  const { data, isLoading, error } = useInventory();
  const { data: finishedInventory = [] } = useFinishedInventory();

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        Current Inventory
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
                <TableCell>Ingredient</TableCell>
                <TableCell>On‑hand Qty</TableCell>
                <TableCell>Avg Unit Price (₹)</TableCell>
                <TableCell>Minimum Stock</TableCell>
                <TableCell>Status</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {data?.map((inv: any) => (
                <TableRow key={inv.id}>
                  <TableCell>{inv.name}</TableCell>
                  <TableCell>{inv.on_hand_qty}</TableCell>
                  <TableCell>{inv.avg_unit_price?.toFixed(2) ?? "0.00"}</TableCell>
                  <TableCell>{inv.min_stock ?? 0}</TableCell>
                  <TableCell><Typography color={inv.is_low_stock ? "error" : "success.main"}>{inv.is_low_stock ? "Low stock" : "OK"}</Typography></TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      <Typography variant="h5" sx={{ mt: 4, mb: 2 }}>
        Finished products available for sale
      </Typography>
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Product</TableCell>
              <TableCell>Produced (kg)</TableCell>
              <TableCell>Packed / ready to ship (kg)</TableCell>
              <TableCell>Sold (kg)</TableCell>
              <TableCell>Available to sell (kg)</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {finishedInventory.map((item: any) => (
              <TableRow key={item.recipe_id}>
                <TableCell>{item.recipe_name}</TableCell>
                <TableCell>{item.produced_qty}</TableCell>
                <TableCell>{item.packed_qty}</TableCell>
                <TableCell>{item.sold_qty}</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>{item.available_qty}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );
};
