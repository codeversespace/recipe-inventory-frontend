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

export const useAuthUsers = (enabled: boolean) =>
  useQuery<any[], Error>({
    queryKey: ["authUsers"],
    queryFn: async () => (await api.get("/auth/users")).data,
    enabled,
    initialData: [],
  });

export const useSuppliers = () =>
  useQuery<any[], Error>({
    queryKey: ["suppliers"],
    queryFn: async () => (await api.get("/suppliers")).data,
    initialData: [],
  });

export const useSupplier = (supplierId: number) =>
  useQuery<any, Error>({
    queryKey: ["supplier", supplierId],
    queryFn: async () => (await api.get(`/suppliers/${supplierId}`)).data,
    enabled: !!supplierId,
  });

export const useAddSupplier = () => {
  const qc = useQueryClient();
  return useMutation<any, Error, { name: string; phone?: string; email?: string; address?: string; tax_id?: string; notes?: string }>({
    mutationFn: (payload) => api.post("/suppliers", payload),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["suppliers"] }),
  });
};

export const useAddSupplierPayment = () => {
  const qc = useQueryClient();
  return useMutation<any, Error, { supplierId: number; amount: number; method: string; reference?: string; notes?: string }>({
    mutationFn: ({ supplierId, ...payload }) => api.post(`/suppliers/${supplierId}/payments`, payload),
    onSuccess: (_data, variables) => qc.invalidateQueries({ queryKey: ["supplier", variables.supplierId] }),
  });
};

export const useAuthRoles = (enabled: boolean) =>
  useQuery<any[], Error>({
    queryKey: ["authRoles"],
    queryFn: async () => (await api.get("/auth/roles")).data,
    enabled,
    initialData: [],
  });

export const useAuthActivities = (enabled: boolean) =>
  useQuery<any[], Error>({
    queryKey: ["authActivities"],
    queryFn: async () => (await api.get("/auth/activities")).data,
    enabled,
    initialData: [],
  });

export const useCreateAuthUser = () => {
  const qc = useQueryClient();
  return useMutation<any, Error, { username: string; password: string; role: string }>({
    mutationFn: (payload) => api.post("/auth/users", payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["authUsers"] });
      qc.invalidateQueries({ queryKey: ["authActivities"] });
    },
  });
};

export const useUpdateAuthUser = () => {
  const qc = useQueryClient();
  return useMutation<any, Error, { id: number; role?: string; is_active?: boolean }>({
    mutationFn: ({ id, ...payload }) => api.put(`/auth/users/${id}`, payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["authUsers"] });
      qc.invalidateQueries({ queryKey: ["authActivities"] });
    },
  });
};

