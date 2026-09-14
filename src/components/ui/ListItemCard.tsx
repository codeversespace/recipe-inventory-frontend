import { Box, Card, CardContent, IconButton, Collapse, Typography } from "@mui/material";
import { ExpandMore as ExpandIcon, ExpandLess as CollapseIcon } from "@mui/icons-material";
import { useState, type ReactNode } from "react";
import { StatusChip, type StatusKind } from "./StatusChip";

type MetaItem = { label: string; value: ReactNode };

type ListItemCardProps = {
  title: string;
  subtitle?: string;
  primaryValue: ReactNode;
  status?: { kind: StatusKind; label: ReactNode };
  meta?: MetaItem[];
  actions?: ReactNode;
  onClick?: () => void;
};

export const ListItemCard = ({ title, subtitle, primaryValue, status, meta, actions, onClick }: ListItemCardProps) => {
  const [expanded, setExpanded] = useState(false);
  const hasMeta = meta && meta.length > 0;

  return (
    <Card
      onClick={onClick}
      sx={{
        cursor: onClick ? "pointer" : undefined,
        transition: "border-color 0.15s",
        "&:hover": onClick ? { borderColor: "primary.main" } : undefined,
      }}
    >
      <CardContent sx={{ p: { xs: 1.25, sm: 1.5 }, "&:last-child": { pb: { xs: 1.25, sm: 1.5 } } }}>
        {/* Row 1: title + status */}
        <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 0.5 }}>
          <Typography variant="body2" sx={{ fontWeight: 600, fontSize: { xs: "0.85rem", sm: "0.9rem" }, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: "70%" }}>
            {title}
          </Typography>
          <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
            {status && <StatusChip status={status.kind} label={status.label} />}
            {hasMeta && (
              <IconButton size="small" onClick={(e) => { e.stopPropagation(); setExpanded((v) => !v); }} sx={{ p: 0.25, minWidth: 32, minHeight: 32 }}>
                {expanded ? <CollapseIcon sx={{ fontSize: "1rem" }} /> : <ExpandIcon sx={{ fontSize: "1rem" }} />}
              </IconButton>
            )}
            {actions}
          </Box>
        </Box>

        {/* Row 2: subtitle */}
        {subtitle && (
          <Typography variant="caption" color="text.secondary" sx={{ display: "block", mb: 0.25, fontSize: { xs: "0.7rem", sm: "0.75rem" } }}>
            {subtitle}
          </Typography>
        )}

        {/* Row 3: primary value (largest element) */}
        <Box sx={{ fontSize: { xs: "1rem", sm: "1.15rem" }, fontWeight: 700, lineHeight: 1.3 }}>
          {primaryValue}
        </Box>

        {/* Expanded meta */}
        {hasMeta && (
          <Collapse in={expanded} timeout="auto">
            <Box sx={{ mt: 1, pt: 1, borderTop: 1, borderColor: "divider", display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 0.5 }}>
              {meta!.map((item) => (
                <Box key={item.label}>
                  <Typography variant="caption" color="text.secondary" sx={{ fontSize: "0.65rem" }}>{item.label}</Typography>
                  <Typography variant="body2" sx={{ fontSize: "0.75rem", fontWeight: 500 }}>{item.value}</Typography>
                </Box>
              ))}
            </Box>
          </Collapse>
        )}
      </CardContent>
    </Card>
  );
};
