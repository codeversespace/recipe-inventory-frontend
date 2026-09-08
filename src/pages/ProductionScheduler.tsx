import { Box, Typography, Card, CardContent, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Button, CircularProgress, Chip } from "@mui/material";
import { useQuery } from "@tanstack/react-query";
import { api } from "../api/client";
import { useRecipes, useSaleableStock } from "../hooks/useApi";
import { formatDate } from "../utils/formatDate";
import { useNavigate } from "react-router-dom";

interface ScheduleItem {
  recipe_id: number;
  recipe_name: string;
  stock_item_name: string;
  current_stock: number;
  demand: number;
  suggested_qty: number;
  batches_needed: number;
  reason: string;
}

interface ForecastItem {
  name: string;
  velocity: number;
  total_sold: number;
}

export const ProductionScheduler = () => {
  const navigate = useNavigate();
  const { data: schedule, isLoading } = useQuery({
    queryKey: ["productionSchedule"],
    queryFn: async () => (await api.get("/production/schedule")).data,
  });

  const { data: recipes = [] } = useRecipes();
  const { data: saleableStock = [] } = useSaleableStock();

  const suggestions: ScheduleItem[] = schedule?.suggestions || [];
  const pendingOrders = schedule?.pending_orders_count ?? 0;
  const totalDemand = schedule?.total_demand ?? 0;
  const shortage = schedule?.total_shortage ?? 0;

  const handleProduce = (recipeId: number, qty: number) => {
    navigate(`/production?recipe_id=${recipeId}&qty=${qty}`);
  };

  const cellSx = { py: 0.75, px: 1, fontSize: { xs: "0.7rem", sm: "0.8rem" } };

  return (
    <Box>
      <Box sx={{ mb: 2 }}>
        <Typography variant="h4" sx={{ fontWeight: 700, fontSize: { xs: "1.5rem", sm: "2rem" } }}>Production Scheduler</Typography>
        <Typography color="text.secondary" sx={{ fontSize: { xs: "0.75rem", sm: "0.875rem" } }}>Plan upcoming production based on pending orders and sales forecast.</Typography>
      </Box>

      <Box sx={{ display: "flex", gap: 2, mb: 3 }}>
        <Card sx={{ flex: 1, background: "linear-gradient(135deg, #1976d2, #42a5f5)", color: "white" }}>
          <CardContent sx={{ p: { xs: 1.5, sm: 2 }, "&:last-child": { pb: { xs: 1.5, sm: 2 } } }}>
            <Typography variant="overline" sx={{ opacity: 0.8, fontSize: "0.65rem" }}>Pending Orders</Typography>
            <Typography variant="h5" sx={{ fontWeight: 700, fontSize: { xs: "1.25rem", sm: "1.5rem" } }}>{isLoading ? <CircularProgress size={20} sx={{ color: "white" }} /> : pendingOrders}</Typography>
          </CardContent>
        </Card>
        <Card sx={{ flex: 1, background: "linear-gradient(135deg, #f57c00, #ffb74d)", color: "white" }}>
          <CardContent sx={{ p: { xs: 1.5, sm: 2 }, "&:last-child": { pb: { xs: 1.5, sm: 2 } } }}>
            <Typography variant="overline" sx={{ opacity: 0.8, fontSize: "0.65rem" }}>Total Demand (units)</Typography>
            <Typography variant="h5" sx={{ fontWeight: 700, fontSize: { xs: "1.25rem", sm: "1.5rem" } }}>{isLoading ? <CircularProgress size={20} sx={{ color: "white" }} /> : totalDemand}</Typography>
          </CardContent>
        </Card>
        <Card sx={{ flex: 1, background: "linear-gradient(135deg, #d32f2f, #ef5350)", color: "white" }}>
          <CardContent sx={{ p: { xs: 1.5, sm: 2 }, "&:last-child": { pb: { xs: 1.5, sm: 2 } } }}>
            <Typography variant="overline" sx={{ opacity: 0.8, fontSize: "0.65rem" }}>Shortage (units)</Typography>
            <Typography variant="h5" sx={{ fontWeight: 700, fontSize: { xs: "1.25rem", sm: "1.5rem" } }}>{isLoading ? <CircularProgress size={20} sx={{ color: "white" }} /> : shortage}</Typography>
          </CardContent>
        </Card>
      </Box>

      <TableContainer sx={{ mb: 3 }}>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell sx={{ ...cellSx, fontWeight: 700 }}>Recipe</TableCell>
              <TableCell sx={{ ...cellSx, fontWeight: 700 }}>Stock Item</TableCell>
              <TableCell sx={{ ...cellSx, fontWeight: 700 }}>Current Stock</TableCell>
              <TableCell sx={{ ...cellSx, fontWeight: 700 }}>Demand</TableCell>
              <TableCell sx={{ ...cellSx, fontWeight: 700 }}>Suggested Qty</TableCell>
              <TableCell sx={{ ...cellSx, fontWeight: 700 }}>Batches Needed</TableCell>
              <TableCell sx={{ ...cellSx, fontWeight: 700 }}>Reason</TableCell>
              <TableCell sx={{ ...cellSx, fontWeight: 700 }}>Action</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={8} align="center">
                  <CircularProgress size={24} />
                </TableCell>
              </TableRow>
            ) : suggestions.length ? (
              suggestions.map((item, index) => (
                <TableRow key={index} hover>
                  <TableCell sx={{ ...cellSx, fontWeight: 600 }}>{item.recipe_name}</TableCell>
                  <TableCell sx={cellSx}>{item.stock_item_name}</TableCell>
                  <TableCell sx={cellSx}>{item.current_stock}</TableCell>
                  <TableCell sx={cellSx}>{item.demand}</TableCell>
                  <TableCell sx={cellSx}>{item.suggested_qty}</TableCell>
                  <TableCell sx={cellSx}>{item.batches_needed}</TableCell>
                  <TableCell sx={cellSx}>
                    <Chip label={item.reason} size="small" color={item.demand > item.current_stock ? "error" : "success"} variant="outlined" />
                  </TableCell>
                  <TableCell sx={cellSx}>
                    <Button variant="contained" size="small" onClick={() => handleProduce(item.recipe_id, item.suggested_qty)} disabled={item.suggested_qty <= 0} sx={{ fontSize: { xs: "0.7rem", sm: "0.75rem" } }}>
                      Produce
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={8} align="center" sx={{ ...cellSx, py: 3 }}>No pending production items.</TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>

      <Card sx={{ maxWidth: 400 }}>
        <CardContent>
          <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1 }}>Quick Forecast</Typography>
          <Typography variant="caption" color="text.secondary" sx={{ display: "block", mb: 1 }}>Based on last 30 days</Typography>
          {isLoading ? <Box sx={{ display: "flex", justifyContent: "center", py: 2 }}><CircularProgress size={20} /></Box> : suggestions.slice(0, 5).map((item, index) => (
            <Box key={index} sx={{ display: "flex", justifyContent: "space-between", py: 0.5, borderBottom: "1px solid", borderColor: "divider" }}>
              <Typography variant="body2" sx={{ fontWeight: 500 }}>{item.recipe_name}</Typography>
              <Typography variant="body2" color="text.secondary">{item.demand} units</Typography>
            </Box>
          ))}
        </CardContent>
      </Card>
    </Box>
  );
};

export default ProductionScheduler;
