// src/components/Layout.tsx
import * as React from "react";
import {
  AppBar,
  Toolbar,
  IconButton,
  Typography,
  Drawer,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  CssBaseline,
  Divider,
  Box,
  Button,
  BottomNavigation,
  BottomNavigationAction,
  Paper,
  useMediaQuery,
  useTheme,
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
  LocalShipping as SupplierIcon,
  Assignment as OrderIcon,
  Settings as SettingsIcon,
  ExpandLess as ExpandLessIcon,
  ExpandMore as ExpandMoreIcon,
  Factory as ProductionIcon,
  ViewQuilt as PackTypeIcon,
  CalendarMonth as SchedulerIcon,
  Science as ScienceIcon,
  MenuBook as RecipesIcon,
  Archive as PackingIcon,
} from "@mui/icons-material";
import { useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";

const drawerWidth = 240;

type Role = "super_admin" | "admin" | "manager" | "production" | "packing" | "inventory" | "sales" | "viewer";
type NavItem = { text: string; icon: React.ReactNode; to?: string; roles: Role[]; section?: string; children?: { text: string; to: string; roles: Role[] }[] };
const navItems: NavItem[] = [
  { text: "Dashboard", icon: <DashboardIcon />, to: "/", roles: ["super_admin", "admin", "manager", "viewer"], section: "Menu" },
  { text: "Purchases", icon: <ShoppingCartIcon />, to: "/purchases", roles: ["super_admin", "admin", "manager", "inventory"], section: "Supply" },
  { text: "Suppliers", icon: <SupplierIcon />, to: "/suppliers", roles: ["super_admin", "admin", "manager", "inventory"], section: "Supply" },
  { text: "Inventory", icon: <InventoryIcon />, to: "/inventory", roles: ["super_admin", "admin", "manager", "inventory"], section: "Supply" },
  { text: "Customers", icon: <PeopleIcon />, to: "/customers", roles: ["super_admin", "admin", "manager", "sales"], section: "Sales" },
  { text: "Sales", icon: <ReceiptIcon />, to: "/sales", roles: ["super_admin", "admin", "manager", "sales"], section: "Sales" },
  { text: "Orders", icon: <OrderIcon />, to: "/orders", roles: ["super_admin", "admin", "manager", "sales", "production"], section: "Sales" },
  { text: "Payments", icon: <PaymentsIcon />, to: "/payments", roles: ["super_admin", "admin", "manager", "sales", "inventory"], section: "Sales" },
  { text: "Recipes", icon: <RecipesIcon />, to: "/recipes", roles: ["super_admin", "admin", "manager"], section: "Production" },
  { text: "Production", icon: <ProductionIcon />, to: "/production", roles: ["super_admin", "admin", "manager", "production"], section: "Production" },
  { text: "Scheduler", icon: <SchedulerIcon />, to: "/production-scheduler", roles: ["super_admin", "admin", "manager", "production"], section: "Production" },
  { text: "Processing", icon: <ScienceIcon />, to: "/processing", roles: ["super_admin", "admin", "manager", "production"], section: "Production" },
  { text: "Employees", icon: <PeopleIcon />, to: "/employees", roles: ["super_admin", "admin", "manager"], section: "Staff" },
  { text: "Packing", icon: <PackingIcon />, to: "/packing", roles: ["super_admin", "admin", "manager", "packing"], section: "Production" },
  { text: "Pack types", icon: <PackTypeIcon />, to: "/pack-types", roles: ["super_admin", "admin", "manager"], section: "Production" },
  { text: "Admin", icon: <SettingsIcon />, roles: ["super_admin"], section: "Admin", children: [
    { text: "Admin settings", to: "/settings", roles: ["super_admin"] },
  ] },
];

type BottomTab = { label: string; icon: React.ReactNode; to: string };
const MORE_TAB: BottomTab = { label: "More", icon: <MenuIcon />, to: "__drawer__" };

/** Max 4 primary destinations + More, derived from the role's real permissions. */
const roleBottomNav = (role: Role | undefined): BottomTab[] => {
  switch (role) {
    case "inventory":
      return [
        { label: "Purchases", icon: <ShoppingCartIcon />, to: "/purchases" },
        { label: "Suppliers", icon: <SupplierIcon />, to: "/suppliers" },
        { label: "Stock", icon: <InventoryIcon />, to: "/inventory" },
        { label: "Pay", icon: <PaymentsIcon />, to: "/payments" },
      ];
    case "sales":
      return [
        { label: "Sales", icon: <ReceiptIcon />, to: "/sales" },
        { label: "Customers", icon: <PeopleIcon />, to: "/customers" },
        { label: "Orders", icon: <OrderIcon />, to: "/orders" },
        { label: "Pay", icon: <PaymentsIcon />, to: "/payments" },
      ];
    case "production":
      return [
        { label: "Produce", icon: <ProductionIcon />, to: "/production" },
        { label: "Process", icon: <ScienceIcon />, to: "/processing" },
        { label: "Staff", icon: <PeopleIcon />, to: "/employees" },
      ];
    case "packing":
      return [{ label: "Packing", icon: <PackingIcon />, to: "/packing" }];
    case "viewer":
      return [{ label: "Home", icon: <DashboardIcon />, to: "/" }];
    default:
      return [
        { label: "Home", icon: <DashboardIcon />, to: "/" },
        { label: "Purchases", icon: <ShoppingCartIcon />, to: "/purchases" },
        { label: "Stock", icon: <InventoryIcon />, to: "/inventory" },
        { label: "Sales", icon: <ReceiptIcon />, to: "/sales" },
      ];
  }
};

export default function Layout({ children }: { children: React.ReactNode }) {
  const { user, logout } = useAuth();
  const [mobileOpen, setMobileOpen] = React.useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const [settingsOpen, setSettingsOpen] = React.useState(false);
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));
  const canAccess = (roles: Role[]) => Boolean(user?.role && roles.includes(user.role as Role));
  const visibleNavItems = navItems.filter((item) => canAccess(item.roles));

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  const handleBottomNavChange = (_: any, newValue: string) => {
    if (newValue === "__drawer__") {
      setMobileOpen(true);
    } else {
      navigate(newValue);
    }
  };

  const drawer = (
    <div>
      <Toolbar sx={{ minHeight: { xs: 56, sm: 64 } }}>
        <Typography variant="h6" noWrap sx={{ fontSize: { xs: "0.95rem", sm: "1.1rem" } }}>
          Recipe Inventory
        </Typography>
      </Toolbar>
      <Divider />
      <List sx={{ px: 0.5 }}>
        {(() => {
          let lastSection = "";
          return visibleNavItems.flatMap((item) => {
            const elements: React.ReactNode[] = [];
            if (item.section && item.section !== lastSection) {
              lastSection = item.section;
              elements.push(
                <Typography key={`section-${item.section}`} variant="caption" sx={{ display: "block", px: 2, pt: 2, pb: 0.5, fontSize: "0.65rem", fontWeight: 700, color: "text.secondary", letterSpacing: 1, textTransform: "uppercase" }}>
                  {item.section}
                </Typography>
              );
            }
            if (item.children) {
              elements.push(
                <React.Fragment key={item.text}>
                  <ListItemButton onClick={() => setSettingsOpen((open) => !open)} sx={{ borderRadius: 2, mb: 0.5, minHeight: 40 }}>
                    <ListItemIcon sx={{ minWidth: 36 }}>{item.icon}</ListItemIcon>
                    <ListItemText primary={item.text} slotProps={{ primary: { sx: { fontSize: "0.85rem" } } }} />
                    {settingsOpen ? <ExpandLessIcon /> : <ExpandMoreIcon />}
                  </ListItemButton>
                  {settingsOpen && item.children.filter((child) => canAccess(child.roles)).map((child) => (
                    <ListItemButton key={child.to} selected={location.pathname === child.to} sx={{ pl: 7, borderRadius: 2, mb: 0.5, minHeight: 36 }} onClick={() => { navigate(child.to); setMobileOpen(false); }}>
                      <ListItemText primary={child.text} slotProps={{ primary: { sx: { fontSize: "0.8rem" } } }} />
                    </ListItemButton>
                  ))}
                </React.Fragment>
              );
            } else {
              elements.push(
                <ListItemButton key={item.text} selected={location.pathname === item.to} sx={{ borderRadius: 2, mb: 0.5, minHeight: 40 }} onClick={() => { navigate(item.to || "/"); setMobileOpen(false); }}>
                  <ListItemIcon sx={{ minWidth: 36 }}>{item.icon}</ListItemIcon>
                  <ListItemText primary={item.text} slotProps={{ primary: { sx: { fontSize: "0.85rem" } } }} />
                </ListItemButton>
              );
            }
            return elements;
          });
        })()}
      </List>
      <Divider sx={{ my: 1 }} />
      <Box sx={{ px: 2, py: 1 }}>
        <Button fullWidth variant="outlined" color="error" size="small" onClick={() => { logout(); setMobileOpen(false); }}>Logout</Button>
      </Box>
    </div>
  );

  const bottomNavItems = [...roleBottomNav(user?.role as Role | undefined), MORE_TAB];
  const currentBottomNav = bottomNavItems.find((item) => item.to !== "__drawer__" && location.pathname === item.to);

  return (
    <Box sx={{ display: "flex" }}>
      <CssBaseline />
      {/* Top app bar */}
      <AppBar
        position="fixed"
        sx={{ zIndex: (theme) => theme.zIndex.drawer + 1 }}
      >
        <Toolbar sx={{ minHeight: { xs: 52, sm: 64 }, px: { xs: 1, sm: 2 } }}>
          <IconButton
            color="inherit"
            edge="start"
            onClick={handleDrawerToggle}
            sx={{ mr: 1, display: { md: "none" }, p: { xs: 1, sm: 1.5 } }}
          >
            <MenuIcon />
          </IconButton>
          <Typography variant="h6" noWrap component="div" sx={{ fontSize: { xs: "0.95rem", sm: "1.25rem" }, fontWeight: 700, flexGrow: 1 }}>
            Recipe Inventory
          </Typography>
          <Typography variant="body2" sx={{ mr: 1, display: { xs: "none", sm: "block" }, fontSize: "0.8rem" }}>{user?.username}</Typography>
          <Button color="inherit" size="small" onClick={logout} sx={{ display: { xs: "none", sm: "inline-flex" }, fontSize: "0.8rem" }}>Logout</Button>
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
            "& .MuiDrawer-paper": {
              boxSizing: "border-box",
              width: drawerWidth,
              // Scroll containment: drawer content scrolls natively, but hitting
              // its top/bottom boundary must not chain scroll to the page behind
              // (iOS rubber-band scroll leak). Scoped to the temporary drawer only.
              overflowY: "auto",
              overscrollBehavior: "contain",
              WebkitOverflowScrolling: "touch",
            },
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
          p: { xs: 1, sm: 2, md: 3 },
          width: { md: `calc(100% - ${drawerWidth}px)` },
          minWidth: 0,
          overflowX: "hidden",
          pb: { xs: "calc(72px + env(safe-area-inset-bottom))", sm: 3 },
        }}
      >
        <Toolbar sx={{ minHeight: { xs: 52, sm: 64 } }} />
        {children}
      </Box>

      {/* Bottom navigation for mobile */}
      {isMobile && (
        <Paper
          elevation={3}
          data-bottom-nav
          sx={{
            position: "fixed",
            bottom: 0,
            left: 0,
            right: 0,
            zIndex: (theme) => theme.zIndex.drawer + 2,
            borderTop: 1,
            borderColor: "divider",
            paddingBottom: "env(safe-area-inset-bottom)",
          }}
        >
          <BottomNavigation
            showLabels
            value={currentBottomNav ? currentBottomNav.to : false}
            onChange={handleBottomNavChange}
            sx={{ height: 72, "& .MuiBottomNavigationAction-root": { minWidth: "auto", py: 1, fontSize: "0.65rem", "&.Mui-selected": { color: "primary.main" } } }}
          >
            {bottomNavItems.map((item) => (
              <BottomNavigationAction key={item.label} label={item.label} icon={item.icon} value={item.to} />
            ))}
          </BottomNavigation>
        </Paper>
      )}
    </Box>
  );
}
