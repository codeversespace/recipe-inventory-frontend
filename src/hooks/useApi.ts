// src/hooks/useApi.ts
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "../api/client";
import {
  Ingredient,
  PurchaseLot,
  Recipe,
  RecipeIngredient,
  ProductionBatch,
} from "../types/api";

/* ------------------------------------------------------------------ */
/* Ingredients                                                         */
/* ------------------------------------------------------------------ */
export const useIngredients = () =>
  useQuery<Ingredient[], Error>({
    queryKey: ["ingredients"],
    queryFn: async () => {
      const { data } = await api.get<Ingredient[]>("/ingredients");
      return data;
    },
    // So the component can safely do `ingredients?.map` even while loading
    initialData: [],
  });

export const useAddIngredient = () => {
  const qc = useQueryClient();
  return useMutation<void, Error, { name: string; base_unit: string; min_stock: number }>({
    mutationFn: (payload) => api.post("/ingredients", payload),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["ingredients"] }),
  });
};

export const useUpdateIngredient = () => {
  const qc = useQueryClient();
  return useMutation<any, any, { id: number; name: string; base_unit: string; min_stock: number }>({
    mutationFn: ({ id, ...payload }) => api.put(`/ingredients/${id}`, payload),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["ingredients"] }),
  });
};

export const useDeleteIngredient = () => {
  const qc = useQueryClient();
  return useMutation<void, any, number>({
    mutationFn: (id) => api.delete(`/ingredients/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["ingredients"] }),
  });
};

/* ------------------------------------------------------------------ */
/* Purchase Lots                                                       */
/* ------------------------------------------------------------------ */
export const usePurchaseLots = (ingredientId?: number) =>
  useQuery<PurchaseLot[], Error>({
    queryKey: ["purchaseLots", ingredientId],
    queryFn: async () => {
      const { data } = await api.get<PurchaseLot[]>(
        `/ingredients/${ingredientId}/lots`
      );
      return data;
    },
    enabled: !!ingredientId,
    initialData: [],
  });

export const useAddPurchaseLot = () => {
  const qc = useQueryClient();
  return useMutation<void, Error, { ingredient_id: number; qty: number; unit_price: number; supplier?: string; reference?: string; lot_number?: string; expiry_date?: string }>({
    mutationFn: (payload) =>
      api.post(`/ingredients/${payload.ingredient_id}/lots`, payload),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["ingredients"] }),
  });
};

export const useUpdatePurchaseLot = () => {
  const qc = useQueryClient();
  return useMutation<any, any, { ingredient_id: number; id: number; qty: number; unit_price: number; supplier?: string; reference?: string; lot_number?: string; expiry_date?: string }>({
    mutationFn: ({ ingredient_id, id, ...payload }) => api.put(`/ingredients/${ingredient_id}/lots/${id}`, { ingredient_id, ...payload }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["purchaseLots"] }),
  });
};

export const useDeletePurchaseLot = () => {
  const qc = useQueryClient();
  return useMutation<void, any, { ingredient_id: number; id: number }>({
    mutationFn: ({ ingredient_id, id }) => api.delete(`/ingredients/${ingredient_id}/lots/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["purchaseLots"] }),
  });
};

/* ------------------------------------------------------------------ */
/* Recipes                                                             */
/* ------------------------------------------------------------------ */
export const useRecipes = () =>
  useQuery<Recipe[], Error>({
    queryKey: ["recipes"],
    queryFn: async () => {
      const { data } = await api.get<Recipe[]>("/recipes");
      return data;
    },
    initialData: [],
  });

export const useAddRecipe = () => {
  const qc = useQueryClient();
  return useMutation<Recipe, any, { name: string; batch_qty: number; batch_unit: string; selling_price?: number | null }>({
    mutationFn: async (payload) => {
      const { data } = await api.post<Recipe>("/recipes", payload);
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["recipes"] }),
  });
};

export const useUpdateRecipe = () => {
  const qc = useQueryClient();
  return useMutation<any, any, { id: number; name: string; batch_qty: number; batch_unit: string; selling_price?: number | null }>({
    mutationFn: async ({ id, ...payload }) => {
      const { data } = await api.put<Recipe>(`/recipes/${id}`, payload);
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["recipes"] }),
  });
};

