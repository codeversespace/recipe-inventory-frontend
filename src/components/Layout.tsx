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
  Button,
} from "@mui/material";
import {
  Menu as MenuIcon,
  Dashboard as DashboardIcon,
  ShoppingCart as ShoppingCartIcon,
  ReceiptLong as ReceiptIcon,
  Assessment as AssessmentIcon,
  People as PeopleIcon,
  Inventory as InventoryIcon,
  Payments as PaymentsIcon,
  Settings as SettingsIcon,
  ExpandLess as ExpandLessIcon,
  ExpandMore as ExpandMoreIcon,
} from "@mui/icons-material";
import { useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";

const drawerWidth = 240;

type Role = "super_admin" | "admin" | "manager" | "production" | "packing" | "inventory" | "sales" | "viewer";
type NavItem = { text: string; icon: React.ReactNode; to?: string; roles: Role[]; children?: { text: string; to: string; roles: Role[] }[] };
const navItems: NavItem[] = [
  { text: "Dashboard", icon: <DashboardIcon />, to: "/", roles: ["super_admin", "admin", "manager", "viewer"] },
  { text: "Purchases", icon: <ShoppingCartIcon />, to: "/purchases", roles: ["super_admin", "admin", "manager", "inventory"] },
  { text: "Recipes", icon: <ReceiptIcon />, to: "/recipes", roles: ["super_admin", "admin", "manager"] },
  { text: "Production", icon: <AssessmentIcon />, to: "/production", roles: ["super_admin", "admin", "manager", "production"] },
  { text: "Inventory", icon: <AssessmentIcon />, to: "/inventory", roles: ["super_admin", "admin", "manager", "inventory"] },
  { text: "Customers", icon: <PeopleIcon />, to: "/customers", roles: ["super_admin", "admin", "manager", "sales"] },
  { text: "Sales", icon: <ReceiptIcon />, to: "/sales", roles: ["super_admin", "admin", "manager", "sales"] },
  { text: "Packing", icon: <InventoryIcon />, to: "/packing", roles: ["super_admin", "admin", "manager", "packing"] },
  { text: "Payments", icon: <PaymentsIcon />, to: "/payments", roles: ["super_admin", "admin", "manager", "sales"] },
  { text: "Settings", icon: <SettingsIcon />, roles: ["super_admin", "admin", "manager"], children: [
    { text: "Pack types", to: "/pack-types", roles: ["super_admin", "admin", "manager"] },
    { text: "Admin settings", to: "/settings", roles: ["super_admin"] },
  ] },
];

export default function Layout({ children }: { children: React.ReactNode }) {
  const { user, logout } = useAuth();
  const [mobileOpen, setMobileOpen] = React.useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const [settingsOpen, setSettingsOpen] = React.useState(false);
  const canAccess = (roles: Role[]) => Boolean(user?.role && roles.includes(user.role as Role));
  const visibleNavItems = navItems.filter((item) => canAccess(item.roles));

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
        {visibleNavItems.map((item) => item.children ? <React.Fragment key={item.text}><ListItemButton onClick={() => setSettingsOpen((open) => !open)}><ListItemIcon>{item.icon}</ListItemIcon><ListItemText primary={item.text} />{settingsOpen ? <ExpandLessIcon /> : <ExpandMoreIcon />}</ListItemButton>{settingsOpen && item.children.filter((child) => canAccess(child.roles)).map((child) => <ListItemButton key={child.to} selected={location.pathname === child.to} sx={{ pl: 7 }} onClick={() => { navigate(child.to); setMobileOpen(false); }}><ListItemText primary={child.text} /></ListItemButton>)}</React.Fragment> : <ListItemButton key={item.text} selected={location.pathname === item.to} onClick={() => { navigate(item.to || "/"); setMobileOpen(false); }}><ListItemIcon>{item.icon}</ListItemIcon><ListItemText primary={item.text} /></ListItemButton>)}
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
          <Typography variant="h6" noWrap component="div" sx={{ fontSize: { xs: "1rem", sm: "1.25rem" }, fontWeight: 800, flexGrow: 1 }}>
            Recipe‑Inventory
          </Typography>
          <Typography variant="body2" sx={{ mr: 1 }}>{user?.username}</Typography>
          <Button color="inherit" size="small" onClick={logout}>Logout</Button>
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
          minWidth: 0,
          overflowX: "hidden",
        }}
      >
        <Toolbar />
        {children}
      </Box>
    </Box>
  );
}