export const useResetAuthPassword = () => {
  const qc = useQueryClient();
  return useMutation<any, Error, { id: number; password: string }>({
    mutationFn: ({ id, password }) => api.post(`/auth/users/${id}/reset-password`, { password }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["authActivities"] }),
  });
};

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
  return useMutation<Ingredient, Error, { name: string; base_unit: string; min_stock: number }>({
    mutationFn: async (payload) => (await api.post<Ingredient>("/ingredients", payload)).data,
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

export const useAllPurchaseLots = () =>
  useQuery<PurchaseLot[], Error>({
    queryKey: ["purchaseLots", "all"],
    queryFn: async () => (await api.get<PurchaseLot[]>("/ingredients/lots/all")).data,
    initialData: [],
  });

export const useAddPurchaseLot = () => {
  const qc = useQueryClient();
  return useMutation<void, Error, { ingredient_id: number; supplier_id?: number; qty: number; unit_price: number; supplier?: string; reference?: string; lot_number?: string; expiry_date?: string }>({
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
  return useMutation<Recipe, any, { name: string; batch_qty: number; batch_unit: string }>({
    mutationFn: async (payload) => {
      const { data } = await api.post<Recipe>("/recipes", payload);
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["recipes"] }),
  });
};

export const useUpdateRecipe = () => {
  const qc = useQueryClient();
  return useMutation<any, any, { id: number; name: string; batch_qty: number; batch_unit: string }>({
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
/* Recipe Overheads                                                    */
/* ------------------------------------------------------------------ */
export const useRecipeOverheads = (recipeId: number) =>
  useQuery<any[], Error>({
    queryKey: ["recipeOverheads", recipeId],
    queryFn: async () => (await api.get(`/recipes/${recipeId}/overheads`)).data,
    enabled: !!recipeId,
    initialData: [],
  });

export const useAddRecipeOverhead = () => {
  const qc = useQueryClient();
  return useMutation<any, Error, { recipe_id: number; name: string; cost_per_batch: number; overhead_type: string }>({
    mutationFn: (payload) => api.post(`/recipes/${payload.recipe_id}/overheads`, { name: payload.name, cost_per_batch: payload.cost_per_batch, overhead_type: payload.overhead_type }),
    onSuccess: (_data, vars) => qc.invalidateQueries({ queryKey: ["recipeOverheads", vars.recipe_id] }),
  });
};

export const useDeleteRecipeOverhead = () => {
  const qc = useQueryClient();
  return useMutation<void, Error, { recipe_id: number; overhead_id: number }>({
    mutationFn: ({ recipe_id, overhead_id }) => api.delete(`/recipes/${recipe_id}/overheads/${overhead_id}`),
    onSuccess: (_data, vars) => qc.invalidateQueries({ queryKey: ["recipeOverheads", vars.recipe_id] }),
  });
};

/* ------------------------------------------------------------------ */
/* Production (batch)                                                  */
/* ------------------------------------------------------------------ */
export const useProduceBatch = () => {
  const qc = useQueryClient();
  return useMutation<ProductionBatch, Error, { recipe_id: number; produced_qty: number; costing_method?: "FIFO" | "LIFO" | "AVG"; overheads?: { name: string; cost_per_batch: number; overhead_type: string }[] }>({
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

export const useUpdateBatch = () => {
  const qc = useQueryClient();
  return useMutation<any, any, { id: number; produced_qty: number; produced_at: string; selling_price?: number | null }>({
    mutationFn: ({ id, ...payload }) => api.put(`/production/${id}`, payload),
    onSuccess: (_data, vars) => {
      qc.invalidateQueries({ queryKey: ["batches"] });
      qc.invalidateQueries({ queryKey: ["batchDetail", vars.id] });
      qc.invalidateQueries({ queryKey: ["finishedInventory"] });
    },
  });
};

export const useCostPreview = (recipeId: number, producedQty: string) =>
  useQuery<any, Error>({
    queryKey: ["costPreview", recipeId, producedQty],
    queryFn: async () => {
      const { data } = await api.get("/production/preview", { params: { recipe_id: recipeId, produced_qty: Number(producedQty) } });
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
  return useMutation<any, Error, { name: string; phone?: string; email?: string; address?: string; credit_limit: number; advance_balance?: number }>({
    mutationFn: (payload) => api.post("/customers", payload),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["customers"] }),
  });
};

export const useUpdateCustomer = () => {
  const qc = useQueryClient();
  return useMutation<any, Error, { id: number; name: string; phone?: string; email?: string; address?: string; credit_limit: number; advance_balance?: number }>({
    mutationFn: ({ id, ...payload }) => api.put(`/customers/${id}`, payload),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["customers"] }),
  });
};

export const useCustomerPrices = (customerId: number) =>
  useQuery<any[], Error>({ queryKey: ["customerPrices", customerId], queryFn: async () => (await api.get(`/customers/${customerId}/prices`)).data, enabled: !!customerId, initialData: [] });

export const useCustomerProfile = (customerId: number, status?: string, startDate?: string, endDate?: string) =>
  useQuery<any, Error>({
    queryKey: ["customerProfile", customerId, status, startDate, endDate],
    queryFn: async () => (await api.get(`/customers/${customerId}/profile`, { params: { status: status || undefined, start_date: startDate || undefined, end_date: endDate || undefined } })).data,
    enabled: !!customerId,
  });

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
  return useMutation<any, Error, { customer_id?: number; reference?: string; due_date?: string; payment_status: string; amount_paid: number; payment_method?: string; payment_reference?: string; use_advance?: boolean; lines: { recipe_id?: number; stock_item_id?: number; quantity: number; unit_price?: number }[] }>({
    mutationFn: (payload) => api.post("/sales", payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["sales"] });
      qc.invalidateQueries({ queryKey: ["customerProfile"] });
      qc.invalidateQueries({ queryKey: ["paymentSales"] });
      qc.invalidateQueries({ queryKey: ["paymentHistory"] });
      qc.invalidateQueries({ queryKey: ["saleableStock"] });
      qc.invalidateQueries({ queryKey: ["customers"] });
    },
  });
};

export const useRecordPayment = () => {
  const qc = useQueryClient();
  return useMutation<any, Error, { sale_id: number; amount: number; method: string; reference?: string }>({
    mutationFn: ({ sale_id, ...payload }) => api.post(`/sales/${sale_id}/payments`, payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["sales"] });
      qc.invalidateQueries({ queryKey: ["customerProfile"] });
      qc.invalidateQueries({ queryKey: ["paymentSales"] });
      qc.invalidateQueries({ queryKey: ["paymentHistory"] });
    },
  });
};

export const usePaymentsSales = () =>
  useQuery<any[], Error>({ queryKey: ["paymentSales"], queryFn: async () => (await api.get("/sales", { params: { limit: 500 } })).data, initialData: [] });

export const usePaymentHistory = (enabled: boolean) =>
  useQuery<any[], Error>({ queryKey: ["paymentHistory"], queryFn: async () => (await api.get("/payments")).data, enabled, initialData: [] });

export const useCustomerPayment = () => {
  const qc = useQueryClient();
  return useMutation<any, Error, { customer_id: number; amount: number; method: string; reference?: string }>({
    mutationFn: (payload) => api.post("/payments/customer", payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["paymentSales"] });
      qc.invalidateQueries({ queryKey: ["paymentHistory"] });
      qc.invalidateQueries({ queryKey: ["sales"] });
      qc.invalidateQueries({ queryKey: ["customerProfile"] });
      qc.invalidateQueries({ queryKey: ["customers"] });
    },
  });
};

