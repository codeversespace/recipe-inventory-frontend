import { Box, IconButton, Popover, Typography } from "@mui/material";
import InfoOutlinedIcon from "@mui/icons-material/InfoOutlined";
import { useState } from "react";

interface InfoTipProps {
  title: string;
  description: string;
  example?: string;
  size?: "small" | "medium";
}

/** Tap/click-to-open info popover. Works identically on touch screens
 *  and desktops (hover-only tooltips don't fire reliably on mobile). */
export const InfoTip = ({ title, description, example, size = "small" }: InfoTipProps) => {
  const [anchor, setAnchor] = useState<HTMLElement | null>(null);
  const open = Boolean(anchor);

  return (
    <>
      <IconButton
        size="small"
        aria-label={`About ${title}`}
        onClick={(e) => { e.stopPropagation(); setAnchor(e.currentTarget); }}
        sx={{ p: 0.25, ml: 0.25, color: "text.secondary", verticalAlign: "middle", minWidth: 0, minHeight: 0 }}
      >
        <InfoOutlinedIcon sx={{ fontSize: size === "small" ? "0.95rem" : "1.15rem" }} />
      </IconButton>
      <Popover
        open={open}
        anchorEl={anchor}
        onClose={() => setAnchor(null)}
        anchorOrigin={{ vertical: "bottom", horizontal: "left" }}
        transformOrigin={{ vertical: "top", horizontal: "left" }}
        slotProps={{ paper: { sx: { maxWidth: 300, p: 2 } } }}
      >
        <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 0.5 }}>{title}</Typography>
        <Typography variant="body2" color="text.secondary">{description}</Typography>
        {example && (
          <Box sx={{ mt: 1, p: 1, borderRadius: 1, bgcolor: "action.hover" }}>
            <Typography variant="caption" sx={{ fontWeight: 700, display: "block" }}>Example</Typography>
            <Typography variant="body2">{example}</Typography>
          </Box>
        )}
      </Popover>
    </>
  );
};
