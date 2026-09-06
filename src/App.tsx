// src/App.tsx
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import type { ReactNode } from "react";
import Layout from "./components/Layout";

import { Dashboard } from "./pages/Dashboard";
import { Purchases } from "./pages/Purchases";
import { Recipes } from "./pages/Recipes";
import { Production } from "./pages/Production";
import { Inventory } from "./pages/Inventory";
import { CustomersSales } from "./pages/CustomersSales";
import { CustomerProfile } from "./pages/CustomerProfile";
import { Packing } from "./pages/Packing";
import { Payments } from "./pages/Payments";
import { Settings } from "./pages/Settings";
import { PackTypes } from "./pages/PackTypes";
import { Suppliers } from "./pages/Suppliers";
import { Orders } from "./pages/Orders";
import { Processing } from "./pages/Processing";
import { ProductionScheduler } from "./pages/ProductionScheduler";
import { Login } from "./pages/Login";
import { useAuth } from "./auth/AuthContext";

type Role = "super_admin" | "admin" | "manager" | "production" | "packing" | "inventory" | "sales" | "viewer";

const roleHome: Record<Role, string> = {
  super_admin: "/",
  admin: "/",
  manager: "/",
  production: "/production",
  packing: "/packing",
  inventory: "/inventory",
  sales: "/sales",
  viewer: "/",
};

function RoleRoute({ roles, children }: { roles: Role[]; children: ReactNode }) {
  const { user } = useAuth();
  const role = user?.role as Role | undefined;
  return role && roles.includes(role) ? <>{children}</> : <Navigate to={role ? roleHome[role] : "/"} replace />;
}

function App() {
  const { user, loading } = useAuth();
  if (loading) return null;
  if (!user) return <Login />;
  return (
    <Router>
        <Layout>
          <Routes>
            <Route path="/" element={<RoleRoute roles={["super_admin", "admin", "manager", "viewer"]}><Dashboard /></RoleRoute>} />
            <Route path="/purchases" element={<RoleRoute roles={["super_admin", "admin", "manager", "inventory"]}><Purchases /></RoleRoute>} />
            <Route path="/suppliers" element={<RoleRoute roles={["super_admin", "admin", "manager", "inventory"]}><Suppliers /></RoleRoute>} />
            <Route path="/recipes" element={<RoleRoute roles={["super_admin", "admin", "manager"]}><Recipes /></RoleRoute>} />
            <Route path="/production" element={<RoleRoute roles={["super_admin", "admin", "manager", "production"]}><Production /></RoleRoute>} />
            <Route path="/inventory" element={<RoleRoute roles={["super_admin", "admin", "manager", "inventory"]}><Inventory /></RoleRoute>} />
            <Route path="/customers" element={<RoleRoute roles={["super_admin", "admin", "manager", "sales"]}><CustomersSales /></RoleRoute>} />
            <Route path="/sales" element={<RoleRoute roles={["super_admin", "admin", "manager", "sales"]}><CustomersSales /></RoleRoute>} />
            <Route path="/customers/:id" element={<RoleRoute roles={["super_admin", "admin", "manager", "sales"]}><CustomerProfile /></RoleRoute>} />
            <Route path="/packing" element={<RoleRoute roles={["super_admin", "admin", "manager", "packing"]}><Packing /></RoleRoute>} />
            <Route path="/payments" element={<RoleRoute roles={["super_admin", "admin", "manager", "sales", "inventory"]}><Payments /></RoleRoute>} />
            <Route path="/orders" element={<RoleRoute roles={["super_admin", "admin", "manager", "sales", "production"]}><Orders /></RoleRoute>} />
            <Route path="/processing" element={<RoleRoute roles={["super_admin", "admin", "manager", "production"]}><Processing /></RoleRoute>} />
            <Route path="/production-scheduler" element={<RoleRoute roles={["super_admin", "admin", "manager", "production"]}><ProductionScheduler /></RoleRoute>} />
            <Route path="/pack-types" element={<RoleRoute roles={["super_admin", "admin", "manager"]}><PackTypes /></RoleRoute>} />
            <Route path="/settings" element={<RoleRoute roles={["super_admin"]}><Settings /></RoleRoute>} />
          </Routes>
        </Layout>
      </Router>
  );
}

export default App;
