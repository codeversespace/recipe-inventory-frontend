// src/index.tsx
import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ThemeProvider, createTheme } from "@mui/material/styles";
import "./index.css";
import { AuthProvider } from "./auth/AuthContext";

const queryClient = new QueryClient();
const theme = createTheme({
  palette: { primary: { main: "#0f766e" }, secondary: { main: "#f97316" }, background: { default: "#f6f8fb", paper: "#ffffff" } },
  shape: { borderRadius: 12 },
  typography: { fontFamily: "Inter, ui-sans-serif, system-ui, sans-serif", h4: { letterSpacing: "-0.04em" }, button: { fontWeight: 700, textTransform: "none" } },
  components: { MuiPaper: { styleOverrides: { root: { boxShadow: "0 2px 12px rgba(15, 23, 42, .06)" } } }, MuiTableCell: { styleOverrides: { head: { fontWeight: 750, color: "#475569", background: "#f8fafc" } } } },
});

ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
  <React.StrictMode>
    <ThemeProvider theme={theme}><QueryClientProvider client={queryClient}>
      <AuthProvider><App /></AuthProvider>
    </QueryClientProvider></ThemeProvider>
  </React.StrictMode>
);
