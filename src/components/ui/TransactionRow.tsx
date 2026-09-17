import { Avatar, Box, Typography } from "@mui/material";
import { formatMoney } from "../../utils/formatNumber";

export interface TransactionRowProps {
  name: string;
  invoiceNumber?: number | string;
  reference?: string;
  date: string;
  totalAmount: number;
  amountDue: number;
  status: "PAID" | "PARTIAL" | "PENDING" | "DUE";
  onClick?: () => void;
}

const statusColors: Record<string, { bg: string; text: string }> = {
  PAID: { bg: "success.light", text: "success.main" },
  PARTIAL: { bg: "warning.light", text: "warning.main" },
  PENDING: { bg: "warning.light", text: "warning.main" },
  DUE: { bg: "error.light", text: "error.main" },
};

const statusLabels: Record<string, string> = {
  PAID: "Paid",
  PARTIAL: "Partial",
  PENDING: "Pending",
  DUE: "Pending",
};

export const TransactionRow = ({ name, invoiceNumber, reference, date, totalAmount, amountDue, status, onClick }: TransactionRowProps) => {
  const colors = statusColors[status] || statusColors.PENDING;
  const label = statusLabels[status] || "Pending";
  const initial = (name || "?")[0].toUpperCase();

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
      <Avatar
        sx={{
          width: 32,
          height: 32,
          fontSize: "0.8rem",
          fontWeight: 700,
          bgcolor: colors.bg,
          color: colors.text,
        }}
      >
        {initial}
      </Avatar>

      <Box sx={{ flex: 1, minWidth: 0 }}>
        <Typography
          variant="body2"
          sx={{ fontSize: { xs: "0.8rem", sm: "0.85rem" }, fontWeight: 500, lineHeight: 1.3 }}
          noWrap
        >
          {invoiceNumber != null && `#${invoiceNumber}`}
          {invoiceNumber != null && reference ? ` ${reference}` : invoiceNumber != null ? " " : ""}
          {name}
        </Typography>
        <Typography variant="caption" sx={{ fontSize: "0.7rem", color: amountDue > 0 ? "error.main" : "text.secondary", lineHeight: 1.3 }}>
          {amountDue > 0 ? `Due ${formatMoney(amountDue)}` : date}
        </Typography>
      </Box>

      <Box sx={{ textAlign: "right", flexShrink: 0 }}>
        <Typography variant="body2" sx={{ fontSize: { xs: "0.8rem", sm: "0.85rem" }, fontWeight: 600, lineHeight: 1.3 }} className="tnum">
          {formatMoney(totalAmount)}
        </Typography>
        <Typography variant="caption" sx={{ fontSize: "0.65rem", color: colors.text, fontWeight: 600, lineHeight: 1.3 }}>
          {label}
        </Typography>
      </Box>
    </Box>
  );
};
