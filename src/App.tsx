// src/App.tsx
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Layout from "./components/Layout";

import { Dashboard } from "./pages/Dashboard";
import { Ingredients } from "./pages/Ingredients";
import { Purchases } from "./pages/Purchases";
import { Recipes } from "./pages/Recipes";
import { Production } from "./pages/Production";
import { Inventory } from "./pages/Inventory";
import { CustomersSales } from "./pages/CustomersSales";

function App() {
  return (
    <Router>
      <Layout>
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/ingredients" element={<Ingredients />} />
          <Route path="/purchases" element={<Purchases />} />
          <Route path="/recipes" element={<Recipes />} />
          <Route path="/production" element={<Production />} />
          <Route path="/inventory" element={<Inventory />} />
          <Route path="/customers-sales" element={<CustomersSales />} />
        </Routes>
      </Layout>
    </Router>
  );
}

export default App;
