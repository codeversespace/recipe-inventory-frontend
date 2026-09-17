import { formatDate } from "./formatDate";
import { formatMoney } from "./formatNumber";

interface InvoiceLine {
  item_name?: string;
  recipe_name?: string;
  quantity: number;
  unit_price: number;
  line_total: number;
  allocations?: { batch_id: number; batch_date?: string; quantity: number }[];
}

interface InvoiceSale {
  id: number;
  sold_at: string;
  reference?: string;
  customer_name?: string;
  total_amount: number;
  amount_paid: number;
  amount_due: number;
  payment_status: string;
  lines: InvoiceLine[];
}

function esc(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

export function printInvoice(sale: InvoiceSale): void {
  const lines = sale.lines
    .map((line) => {
      const name = esc(line.item_name || line.recipe_name || "");
      const batchDetail = line.allocations && line.allocations.length > 0
        ? `<div style="font-size:11px;color:#64748b;margin-top:2px;">${line.allocations.map((a) => `Batch #${a.batch_id}${a.batch_date ? ` (${a.batch_date})` : ""}: ${a.quantity} units`).join("<br>")}</div>`
        : "";
      return `<tr>
        <td style="padding:8px;border-bottom:1px solid #e2e8f0;">${name}${batchDetail}</td>
        <td style="padding:8px;border-bottom:1px solid #e2e8f0;text-align:right;">${line.quantity}</td>
        <td style="padding:8px;border-bottom:1px solid #e2e8f0;text-align:right;">${formatMoney(line.unit_price)}</td>
        <td style="padding:8px;border-bottom:1px solid #e2e8f0;text-align:right;">${formatMoney(line.line_total)}</td>
      </tr>`;
    })
    .join("");

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>Invoice #${sale.id}</title>
<style>
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; color: #172033; padding: 16px; max-width: 760px; margin: 0 auto; }
  @media print { body { padding: 0; } @page { margin: 12mm; } }
</style>
</head>
<body>
  <div style="display:flex;justify-content:space-between;border-bottom:3px solid #0f766e;padding-bottom:16px;margin-bottom:20px;">
    <div>
      <div style="font-size:24px;font-weight:800;color:#0f766e;">INVOICE</div>
      <div style="font-size:13px;color:#64748b;">Recipe Inventory</div>
    </div>
    <div style="text-align:right;">
      <div style="font-size:18px;font-weight:600;">#${sale.id}</div>
      <div style="font-size:13px;color:#64748b;">${formatDate(sale.sold_at)}</div>
      ${sale.reference ? `<div style="font-size:13px;color:#64748b;">Ref: ${esc(sale.reference)}</div>` : ""}
    </div>
  </div>
  <div style="margin-bottom:20px;">
    <div style="font-size:11px;text-transform:uppercase;color:#94a3b8;letter-spacing:0.5px;">Bill to</div>
    <div style="font-size:18px;font-weight:600;">${esc(sale.customer_name || "Walk-in customer")}</div>
  </div>
  <table style="width:100%;border-collapse:collapse;font-size:13px;">
    <thead>
      <tr style="background:#f0fdfa;">
        <th style="padding:8px;border-bottom:2px solid #0f766e;text-align:left;">Product</th>
        <th style="padding:8px;border-bottom:2px solid #0f766e;text-align:right;">Qty</th>
        <th style="padding:8px;border-bottom:2px solid #0f766e;text-align:right;">Unit price</th>
        <th style="padding:8px;border-bottom:2px solid #0f766e;text-align:right;">Amount</th>
      </tr>
    </thead>
    <tbody>${lines}</tbody>
  </table>
  <div style="margin-top:20px;text-align:right;font-size:15px;font-weight:600;">
    Total: ${formatMoney(sale.total_amount)}
    ${sale.amount_paid ? `<div style="font-size:13px;font-weight:400;color:#64748b;">Paid: ${formatMoney(sale.amount_paid)}</div>` : ""}
    ${sale.amount_due ? `<div style="font-size:13px;font-weight:400;color:#dc2626;">Due: ${formatMoney(sale.amount_due)}</div>` : ""}
  </div>
  <script>window.onload = function(){ window.print(); }<\/script>
</body>
</html>`;

  const win = window.open("", "_blank", "width=800,height=600");
  if (win) {
    win.document.write(html);
    win.document.close();
  }
}
