import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ThemeProvider, createTheme } from "@mui/material/styles";
import { ThemeModeProvider, useThemeMode } from "./contexts/ThemeModeContext";
import CssBaseline from "@mui/material/CssBaseline";
import "./index.css";
import { AuthProvider } from "./auth/AuthContext";

const queryClient = new QueryClient();

const sharedComponents = {
  MuiButton: { styleOverrides: { root: { borderRadius: 8 } } },
  MuiOutlinedInput: { styleOverrides: { root: { borderRadius: 8 }, input: { fontSize: "1rem" } } },
  MuiInputBase: { styleOverrides: { input: { fontSize: "1rem" } } },
  MuiSelect: { styleOverrides: { select: { fontSize: "1rem" } } },
  MuiAutocomplete: { styleOverrides: { inputRoot: { fontSize: "1rem" } } },
  MuiChip: { styleOverrides: { root: { borderRadius: 6 } } },
};

const darkTheme = createTheme({
  palette: {
    mode: "dark",
    primary: { main: "#0f766e" },
    secondary: { main: "#f97316" },
    background: { default: "#0a0a0a", paper: "#141414" },
    text: { primary: "#e5e5e5", secondary: "#a0a0a0" },
    error: { main: "#ef4444", light: "#3d1a1a" },
    success: { main: "#22c55e", light: "#0d2e1a" },
    warning: { main: "#f59e0b", light: "#2e2206" },
    info: { main: "#3b82f6", light: "#0f1a2e" },
    grey: { 50: "#1a1a1a", 100: "#222222", 200: "#2a2a2a", 300: "#333333", 400: "#555555", 500: "#737373", 600: "#999999", 700: "#b3b3b3", 800: "#cccccc", 900: "#e5e5e5" },
    divider: "#262626",
  },
  shape: { borderRadius: 12 },
  typography: { fontFamily: "Inter, ui-sans-serif, system-ui, sans-serif", h4: { letterSpacing: "-0.04em" }, button: { fontWeight: 700, textTransform: "none" } },
  components: {
    ...sharedComponents,
    MuiCssBaseline: { styleOverrides: { body: { backgroundColor: "#0a0a0a" } } },
    MuiPaper: { styleOverrides: { root: { boxShadow: "none", backgroundImage: "none", backgroundColor: "#141414", borderColor: "#262626", borderWidth: 1, borderStyle: "solid" } } },
    MuiCard: { styleOverrides: { root: { boxShadow: "none", backgroundImage: "none", backgroundColor: "#141414", borderColor: "#262626", borderWidth: 1, borderStyle: "solid" } } },
    MuiTableCell: { styleOverrides: { head: { fontWeight: 750, color: "#a0a0a0", background: "#1a1a1a", borderColor: "#262626" }, body: { borderColor: "#262626" } } },
    MuiTableRow: { styleOverrides: { root: { borderColor: "#262626" } } },
    MuiAppBar: { styleOverrides: { root: { boxShadow: "none", backgroundImage: "none", backgroundColor: "#141414", borderBottom: "1px solid #262626" } } },
    MuiDrawer: { styleOverrides: { paper: { backgroundColor: "#141414", borderRight: "1px solid #262626", backgroundImage: "none" } } },
    MuiDialog: { styleOverrides: { paper: { backgroundColor: "#1a1a1a", backgroundImage: "none" } } },
    MuiTab: { styleOverrides: { root: { color: "#a0a0a0" } } },
    MuiBottomNavigation: { styleOverrides: { root: { backgroundColor: "#141414", borderTop: "1px solid #262626" } } },
    MuiBottomNavigationAction: { styleOverrides: { root: { color: "#737373" }, selected: { color: "#e5e5e5" } } },
  },
});

const lightTheme = createTheme({
  palette: {
    mode: "light",
    primary: { main: "#0f766e" },
    secondary: { main: "#c2540a" },
    background: { default: "#f7f7f5", paper: "#ffffff" },
    text: { primary: "#171717", secondary: "#5c5c5c" },
    error: { main: "#dc2626", light: "#fee2e2" },
    success: { main: "#16a34a", light: "#dcfce7" },
    warning: { main: "#d97706", light: "#fef3c7" },
    info: { main: "#2563eb", light: "#dbeafe" },
    grey: { 50: "#fafafa", 100: "#f2f2f0", 200: "#e8e8e5", 300: "#d9d9d5", 400: "#b3b3ad", 500: "#8a8a83", 600: "#666660", 700: "#4d4d47", 800: "#33332f", 900: "#1a1a17" },
    divider: "#e5e5e2",
  },
  shape: { borderRadius: 12 },
  typography: { fontFamily: "Inter, ui-sans-serif, system-ui, sans-serif", h4: { letterSpacing: "-0.04em" }, button: { fontWeight: 700, textTransform: "none" } },
  components: {
    ...sharedComponents,
    MuiCssBaseline: { styleOverrides: { body: { backgroundColor: "#f7f7f5" } } },
    MuiPaper: { styleOverrides: { root: { boxShadow: "none", backgroundImage: "none", backgroundColor: "#ffffff", borderColor: "#e5e5e2", borderWidth: 1, borderStyle: "solid" } } },
    MuiCard: { styleOverrides: { root: { boxShadow: "none", backgroundImage: "none", backgroundColor: "#ffffff", borderColor: "#e5e5e2", borderWidth: 1, borderStyle: "solid" } } },
    MuiTableCell: { styleOverrides: { head: { fontWeight: 750, color: "#5c5c5c", background: "#f2f2f0", borderColor: "#e5e5e2" }, body: { borderColor: "#e5e5e2" } } },
    MuiTableRow: { styleOverrides: { root: { borderColor: "#e5e5e2" } } },
    MuiAppBar: { styleOverrides: { root: { boxShadow: "none", backgroundImage: "none", backgroundColor: "#ffffff", borderBottom: "1px solid #e5e5e2", color: "#171717" } } },
    MuiDrawer: { styleOverrides: { paper: { backgroundColor: "#ffffff", borderRight: "1px solid #e5e5e2", backgroundImage: "none" } } },
    MuiDialog: { styleOverrides: { paper: { backgroundColor: "#ffffff", backgroundImage: "none" } } },
    MuiTab: { styleOverrides: { root: { color: "#5c5c5c" } } },
    MuiBottomNavigation: { styleOverrides: { root: { backgroundColor: "#ffffff", borderTop: "1px solid #e5e5e2" } } },
    MuiBottomNavigationAction: { styleOverrides: { root: { color: "#8a8a83" }, selected: { color: "#171717" } } },
  },
});

const ThemeAwareApp = () => {
  const { mode } = useThemeMode();
  return (
    <ThemeProvider theme={mode === "dark" ? darkTheme : lightTheme}>
      <CssBaseline />
      <App />
    </ThemeProvider>
  );
};

ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
  <React.StrictMode>
    <ThemeModeProvider>
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <ThemeAwareApp />
        </AuthProvider>
      </QueryClientProvider>
    </ThemeModeProvider>
  </React.StrictMode>
);
