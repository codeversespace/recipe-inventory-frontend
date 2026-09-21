import { formatDate } from "./formatDate";
import { formatMoney } from "./formatNumber";

interface InvoiceLine {
  item_name?: string;
  recipe_name?: string;
  quantity: number;
  unit_price: number;
  line_total: number;
  hsn_code?: string;
  gst_rate?: number;
  taxable_amount?: number;
  cgst_amount?: number;
  sgst_amount?: number;
  igst_amount?: number;
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
  is_gst_invoice?: number;
  place_of_supply?: string;
  reverse_charge?: number;
  total_cgst?: number;
  total_sgst?: number;
  total_igst?: number;
  total_taxable?: number;
  lines: InvoiceLine[];
}

function esc(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

function numberToWords(num: number): string {
  if (num === 0) return "Zero";
  const ones = ["", "One", "Two", "Three", "Four", "Five", "Six", "Seven", "Eight", "Nine",
    "Ten", "Eleven", "Twelve", "Thirteen", "Fourteen", "Fifteen", "Sixteen", "Seventeen", "Eighteen", "Nineteen"];
  const tens = ["", "", "Twenty", "Thirty", "Forty", "Fifty", "Sixty", "Seventy", "Eighty", "Ninety"];
  const convert = (n: number): string => {
    if (n < 20) return ones[n];
    if (n < 100) return tens[Math.floor(n / 10)] + (n % 10 ? " " + ones[n % 10] : "");
    if (n < 1000) return ones[Math.floor(n / 100)] + " Hundred" + (n % 100 ? " and " + convert(n % 100) : "");
    if (n < 100000) return convert(Math.floor(n / 1000)) + " Thousand" + (n % 1000 ? " " + convert(n % 1000) : "");
    if (n < 10000000) return convert(Math.floor(n / 100000)) + " Lakh" + (n % 100000 ? " " + convert(n % 100000) : "");
    return convert(Math.floor(n / 10000000)) + " Crore" + (n % 10000000 ? " " + convert(n % 10000000) : "");
  };
  const rupees = Math.floor(num);
  const paise = Math.round((num - rupees) * 100);
  let result = convert(rupees) + " Rupees";
  if (paise > 0) result += " and " + convert(paise) + " Paise";
  result += " Only";
  return result;
}

function buildSimpleInvoice(sale: InvoiceSale): string {
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

  return `<!DOCTYPE html>
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
}

function buildGSTInvoice(sale: InvoiceSale): string {
  const totalCgst = sale.total_cgst || sale.lines.reduce((s, l) => s + (l.cgst_amount || 0), 0);
  const totalSgst = sale.total_sgst || sale.lines.reduce((s, l) => s + (l.sgst_amount || 0), 0);
  const totalIgst = sale.total_igst || sale.lines.reduce((s, l) => s + (l.igst_amount || 0), 0);
  const totalTaxable = sale.total_taxable || sale.lines.reduce((s, l) => s + (l.taxable_amount || l.line_total), 0);

  const lines = sale.lines
    .map((line, i) => {
      const name = esc(line.item_name || line.recipe_name || "");
      const batchDetail = line.allocations && line.allocations.length > 0
        ? `<div style="font-size:10px;color:#64748b;">${line.allocations.map((a) => `Batch #${a.batch_id}`).join(", ")}</div>`
        : "";
      return `<tr>
        <td style="padding:6px;border-bottom:1px solid #e2e8f0;">${i + 1}</td>
        <td style="padding:6px;border-bottom:1px solid #e2e8f0;">${name}${batchDetail}</td>
        <td style="padding:6px;border-bottom:1px solid #e2e8f0;">${esc(line.hsn_code || "—")}</td>
        <td style="padding:6px;border-bottom:1px solid #e2e8f0;text-align:right;">${line.quantity}</td>
        <td style="padding:6px;border-bottom:1px solid #e2e8f0;text-align:right;">${formatMoney(line.unit_price)}</td>
        <td style="padding:6px;border-bottom:1px solid #e2e8f0;text-align:right;">${formatMoney(line.taxable_amount || line.line_total)}</td>
      </tr>`;
    })
    .join("");

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>Tax Invoice #${sale.id}</title>
<style>
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; color: #172033; padding: 16px; max-width: 760px; margin: 0 auto; font-size: 12px; }
  @media print { body { padding: 0; } @page { margin: 12mm; } }
  th { font-size: 11px; }
</style>
</head>
<body>
  <div style="text-align:center;margin-bottom:16px;padding-bottom:12px;border-bottom:3px solid #0f766e;">
    <div style="font-size:20px;font-weight:800;color:#0f766e;">TAX INVOICE</div>
    <div style="font-size:12px;color:#64748b;">Recipe Inventory</div>
  </div>

  <div style="display:flex;justify-content:space-between;margin-bottom:20px;gap:20px;flex-wrap:wrap;">
    <div style="flex:1;min-width:200px;">
      <div style="font-size:11px;text-transform:uppercase;color:#94a3b8;letter-spacing:0.5px;font-weight:700;">From</div>
      <div style="font-weight:700;">Recipe Inventory</div>
      <div style="color:#64748b;">(Your business address)</div>
      <div style="color:#64748b;">GSTIN: (Your GSTIN)</div>
      <div style="color:#64748b;">State: ${esc(sale.place_of_supply || "(Your State)")}</div>
    </div>
    <div style="flex:1;min-width:200px;text-align:right;">
      <div style="font-size:11px;text-transform:uppercase;color:#94a3b8;letter-spacing:0.5px;font-weight:700;">Invoice Details</div>
      <div style="font-size:18px;font-weight:600;">#${sale.id}</div>
      <div style="color:#64748b;">${formatDate(sale.sold_at)}</div>
      ${sale.reference ? `<div style="color:#64748b;">Ref: ${esc(sale.reference)}</div>` : ""}
      <div style="color:#64748b;">Place of Supply: ${esc(sale.place_of_supply || "—")}</div>
      ${sale.reverse_charge ? `<div style="color:#dc2626;">Reverse Charge: Applicable</div>` : ""}
    </div>
  </div>

  <div style="margin-bottom:20px;padding:8px 12px;background:#f8fafc;border-radius:4px;">
    <div style="font-size:11px;text-transform:uppercase;color:#94a3b8;letter-spacing:0.5px;font-weight:700;">Bill To</div>
    <div style="font-weight:600;">${esc(sale.customer_name || "Walk-in customer")}</div>
  </div>

  <table style="width:100%;border-collapse:collapse;margin-bottom:16px;">
    <thead>
      <tr style="background:#f0fdfa;">
        <th style="padding:6px;border-bottom:2px solid #0f766e;text-align:left;">#</th>
        <th style="padding:6px;border-bottom:2px solid #0f766e;text-align:left;">Description</th>
        <th style="padding:6px;border-bottom:2px solid #0f766e;text-align:left;">HSN/SAC</th>
        <th style="padding:6px;border-bottom:2px solid #0f766e;text-align:right;">Qty</th>
        <th style="padding:6px;border-bottom:2px solid #0f766e;text-align:right;">Rate</th>
        <th style="padding:6px;border-bottom:2px solid #0f766e;text-align:right;">Amount</th>
      </tr>
    </thead>
    <tbody>${lines}</tbody>
  </table>

  <div style="display:flex;justify-content:space-between;flex-wrap:wrap;gap:16px;margin-bottom:16px;">
    <div style="min-width:200px;font-style:italic;color:#64748b;font-size:11px;">
      Amount in words: ${numberToWords(sale.total_amount)}
    </div>
    <div style="min-width:200px;">
      <table style="border-collapse:collapse;width:100%;">
        <tr><td style="padding:4px 8px;">Taxable Amount</td><td style="padding:4px 8px;text-align:right;">${formatMoney(totalTaxable)}</td></tr>
        ${totalCgst > 0 ? `<tr><td style="padding:4px 8px;">CGST</td><td style="padding:4px 8px;text-align:right;">${formatMoney(totalCgst)}</td></tr>` : ""}
        ${totalSgst > 0 ? `<tr><td style="padding:4px 8px;">SGST</td><td style="padding:4px 8px;text-align:right;">${formatMoney(totalSgst)}</td></tr>` : ""}
        ${totalIgst > 0 ? `<tr><td style="padding:4px 8px;">IGST</td><td style="padding:4px 8px;text-align:right;">${formatMoney(totalIgst)}</td></tr>` : ""}
        <tr style="border-top:2px solid #0f766e;"><td style="padding:4px 8px;font-weight:700;">Total</td><td style="padding:4px 8px;text-align:right;font-weight:700;">${formatMoney(sale.total_amount)}</td></tr>
        ${sale.amount_paid > 0 ? `<tr><td style="padding:4px 8px;color:#16a34a;">Paid</td><td style="padding:4px 8px;text-align:right;color:#16a34a;">${formatMoney(sale.amount_paid)}</td></tr>` : ""}
        ${sale.amount_due > 0 ? `<tr><td style="padding:4px 8px;color:#dc2626;">Due</td><td style="padding:4px 8px;text-align:right;color:#dc2626;">${formatMoney(sale.amount_due)}</td></tr>` : ""}
      </table>
    </div>
  </div>

  <div style="margin-top:24px;padding-top:12px;border-top:1px solid #e2e8f0;display:flex;justify-content:space-between;">
    <div>
      <div style="font-size:11px;color:#94a3b8;">Declaration</div>
      <div style="font-size:10px;color:#94a3b8;">We declare that this invoice shows the actual price of the goods described and that all statements are true and correct.</div>
    </div>
    <div style="text-align:right;">
      <div style="font-size:11px;color:#94a3b8;">For Recipe Inventory</div>
      <div style="margin-top:32px;border-top:1px solid #94a3b8;padding-top:4px;width:100px;margin-left:auto;">
        <div style="font-size:10px;color:#94a3b8;">Authorized Signatory</div>
      </div>
    </div>
  </div>
  <script>window.onload = function(){ window.print(); }<\/script>
</body>
</html>`;
}

export function printInvoice(sale: InvoiceSale): void {
  const isGst = sale.is_gst_invoice === 1;
  const html = isGst ? buildGSTInvoice(sale) : buildSimpleInvoice(sale);
  const win = window.open("", "_blank", "width=800,height=600");
  if (win) {
    win.document.write(html);
    win.document.close();
  }
}
