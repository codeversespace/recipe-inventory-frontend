// src/components/Layout.tsx
import * as React from "react";
import {
  AppBar,
  Toolbar,
  IconButton,
  Typography,
  Drawer,
  List,
  ListItemButton,          // <-- use ListItemButton instead of ListItem
  ListItemIcon,
  ListItemText,
  CssBaseline,
  Divider,
  Box,
} from "@mui/material";
import {
  Menu as MenuIcon,
  Dashboard as DashboardIcon,
  Kitchen as KitchenIcon,
  ShoppingCart as ShoppingCartIcon,
  ReceiptLong as ReceiptIcon,
  Assessment as AssessmentIcon,
  People as PeopleIcon,
} from "@mui/icons-material";
import { useLocation, useNavigate } from "react-router-dom";

const drawerWidth = 240;

type NavItem = { text: string; icon: React.ReactNode; to: string };
const navItems: NavItem[] = [
  { text: "Dashboard", icon: <DashboardIcon />, to: "/" },
  { text: "Ingredients", icon: <KitchenIcon />, to: "/ingredients" },
  { text: "Purchases", icon: <ShoppingCartIcon />, to: "/purchases" },
  { text: "Recipes", icon: <ReceiptIcon />, to: "/recipes" },
  { text: "Production", icon: <AssessmentIcon />, to: "/production" },
  { text: "Inventory", icon: <AssessmentIcon />, to: "/inventory" },
  { text: "Customers & Sales", icon: <PeopleIcon />, to: "/customers-sales" },
];

export default function Layout({ children }: { children: React.ReactNode }) {
  const [mobileOpen, setMobileOpen] = React.useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  const drawer = (
    <div>
      <Toolbar>
        <Typography variant="h6" noWrap>
          Recipe‑Inventory
        </Typography>
      </Toolbar>
      <Divider />
      <List>
        {navItems.map((item) => (
          <ListItemButton
            key={item.text}
            selected={location.pathname === item.to}
            onClick={() => {
              navigate(item.to);
              setMobileOpen(false);
            }}
          >
            <ListItemIcon>{item.icon}</ListItemIcon>
            <ListItemText primary={item.text} />
          </ListItemButton>
        ))}
      </List>
    </div>
  );

  return (
    <Box sx={{ display: "flex" }}>
      <CssBaseline />
      {/* Top app bar */}
      <AppBar
        position="fixed"
        sx={{ zIndex: (theme) => theme.zIndex.drawer + 1 }}
      >
        <Toolbar>
          <IconButton
            color="inherit"
            edge="start"
            onClick={handleDrawerToggle}
            sx={{ mr: 2, display: { md: "none" } }}
          >
            <MenuIcon />
          </IconButton>
          <Typography variant="h6" noWrap component="div">
            Recipe‑Inventory
          </Typography>
        </Toolbar>
      </AppBar>

      {/* Drawer (mobile / desktop) */}
      <Box component="nav" sx={{ width: { md: drawerWidth }, flexShrink: { md: 0 } }}>
        {/* Mobile drawer */}
        <Drawer
          variant="temporary"
          open={mobileOpen}
          onClose={handleDrawerToggle}
          ModalProps={{ keepMounted: true }}
          sx={{
            display: { xs: "block", md: "none" },
            "& .MuiDrawer-paper": { boxSizing: "border-box", width: drawerWidth },
          }}
        >
          {drawer}
        </Drawer>

        {/* Desktop drawer */}
        <Drawer
          variant="permanent"
          sx={{
            display: { xs: "none", md: "block" },
            "& .MuiDrawer-paper": { boxSizing: "border-box", width: drawerWidth },
          }}
          open
        >
          {drawer}
        </Drawer>
      </Box>

      {/* Main content area */}
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          p: { xs: 1.5, sm: 3 },
          width: { md: `calc(100% - ${drawerWidth}px)` },
        }}
      >
        <Toolbar />
        {children}
      </Box>
    </Box>
  );
}
