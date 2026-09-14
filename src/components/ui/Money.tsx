import { Typography } from "@mui/material";
import { formatMoney } from "../../utils/formatNumber";

type MoneyProps = {
  value: number | null | undefined;
  /** Shown when value is null/undefined or non-positive. */
  fallback?: string;
  /** When true and value > 0, render in error color with leading icon. */
  due?: boolean;
};

/** Consistent financial display: formatted + tabular numerals. */
export const Money = ({ value, fallback = "—", due }: MoneyProps) => {
  if (value == null || !(value > 0)) return <>{fallback}</>;
  if (due) {
    return (
      <Typography
        component="span"
        className="tnum"
        sx={{
          fontSize: "inherit",
          color: "error.main",
          fontWeight: 600,
          "&::before": { content: '"⚠ "', fontSize: "0.85em" },
        }}
      >
        {formatMoney(value)}
      </Typography>
    );
  }
  return (
    <Typography component="span" className="tnum" sx={{ fontSize: "inherit" }}>
      {formatMoney(value)}
    </Typography>
  );
};