export const useSalesSummary = () =>
  useQuery<any, Error>({ queryKey: ["salesSummary"], queryFn: async () => (await api.get("/report/sales-summary")).data });

export const useDashboard = (startDate: string, endDate: string) =>
  useQuery<any, Error>({
    queryKey: ["dashboard", startDate, endDate],
    queryFn: async () => (await api.get("/report/dashboard", {
      params: { start_date: startDate, end_date: endDate },
    })).data,
    placeholderData: (previous: any) => previous ?? {
      revenue: 0, cost: 0, profit: 0, margin_pct: 0, paid: 0, due: 0,
      invoice_count: 0, batch_count: 0, produced_qty: 0, ready_to_pack_qty: 0,
      packed_packs: 0, packaged_stock_packs: 0, saleable_stock_value: 0,
      low_stock_count: 0, out_of_stock_count: 0, missing_price_count: 0,
      trend: [], top_products: [], alerts: [],
    },
  });

export const useFinishedInventory = () =>
  useQuery<any[], Error>({ queryKey: ["finishedInventory"], queryFn: async () => (await api.get("/report/finished-inventory")).data, initialData: [] });

export const useReadyToPack = () =>
  useQuery<any[], Error>({ queryKey: ["readyToPack"], queryFn: async () => (await api.get("/packing/ready")).data, initialData: [] });

export const usePackTypes = () =>
  useQuery<any[], Error>({ queryKey: ["packTypes"], queryFn: async () => (await api.get("/packing/types")).data, initialData: [] });

export const usePackingMaterials = () =>
  useQuery<any[], Error>({ queryKey: ["packingMaterials"], queryFn: async () => (await api.get("/packing/materials")).data, initialData: [] });

export const usePackagedStock = () =>
  useQuery<any[], Error>({ queryKey: ["packagedStock"], queryFn: async () => (await api.get("/packing/stock")).data, initialData: [] });

