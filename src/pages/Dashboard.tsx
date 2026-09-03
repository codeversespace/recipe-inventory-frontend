// src/pages/Dashboard.tsx
import {
  Box,
  Card,
  CardContent,
  Stack,                     // <-- new import
  Typography,
  CircularProgress,
} from "@mui/material";
import { useBatches, useInventory } from "../hooks/useApi";

export const Dashboard = () => {
  const { data: batches=[], isLoading } = useBatches(5);
  const { data: inventory = [] } = useInventory();
  const lowStock = inventory.filter((item: any) => item.is_low_stock);

  const totalProfit = batches?.reduce((sum: number, b: any) => sum + (b.profit ?? 0), 0) ?? 0;
  const totalRevenue = batches?.reduce((sum: number, b: any) => sum + (b.total_revenue ?? 0), 0) ?? 0;
  const marginOverall = totalRevenue ? (totalProfit / totalRevenue) * 100 : 0;

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        Dashboard
      </Typography>

      {isLoading ? (
        <CircularProgress />
      ) : (
        <Stack spacing={3} direction={{ xs: "column", md: "row" }}>
          <Card sx={{ flex: 1, bgcolor: "#e8f5e9" }}>
            <CardContent>
              <Typography variant="h6">Profit (last 5 batches)</Typography>
              <Typography variant="h4" color="green">
                ₹{totalProfit.toFixed(2)}
              </Typography>
            </CardContent>
          </Card>

          <Card sx={{ flex: 1, bgcolor: "#e3f2fd" }}>
            <CardContent>
              <Typography variant="h6">Margin % (last 5 batches)</Typography>
              <Typography variant="h4" color="primary">
                {marginOverall.toFixed(2)}%
              </Typography>
            </CardContent>
          </Card>

          <Card sx={{ flex: 1, bgcolor: "#fff3e0" }}>
            <CardContent>
              <Typography variant="h6">Batches recorded</Typography>
              <Typography variant="h4">{batches?.length ?? 0}</Typography>
            </CardContent>
          </Card>
          <Card sx={{ flex: 1, bgcolor: lowStock.length ? "#ffebee" : "#e8f5e9" }}>
            <CardContent>
              <Typography variant="h6">Low-stock alerts</Typography>
              <Typography variant="h4" color={lowStock.length ? "error" : "success"}>{lowStock.length}</Typography>
              {lowStock.slice(0, 3).map((item: any) => <Typography key={item.id} variant="body2">{item.name}: {item.on_hand_qty} / {item.min_stock} {item.base_unit}</Typography>)}
            </CardContent>
          </Card>
        </Stack>
      )}
    </Box>
  );
};
