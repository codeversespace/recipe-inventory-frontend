import { Alert, Box, Card, CardContent, Chip, CircularProgress, Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Typography } from "@mui/material";
import { useInventory, useOrderDemand, useSaleableStock, usePackingMaterials } from "../hooks/useApi";

const cellSx = { py: 0.75, px: 1, fontSize: { xs: "0.7rem", sm: "0.8rem" } };

export const Inventory = () => {
  const { data: saleableStock = [], isLoading, error } = useSaleableStock();
  const { data: rawMaterials = [], isLoading: rawMaterialsLoading, error: rawMaterialsError } = useInventory();
  const { data: orderDemand = [] } = useOrderDemand();
  const { data: packingMaterials = [] } = usePackingMaterials();

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
        <>
        <TableContainer component={Paper} sx={{ mb: 3, overflowX: "auto" }}>
          <Table size="small">
            <TableHead><TableRow>
              <TableCell sx={{ ...cellSx, fontWeight: 700 }}>Item</TableCell>
              <TableCell sx={{ ...cellSx, fontWeight: 700 }}>Qty</TableCell>
              <TableCell sx={{ ...cellSx, fontWeight: 700 }}>Unit</TableCell>
              <TableCell sx={{ ...cellSx, fontWeight: 700, display: { xs: "none", sm: "table-cell" } }}>Pending Orders</TableCell>
              <TableCell sx={{ ...cellSx, fontWeight: 700, display: { xs: "none", sm: "table-cell" } }}>Production Needed</TableCell>
              <TableCell sx={{ ...cellSx, fontWeight: 700 }}>Cost</TableCell>
              <TableCell sx={{ ...cellSx, fontWeight: 700 }}>Price</TableCell>
              <TableCell sx={{ ...cellSx, fontWeight: 700 }}>Turnover</TableCell>
            </TableRow></TableHead>
            <TableBody>
              {saleableStock.length ? saleableStock.map((item: any) => {
                const demand = orderDemand.find((d: any) => d.stock_item_id === item.id);
                const pendingQty = demand?.total_ordered || 0;
                const shortage = demand?.shortage || 0;
                return (
                  <TableRow key={item.id}>
                    <TableCell sx={cellSx}>{item.name}</TableCell>
                    <TableCell sx={{ ...cellSx, fontWeight: 700 }}>{item.qty}</TableCell>
                    <TableCell sx={cellSx}>{item.unit}</TableCell>
                    <TableCell sx={{ ...cellSx, display: { xs: "none", sm: "table-cell" } }}>
                      {pendingQty > 0 ? (
                        <Chip label={`${pendingQty} ${item.unit}`} color="info" size="small" sx={{ fontSize: "0.65rem", height: 20 }} />
                      ) : "—"}
                    </TableCell>
                    <TableCell sx={{ ...cellSx, display: { xs: "none", sm: "table-cell" } }}>
                      {shortage > 0 ? (
                        <Chip label={`${shortage} ${item.unit}`} color="error" size="small" sx={{ fontSize: "0.65rem", height: 20, fontWeight: 700 }} />
                      ) : pendingQty > 0 ? (
                        <Chip label="Sufficient" color="success" size="small" sx={{ fontSize: "0.65rem", height: 20 }} />
                      ) : "—"}
                    </TableCell>
                    <TableCell sx={cellSx}>{item.cost_per_unit > 0 ? `₹${item.cost_per_unit.toFixed(0)}` : "—"}</TableCell>
                    <TableCell sx={cellSx}>{item.unit_price > 0 ? `₹${item.unit_price.toFixed(0)}` : "—"}</TableCell>
                    <TableCell sx={cellSx}>
                      {(() => {
                        if (item.cost_per_unit > 0 && item.unit_price > 0) {
                          const margin = ((item.unit_price - item.cost_per_unit) / item.unit_price) * 100;
                          const color = margin > 30 ? "success.main" : margin >= 15 ? "warning.main" : "error.main";
                          return <Chip label={`${margin.toFixed(0)}% margin`} size="small" sx={{ fontSize: "0.65rem", height: 20, color, fontWeight: 600 }} />;
                        }
                        return "—";
                      })()}
                    </TableCell>
                  </TableRow>
                );
              }) : (
                <TableRow>
                  <TableCell colSpan={8} align="center" sx={{ ...cellSx, py: 3 }}>No saleable goods in stock.</TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>

        {orderDemand.filter((d: any) => d.shortage > 0).length > 0 && (
          <Alert severity="warning" sx={{ mb: 2 }}>
            <Typography variant="body2" sx={{ fontWeight: 600 }}>Production needed to fulfill pending orders:</Typography>
            {orderDemand.filter((d: any) => d.shortage > 0).map((d: any) => (
              <Typography key={d.stock_item_id} variant="caption" sx={{ display: "block" }}>
                {d.stock_item_name}: <strong>{d.shortage}</strong> units short ({d.total_ordered} ordered − {d.stock_available} in stock)
              </Typography>
            ))}
          </Alert>
        )}
        </>
      )}

      {/* Raw Materials */}
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
                  <TableCell sx={{ ...cellSx, color: item.is_low_stock ? "error.main" : "text.secondary", fontWeight: item.is_low_stock ? 700 : 400 }}>{item.is_low_stock ? "Low" : "OK"}</TableCell>
                </TableRow>
              )) : <TableRow><TableCell colSpan={5} align="center" sx={{ ...cellSx, py: 3 }}>No raw materials recorded.</TableCell></TableRow>}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      {(() => {
        const reorderItems = rawMaterials.filter((item: any) => item.min_stock > 0 && item.on_hand_qty <= item.min_stock);
        if (reorderItems.length === 0) return null;
        return (
          <Alert severity="warning" sx={{ mb: 3, mt: 2 }} icon={false}>
            <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1 }}>Reorder Needed</Typography>
            {reorderItems.map((item: any) => {
              const suggestedQty = item.min_stock * 2 - item.on_hand_qty;
              return (
                <Typography key={item.id} variant="caption" sx={{ display: "block" }}>
                  {item.name}: <strong>{item.on_hand_qty}</strong> / {item.min_stock} {item.base_unit} — reorder <strong>{suggestedQty.toFixed(1)}</strong> {item.base_unit}
                </Typography>
              );
            })}
          </Alert>
        );
      })()}

      {/* Packing Materials */}
      <Typography variant="h5" sx={{ mt: 3, mb: 1, fontSize: { xs: "1.1rem", sm: "1.25rem" }, fontWeight: 700 }}>Packing Materials</Typography>
      <TableContainer component={Paper} sx={{ overflowX: "auto" }}>
        <Table size="small">
          <TableHead><TableRow>
            <TableCell sx={{ ...cellSx, fontWeight: 700 }}>Material</TableCell><TableCell sx={{ ...cellSx, fontWeight: 700 }}>Qty</TableCell>
            <TableCell sx={{ ...cellSx, fontWeight: 700 }}>Unit</TableCell><TableCell sx={{ ...cellSx, fontWeight: 700 }}>Cost</TableCell>
          </TableRow></TableHead>
          <TableBody>
            {packingMaterials.length ? packingMaterials.map((item: any) => (
              <TableRow key={item.id}>
                <TableCell sx={{ ...cellSx, fontWeight: 600 }}>{item.name}</TableCell>
                <TableCell sx={{ ...cellSx, fontWeight: 700, color: item.qty <= 0 ? "error.main" : "text.primary" }}>{item.qty}</TableCell>
                <TableCell sx={cellSx}>{item.unit}</TableCell>
                <TableCell sx={cellSx}>₹{item.unit_price?.toFixed(2) || "0.00"}</TableCell>
              </TableRow>
            )) : <TableRow><TableCell colSpan={4} align="center" sx={{ ...cellSx, py: 3 }}>No packing materials recorded.</TableCell></TableRow>}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );
};
