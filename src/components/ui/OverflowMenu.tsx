import { IconButton, ListItemIcon, ListItemText, Menu, MenuItem, Tooltip } from "@mui/material";
import MoreVertRoundedIcon from "@mui/icons-material/MoreVertRounded";
import { useState } from "react";

export type OverflowAction = {
  label: string;
  icon?: React.ReactNode;
  onClick: () => void;
  /** Destructive items render in error color. */
  danger?: boolean;
  /** Tooltip shown on the icon button (e.g. "More actions"). */
  tooltip?: string;
};

type OverflowMenuProps = {
  actions: OverflowAction[];
  /** Accessible label for the trigger button. */
  ariaLabel?: string;
  /** Show a bordered/outlined trigger instead of plain. */
  outlined?: boolean;
};

export const OverflowMenu = ({ actions, ariaLabel = "More actions", outlined = false }: OverflowMenuProps) => {
  const [anchor, setAnchor] = useState<null | HTMLElement>(null);

  return (
    <>
      <Tooltip title={ariaLabel}>
        <IconButton
          aria-label={ariaLabel}
          aria-haspopup="menu"
          onClick={(e) => setAnchor(e.currentTarget)}
          size="small"
          sx={{
            minWidth: 44,
            minHeight: 44,
            ...(outlined && { border: 1, borderColor: "divider", borderRadius: 2 }),
          }}
        >
          <MoreVertRoundedIcon fontSize="small" />
        </IconButton>
      </Tooltip>
      <Menu anchorEl={anchor} open={!!anchor} onClose={() => setAnchor(null)}>
        {actions.map((action) => (
          <MenuItem
            key={action.label}
            onClick={() => { setAnchor(null); action.onClick(); }}
            sx={action.danger ? { color: "error.main" } : undefined}
          >
            {action.icon && <ListItemIcon sx={action.danger ? { color: "error.main" } : undefined}>{action.icon}</ListItemIcon>}
            <ListItemText primary={action.label} />
          </MenuItem>
        ))}
      </Menu>
    </>
  );
};