export const useSaleableStock = () =>
  useQuery<any[], Error>({ queryKey: ["saleableStock"], queryFn: async () => (await api.get("/packing/saleable")).data, initialData: [] });

export const useAddPackType = () => {
  const qc = useQueryClient();
  return useMutation<any, Error, { name: string; size_grams: number; selling_price?: number | null; materials: { material_id: number; qty_per_pack: number }[] }>({
    mutationFn: (payload) => api.post("/packing/types", payload),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["packTypes"] }),
  });
};

export const useUpdatePackType = () => {
  const qc = useQueryClient();
  return useMutation<any, Error, { id: number; name: string; size_grams: number; selling_price?: number | null; materials: { material_id: number; qty_per_pack: number }[] }>({
    mutationFn: ({ id, ...payload }) => api.put(`/packing/types/${id}`, payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["packTypes"] });
      qc.invalidateQueries({ queryKey: ["saleableStock"] });
    },
  });
};
export const useManualStock = () =>
  useQuery<any[], Error>({ queryKey: ["manualStock"], queryFn: async () => (await api.get("/packing/manual-stock")).data, initialData: [] });

export const useAddManualStock = () => {
  const qc = useQueryClient();
  return useMutation<any, Error, { name: string; unit: string; qty: number; unit_price: number; category?: "saleable_good" | "packing_material"; supplier_id?: number; reference?: string }>({
    mutationFn: (payload) => api.post("/packing/manual-stock", payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["manualStock"] });
      qc.invalidateQueries({ queryKey: ["saleableStock"] });
    },
  });
};

export const usePackBatch = () => {
  const qc = useQueryClient();
  return useMutation<any, Error, { batch_id: number; pack_type_id: number; pack_count: number; employee_name?: string }>({
    mutationFn: (payload) => api.post("/packing", payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["readyToPack"] });
      qc.invalidateQueries({ queryKey: ["finishedInventory"] });
      qc.invalidateQueries({ queryKey: ["packagedStock"] });
      qc.invalidateQueries({ queryKey: ["saleableStock"] });
    },
  });
};

/* ------------------------------------------------------------------ */
/* Supplier Payments                                                   */
/* ------------------------------------------------------------------ */
export const useSupplierPayments = () =>
  useQuery<any[], Error>({ queryKey: ["supplierPayments"], queryFn: async () => (await api.get("/suppliers/payments/history")).data, initialData: [] });

export const useAddSupplierPaymentFromPayments = () => {
  const qc = useQueryClient();
  return useMutation<any, Error, { supplierId: number; amount: number; method: string; reference?: string; notes?: string }>({
    mutationFn: ({ supplierId, ...payload }) => api.post(`/suppliers/${supplierId}/payments`, payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["supplierPayments"] });
      qc.invalidateQueries({ queryKey: ["suppliers"] });
      qc.invalidateQueries({ queryKey: ["supplier"] });
    },
  });
};

/* ------------------------------------------------------------------ */
/* Customer Orders                                                     */
/* ------------------------------------------------------------------ */
export const useOrders = () =>
  useQuery<any[], Error>({ queryKey: ["orders"], queryFn: async () => (await api.get("/orders")).data, initialData: [] });

export const useCreateOrder = () => {
  const qc = useQueryClient();
  return useMutation<any, Error, { customer_id: number; expected_delivery?: string; notes?: string; lines: { stock_item_id: number; quantity: number; unit_price?: number }[] }>({
    mutationFn: (payload) => api.post("/orders", payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["orders"] });
      qc.invalidateQueries({ queryKey: ["saleableStock"] });
    },
  });
};

export const useDeleteOrder = () => {
  const qc = useQueryClient();
  return useMutation<void, Error, number>({
    mutationFn: (orderId) => api.delete(`/orders/${orderId}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["orders"] }),
  });
};

export const useOrderDemand = () =>
  useQuery<any[], Error>({ queryKey: ["orderDemand"], queryFn: async () => (await api.get("/orders/demand")).data, initialData: [] });
