import { Box, Typography } from "@mui/material";
import { formatMoney } from "../../utils/formatNumber";

export interface PurchaseRowProps {
  itemName: string;
  supplierName: string;
  quantity: number;
  unit: string;
  unitPrice: number;
  totalAmount: number;
  category: string;
  date: string;
  reference?: string;
  onClick?: () => void;
  actions?: React.ReactNode;
}

const catColors: Record<string, { bg: string; text: string }> = {
  raw_material: { bg: "grey.200", text: "text.secondary" },
  saleable_good: { bg: "primary.50", text: "primary.main" },
  packing_material: { bg: "warning.light", text: "warning.dark" },
};

const catLabels: Record<string, string> = {
  raw_material: "Raw",
  saleable_good: "Saleable",
  packing_material: "Packing",
};

export const PurchaseRow = ({ itemName, supplierName, quantity, unit, unitPrice, totalAmount, category, date, reference, onClick, actions }: PurchaseRowProps) => {
  const cat = catColors[category] || catColors.raw_material;
  const catLabel = catLabels[category] || category;

  return (
    <Box
      onClick={onClick}
      sx={{
        display: "flex",
        alignItems: "center",
        gap: 1.25,
        px: 1.5,
        py: 1,
        minHeight: 52,
        cursor: onClick ? "pointer" : "default",
        transition: "background-color 0.15s",
        "&:hover": onClick ? { bgcolor: "action.hover" } : undefined,
        "&:active": onClick ? { bgcolor: "action.selected" } : undefined,
      }}
    >
      <Box sx={{ flex: 1, minWidth: 0 }}>
        <Box sx={{ display: "flex", alignItems: "center", gap: 0.5, mb: 0.25 }}>
          <Typography variant="body2" sx={{ fontSize: { xs: "0.8rem", sm: "0.85rem" }, fontWeight: 500, lineHeight: 1.3 }} noWrap>{itemName}</Typography>
          <Box
            component="span"
            sx={{
              fontSize: "0.55rem",
              fontWeight: 700,
              letterSpacing: 0.3,
              px: 0.5,
              py: 0.15,
              borderRadius: 0.5,
              color: cat.text,
              bgcolor: cat.bg,
              lineHeight: 1.4,
              flexShrink: 0,
            }}
          >
            {catLabel}
          </Box>
        </Box>
        <Typography variant="caption" sx={{ fontSize: "0.68rem", color: "text.secondary", lineHeight: 1.3 }}>
          {supplierName} · {quantity} {unit} @ {formatMoney(unitPrice)}
          {reference ? ` · ${reference}` : ""}
        </Typography>
      </Box>

      <Box sx={{ textAlign: "right", flexShrink: 0 }}>
        <Typography variant="body2" sx={{ fontSize: { xs: "0.8rem", sm: "0.85rem" }, fontWeight: 600, lineHeight: 1.3 }} className="tnum">
          {formatMoney(totalAmount)}
        </Typography>
        <Typography variant="caption" sx={{ fontSize: "0.62rem", color: "text.secondary", lineHeight: 1.3 }}>
          {date}
        </Typography>
      </Box>

      {actions && (
        <Box sx={{ flexShrink: 0 }} onClick={(e) => e.stopPropagation()}>
          {actions}
        </Box>
      )}
    </Box>
  );
};
