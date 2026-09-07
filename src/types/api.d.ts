// src/types/api.d.ts   (create the folder if it doesn’t exist)
export interface Ingredient {
  id: number;
  name: string;
  base_unit: string;
  min_stock: number;
  on_hand_qty?: number;
  avg_unit_price?: number;
  category?: string;
}

export interface PurchaseLot {
  id: number;
  ingredient: string;         // name of the ingredient (joined by the back‑end)
  qty: number;
  purchased_qty: number;
  unit_price: number;
  received_at: string;       // ISO date string
  supplier?: string | null;
  reference?: string | null;
  lot_number?: string | null;
  expiry_date?: string | null;
  source: string;
}

export interface Recipe {
  id: number;
  name: string;
  batch_qty: number;
  batch_unit: string;
}

export interface RecipeIngredient {
  id: number;
  ingredient_id: number;
  ingredient: {
    id: number;
    name: string;
    base_unit: string;
  };
  qty_per_batch: number;
  unit: string;
}

/** The shape of a production batch that the API returns */
export interface ProductionBatch {
  id: number;
  recipe_id: number;
  recipe_name: string;
  produced_qty: number;
  produced_at: string;            // ISO timestamp
  costing_method: "FIFO" | "LIFO" | "AVG";
  total_cost: number;
  total_revenue?: number | null;
  profit?: number | null;
  profit_per_kg?: number | null;
  margin_pct?: number | null;
}
