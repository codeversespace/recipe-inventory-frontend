// Shared procurement price-intelligence helpers.
//
// All values derive from existing SupplierPurchase rows (matched by exact
// item_name — the same linkage the backend itself uses between purchases
// and inventory). No new calculations on stock, cost or balances.

export type PricePoint = {
  purchaseId: number;
  supplierId: number;
  supplierName: string;
  date: string;
  qty: number;
  unit: string;
  price: number;
  total: number;
  reference?: string | null;
};

export type SupplierSummary = {
  supplierId: number;
  supplierName: string;
  buys: PricePoint[];
  latest: PricePoint;
  prev: PricePoint | null;
  /** latest.price - prev.price (negative = cheaper). Null when no previous buy. */
  change: number | null;
  changePct: number | null;
  avg: number;
  count: number;
};

export type UnitComparison = {
  unit: string;
  rows: PricePoint[];
  suppliers: SupplierSummary[];
  /** Supplier with the lowest latest price, or null when no rows. */
  best: SupplierSummary | null;
  /** Overall latest purchase across suppliers. */
  latest: PricePoint | null;
};

const toPoint = (p: any): PricePoint => ({
  purchaseId: p.id,
  supplierId: p.supplier_id,
  supplierName: p.supplier_name || "—",
  date: (p.purchased_at || "").slice(0, 10),
  qty: p.quantity,
  unit: p.unit,
  price: p.unit_price,
  total: p.total_amount,
  reference: p.reference ?? null,
});

/** Exact-name match — mirrors how the backend links purchases to inventory. */
export const purchasesForItem = (purchases: any[], itemName: string): PricePoint[] =>
  purchases
    .filter((p: any) => p.item_name === itemName)
    .map(toPoint)
    .sort((a, b) => (a.date < b.date ? -1 : a.date > b.date ? 1 : a.purchaseId - b.purchaseId));

/** Group rows by purchase unit (prices are only comparable within one unit). */
export const groupByUnit = (rows: PricePoint[]): UnitComparison[] => {
  const byUnit = new Map<string, PricePoint[]>();
  for (const r of rows) {
    const list = byUnit.get(r.unit) ?? [];
    list.push(r);
    byUnit.set(r.unit, list);
  }
  // Largest group first so snapshots default to the dominant unit.
  return Array.from(byUnit.entries())
    .sort((a, b) => b[1].length - a[1].length)
    .map(([unit, unitRows]) => {
      const bySupplier = new Map<number, PricePoint[]>();
      for (const r of unitRows) {
        const list = bySupplier.get(r.supplierId) ?? [];
        list.push(r);
        bySupplier.set(r.supplierId, list);
      }
      const suppliers: SupplierSummary[] = Array.from(bySupplier.entries()).map(([supplierId, buys]) => {
        const ordered = [...buys].sort((a, b) =>
          a.date < b.date ? -1 : a.date > b.date ? 1 : a.purchaseId - b.purchaseId,
        );
        const latest = ordered[ordered.length - 1];
        const prev = ordered.length > 1 ? ordered[ordered.length - 2] : null;
        const change = prev ? latest.price - prev.price : null;
        const changePct = prev && prev.price !== 0 ? (change! / prev.price) * 100 : null;
        return {
          supplierId,
          supplierName: latest.supplierName,
          buys: ordered,
          latest,
          prev,
          change,
          changePct,
          avg: ordered.reduce((s, x) => s + x.price, 0) / ordered.length,
          count: ordered.length,
        };
      });
      // Best = lowest latest price; ties broken by most recent purchase.
      const best =
        suppliers.length === 0
          ? null
          : [...suppliers].sort((a, b) =>
              a.latest.price !== b.latest.price
                ? a.latest.price - b.latest.price
                : b.latest.date.localeCompare(a.latest.date),
            )[0];
      const latest =
        unitRows.length === 0
          ? null
          : [...unitRows].sort((a, b) =>
              a.date !== b.date ? b.date.localeCompare(a.date) : b.purchaseId - a.purchaseId,
            )[0];
      return { unit, rows: unitRows, suppliers, best, latest };
    });
};

export const formatShortDate = (iso: string) => {
  if (!iso || iso.length < 10) return "—";
  const [y, m, d] = iso.split("-");
  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  const mi = Number(m) - 1;
  return `${Number(d)} ${months[mi] ?? m} ${mi >= 0 && mi < 12 ? "" : y}`;
};
