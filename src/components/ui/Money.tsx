import { Typography } from "@mui/material";
import { formatMoney } from "../../utils/formatNumber";

type MoneyProps = {
  value: number | null | undefined;
  /** Shown when value is null/undefined or non-positive. */
  fallback?: string;
};

/** Consistent financial display: formatted + tabular numerals. Values untouched. */
export const Money = ({ value, fallback = "—" }: MoneyProps) => {
  if (value == null || !(value > 0)) return <>{fallback}</>;
  return (
    <Typography component="span" className="tnum" sx={{ fontSize: "inherit" }}>
      {formatMoney(value)}
    </Typography>
  );
};