export const useDeleteRecipe = () => {
  const qc = useQueryClient();
  return useMutation<void, any, number>({
    mutationFn: (id) => api.delete(`/recipes/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["recipes"] }),
  });
};

export const useRecipeIngredients = (recipeId: number) =>
  useQuery<RecipeIngredient[], Error>({
    queryKey: ["recipeIngredients", recipeId],
    queryFn: async () => {
      const { data } = await api.get<RecipeIngredient[]>(
        `/recipes/${recipeId}/ingredients`
      );
      return data;
    },
    enabled: !!recipeId,
    initialData: [],
  });

export const useAddRecipeIngredient = () => {
  const qc = useQueryClient();
  return useMutation<void, Error, { recipe_id: number; ingredient_id: number; qty_per_batch: number; unit: string }>({
    mutationFn: (payload) =>
      api.post(`/recipes/${payload.recipe_id}/ingredients`, {
        ingredient_id: payload.ingredient_id,
        qty_per_batch: payload.qty_per_batch,
        unit: payload.unit,
      }),
    onSuccess: (data, vars) =>
      qc.invalidateQueries({ queryKey: ["recipeIngredients", vars.recipe_id] }),
  });
};

/* ------------------------------------------------------------------ */
/* Production (batch)                                                  */
/* ------------------------------------------------------------------ */
export const useProduceBatch = () => {
  const qc = useQueryClient();
  return useMutation<ProductionBatch, Error, { recipe_id: number; produced_qty: number; costing_method?: "FIFO" | "LIFO" | "AVG"; sell_price_per_kg?: number }>({
    mutationFn: async (payload) => {
      const { data } = await api.post<ProductionBatch>("/production", payload);
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["batches"] });
      qc.invalidateQueries({ queryKey: ["inventory"] });
    },
  });
};

export const useCostPreview = (recipeId: number, producedQty: string, sellPrice?: string) =>
  useQuery<any, Error>({
    queryKey: ["costPreview", recipeId, producedQty, sellPrice],
    queryFn: async () => {
      const { data } = await api.get("/production/preview", { params: { recipe_id: recipeId, produced_qty: Number(producedQty), sell_price_per_kg: sellPrice ? Number(sellPrice) : undefined } });
      return data;
    },
    enabled: !!recipeId && Number(producedQty) > 0,
  });

export const useBatchDetail = (batchId: number | null) =>
  useQuery<any, Error>({
    queryKey: ["batchDetail", batchId],
    queryFn: async () => {
      const { data } = await api.get(`/production/${batchId}`);
      return data;
    },
    enabled: !!batchId,
  });

export const useBatches = (limit = 20) =>
  useQuery<ProductionBatch[], Error>({
    queryKey: ["batches", limit],
    queryFn: async () => {
      const { data } = await api.get<ProductionBatch[]>("/report/batches", {
        params: { limit },
      });
      return data;
    },
    initialData: [],
  });

/* ------------------------------------------------------------------ */
/* Inventory                                                            */
/* ------------------------------------------------------------------ */
export const useInventory = () =>
  useQuery<any[], Error>({   // you can create a concrete interface later
    queryKey: ["inventory"],
    queryFn: async () => {
      const { data } = await api.get<any[]>("/report/inventory");
      return data;
    },
    initialData: [],
  });

export const useCustomers = () =>
  useQuery<any[], Error>({ queryKey: ["customers"], queryFn: async () => (await api.get("/customers")).data, initialData: [] });

export const useAddCustomer = () => {
  const qc = useQueryClient();
  return useMutation<any, Error, { name: string; phone?: string; email?: string; address?: string }>({
    mutationFn: (payload) => api.post("/customers", payload),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["customers"] }),
  });
};

export const useUpdateCustomer = () => {
  const qc = useQueryClient();
  return useMutation<any, Error, { id: number; name: string; phone?: string; email?: string; address?: string }>({
    mutationFn: ({ id, ...payload }) => api.put(`/customers/${id}`, payload),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["customers"] }),
  });
};

export const useCustomerPrices = (customerId: number) =>
  useQuery<any[], Error>({ queryKey: ["customerPrices", customerId], queryFn: async () => (await api.get(`/customers/${customerId}/prices`)).data, enabled: !!customerId, initialData: [] });

export const useSetCustomerPrice = () => {
  const qc = useQueryClient();
  return useMutation<any, Error, { customer_id: number; recipe_id: number; price_per_unit: number }>({
    mutationFn: ({ customer_id, ...payload }) => api.put(`/customers/${customer_id}/prices`, payload),
    onSuccess: (_data, vars) => qc.invalidateQueries({ queryKey: ["customerPrices", vars.customer_id] }),
  });
};

export const useSales = () =>
  useQuery<any[], Error>({ queryKey: ["sales"], queryFn: async () => (await api.get("/sales")).data, initialData: [] });

export const useAddSale = () => {
  const qc = useQueryClient();
  return useMutation<any, Error, { customer_id?: number; reference?: string; payment_status: string; lines: { recipe_id: number; quantity: number; unit_price?: number }[] }>({
    mutationFn: (payload) => api.post("/sales", payload),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["sales"] }),
  });
};
