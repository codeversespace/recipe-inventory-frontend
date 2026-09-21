import React from "react";
import { Box, Button, Dialog, DialogActions, DialogContent, DialogTitle, Typography, useMediaQuery, useTheme } from "@mui/material";
import { formatDate } from "../../utils/formatDate";
import { formatMoney } from "../../utils/formatNumber";
import { printInvoice } from "../../utils/printInvoice";

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
  customer_address?: string;
  customer_gstin?: string;
  customer_state?: string;
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

const Indian_STATES = [
  "Andhra Pradesh", "Arunachal Pradesh", "Assam", "Bihar", "Chhattisgarh",
  "Goa", "Gujarat", "Haryana", "Himachal Pradesh", "Jharkhand", "Karnataka",
  "Kerala", "Madhya Pradesh", "Maharashtra", "Manipur", "Meghalaya", "Mizoram",
  "Nagaland", "Odisha", "Punjab", "Rajasthan", "Sikkim", "Tamil Nadu",
  "Telangana", "Tripura", "Uttar Pradesh", "Uttarakhand", "West Bengal",
  "Andaman and Nicobar Islands", "Chandigarh", "Dadra and Nagar Haveli and Daman and Diu",
  "Delhi", "Jammu and Kashmir", "Ladakh", "Lakshadweep", "Puducherry",
];

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

function SimpleInvoiceContent({ sale }: { sale: InvoiceSale }) {
  return (
    <Box sx={{ maxWidth: 760, mx: "auto", color: "#172033" }}>
      <Box sx={{ display: "flex", justifyContent: "space-between", borderBottom: "3px solid #0f766e", pb: 2, mb: 3 }}>
        <Box>
          <Typography variant="h4" sx={{ fontWeight: 800, color: "#0f766e" }}>INVOICE</Typography>
          <Typography variant="body2">Recipe Inventory</Typography>
        </Box>
        <Box sx={{ textAlign: "right" }}>
          <Typography variant="h6">#{sale.id}</Typography>
          <Typography variant="body2">{formatDate(sale.sold_at)}</Typography>
          {sale.reference && <Typography variant="body2">Ref: {sale.reference}</Typography>}
        </Box>
      </Box>
      <Box sx={{ mb: 3 }}>
        <Typography variant="overline">Bill to</Typography>
        <Typography variant="h6">{sale.customer_name || "Walk-in customer"}</Typography>
      </Box>
      <Box component="table" sx={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
        <Box component="thead">
          <Box component="tr" sx={{ bgcolor: "#f0fdfa" }}>
            <Box component="th" sx={{ p: 1, borderBottom: "2px solid #0f766e", textAlign: "left" }}>Product</Box>
            <Box component="th" sx={{ p: 1, borderBottom: "2px solid #0f766e", textAlign: "right" }}>Qty</Box>
            <Box component="th" sx={{ p: 1, borderBottom: "2px solid #0f766e", textAlign: "right" }}>Unit price</Box>
            <Box component="th" sx={{ p: 1, borderBottom: "2px solid #0f766e", textAlign: "right" }}>Amount</Box>
          </Box>
        </Box>
        <Box component="tbody">
          {sale.lines.map((line, i) => (
            <Box component="tr" key={i}>
              <Box component="td" sx={{ p: 1, borderBottom: "1px solid #e2e8f0" }}>
                {line.item_name || line.recipe_name}
                {line.allocations && line.allocations.length > 0 && (
                  <Box component="span" sx={{ display: "block", fontSize: 11, color: "#64748b", mt: 0.5 }}>
                    {line.allocations.map((a) => `Batch #${a.batch_id}${a.batch_date ? ` (${a.batch_date})` : ""}: ${a.quantity} units`).join(", ")}
                  </Box>
                )}
              </Box>
              <Box component="td" sx={{ p: 1, borderBottom: "1px solid #e2e8f0", textAlign: "right" }}>{line.quantity}</Box>
              <Box component="td" sx={{ p: 1, borderBottom: "1px solid #e2e8f0", textAlign: "right" }}>{formatMoney(line.unit_price)}</Box>
              <Box component="td" sx={{ p: 1, borderBottom: "1px solid #e2e8f0", textAlign: "right" }}>{formatMoney(line.line_total)}</Box>
            </Box>
          ))}
        </Box>
      </Box>
      <Box sx={{ mt: 2, textAlign: "right" }}>
        <Typography variant="body1" sx={{ fontWeight: 700 }}>Total: {formatMoney(sale.total_amount)}</Typography>
        {sale.amount_paid > 0 && <Typography variant="body2" color="text.secondary">Paid: {formatMoney(sale.amount_paid)}</Typography>}
        {sale.amount_due > 0 && <Typography variant="body2" color="error">Due: {formatMoney(sale.amount_due)}</Typography>}
      </Box>
    </Box>
  );
}

function GSTInvoiceContent({ sale }: { sale: InvoiceSale }) {
  const totalCgst = sale.total_cgst || sale.lines.reduce((s, l) => s + (l.cgst_amount || 0), 0);
  const totalSgst = sale.total_sgst || sale.lines.reduce((s, l) => s + (l.sgst_amount || 0), 0);
  const totalIgst = sale.total_igst || sale.lines.reduce((s, l) => s + (l.igst_amount || 0), 0);
  const totalTaxable = sale.total_taxable || sale.lines.reduce((s, l) => s + (l.taxable_amount || l.line_total), 0);
  const totalTax = totalCgst + totalSgst + totalIgst;

  return (
    <Box sx={{ maxWidth: 760, mx: "auto", color: "#172033" }}>
      <Box sx={{ textAlign: "center", mb: 2, pb: 2, borderBottom: "3px solid #0f766e" }}>
        <Typography variant="h5" sx={{ fontWeight: 800, color: "#0f766e" }}>TAX INVOICE</Typography>
        <Typography variant="body2">Recipe Inventory</Typography>
      </Box>

      <Box sx={{ display: "flex", justifyContent: "space-between", mb: 3, gap: 3, flexWrap: "wrap" }}>
        <Box sx={{ flex: "1 1 280px" }}>
          <Typography variant="overline" sx={{ fontWeight: 700 }}>From</Typography>
          <Typography variant="body1" sx={{ fontWeight: 700 }}>Recipe Inventory</Typography>
          <Typography variant="body2" color="text.secondary">(Your business address)</Typography>
          <Typography variant="body2" color="text.secondary">GSTIN: (Your GSTIN)</Typography>
          <Typography variant="body2" color="text.secondary">State: {sale.place_of_supply || "(Your State)"}</Typography>
        </Box>
        <Box sx={{ flex: "1 1 280px", textAlign: "right" }}>
          <Typography variant="overline" sx={{ fontWeight: 700 }}>Invoice Details</Typography>
          <Typography variant="h6">#{sale.id}</Typography>
          <Typography variant="body2">{formatDate(sale.sold_at)}</Typography>
          {sale.reference && <Typography variant="body2">Ref: {sale.reference}</Typography>}
          <Typography variant="body2">Place of Supply: {sale.place_of_supply || "—"}</Typography>
          {sale.reverse_charge ? <Typography variant="body2" color="error">Reverse Charge: Applicable</Typography> : null}
        </Box>
      </Box>

      <Box sx={{ mb: 3, p: 1.5, bgcolor: "#f8fafc", borderRadius: 1 }}>
        <Typography variant="overline" sx={{ fontWeight: 700 }}>Bill To</Typography>
        <Typography variant="body1" sx={{ fontWeight: 600 }}>{sale.customer_name || "Walk-in customer"}</Typography>
        {sale.customer_address && <Typography variant="body2">{sale.customer_address}</Typography>}
        {sale.customer_gstin && <Typography variant="body2">GSTIN: {sale.customer_gstin}</Typography>}
        {sale.customer_state && <Typography variant="body2">State: {sale.customer_state}</Typography>}
      </Box>

      <Box component="table" sx={{ width: "100%", borderCollapse: "collapse", fontSize: 12, mb: 2 }}>
        <Box component="thead">
          <Box component="tr" sx={{ bgcolor: "#f0fdfa" }}>
            <Box component="th" sx={{ p: 1, borderBottom: "2px solid #0f766e", textAlign: "left", fontSize: 11 }}>#</Box>
            <Box component="th" sx={{ p: 1, borderBottom: "2px solid #0f766e", textAlign: "left", fontSize: 11 }}>Description</Box>
            <Box component="th" sx={{ p: 1, borderBottom: "2px solid #0f766e", textAlign: "left", fontSize: 11 }}>HSN/SAC</Box>
            <Box component="th" sx={{ p: 1, borderBottom: "2px solid #0f766e", textAlign: "right", fontSize: 11 }}>Qty</Box>
            <Box component="th" sx={{ p: 1, borderBottom: "2px solid #0f766e", textAlign: "right", fontSize: 11 }}>Rate</Box>
            <Box component="th" sx={{ p: 1, borderBottom: "2px solid #0f766e", textAlign: "right", fontSize: 11 }}>Amount</Box>
          </Box>
        </Box>
        <Box component="tbody">
          {sale.lines.map((line, i) => (
            <Box component="tr" key={i}>
              <Box component="td" sx={{ p: 0.75, borderBottom: "1px solid #e2e8f0" }}>{i + 1}</Box>
              <Box component="td" sx={{ p: 0.75, borderBottom: "1px solid #e2e8f0" }}>
                {line.item_name || line.recipe_name}
                {line.allocations && line.allocations.length > 0 && (
                  <Box component="span" sx={{ display: "block", fontSize: 10, color: "#64748b" }}>
                    {line.allocations.map((a) => `Batch #${a.batch_id}`).join(", ")}
                  </Box>
                )}
              </Box>
              <Box component="td" sx={{ p: 0.75, borderBottom: "1px solid #e2e8f0" }}>{line.hsn_code || "—"}</Box>
              <Box component="td" sx={{ p: 0.75, borderBottom: "1px solid #e2e8f0", textAlign: "right" }}>{line.quantity}</Box>
              <Box component="td" sx={{ p: 0.75, borderBottom: "1px solid #e2e8f0", textAlign: "right" }}>{formatMoney(line.unit_price)}</Box>
              <Box component="td" sx={{ p: 0.75, borderBottom: "1px solid #e2e8f0", textAlign: "right" }}>{formatMoney(line.taxable_amount || line.line_total)}</Box>
            </Box>
          ))}
        </Box>
      </Box>

      <Box sx={{ display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: 2, mb: 2 }}>
        <Box sx={{ minWidth: 200 }}>
          <Typography variant="body2" sx={{ fontStyle: "italic", color: "text.secondary" }}>
            Amount in words: {numberToWords(sale.total_amount)}
          </Typography>
        </Box>
        <Box>
          <Box component="table" sx={{ borderCollapse: "collapse", fontSize: 12 }}>
            <Box component="tbody">
              <Box component="tr">
                <Box component="td" sx={{ p: 0.5, pr: 2 }}>Taxable Amount</Box>
                <Box component="td" sx={{ p: 0.5, textAlign: "right" }}>{formatMoney(totalTaxable)}</Box>
              </Box>
              {totalCgst > 0 && (
                <Box component="tr">
                  <Box component="td" sx={{ p: 0.5, pr: 2 }}>CGST</Box>
                  <Box component="td" sx={{ p: 0.5, textAlign: "right" }}>{formatMoney(totalCgst)}</Box>
                </Box>
              )}
              {totalSgst > 0 && (
                <Box component="tr">
                  <Box component="td" sx={{ p: 0.5, pr: 2 }}>SGST</Box>
                  <Box component="td" sx={{ p: 0.5, textAlign: "right" }}>{formatMoney(totalSgst)}</Box>
                </Box>
              )}
              {totalIgst > 0 && (
                <Box component="tr">
                  <Box component="td" sx={{ p: 0.5, pr: 2 }}>IGST</Box>
                  <Box component="td" sx={{ p: 0.5, textAlign: "right" }}>{formatMoney(totalIgst)}</Box>
                </Box>
              )}
              <Box component="tr" sx={{ borderTop: "2px solid #0f766e" }}>
                <Box component="td" sx={{ p: 0.5, pr: 2, fontWeight: 700 }}>Total</Box>
                <Box component="td" sx={{ p: 0.5, textAlign: "right", fontWeight: 700 }}>{formatMoney(sale.total_amount)}</Box>
              </Box>
              {sale.amount_paid > 0 && (
                <Box component="tr">
                  <Box component="td" sx={{ p: 0.5, pr: 2, color: "success.main" }}>Paid</Box>
                  <Box component="td" sx={{ p: 0.5, textAlign: "right", color: "success.main" }}>{formatMoney(sale.amount_paid)}</Box>
                </Box>
              )}
              {sale.amount_due > 0 && (
                <Box component="tr">
                  <Box component="td" sx={{ p: 0.5, pr: 2, color: "error.main" }}>Due</Box>
                  <Box component="td" sx={{ p: 0.5, textAlign: "right", color: "error.main" }}>{formatMoney(sale.amount_due)}</Box>
                </Box>
              )}
            </Box>
          </Box>
        </Box>
      </Box>

      <Box sx={{ mt: 3, pt: 2, borderTop: "1px solid #e2e8f0", display: "flex", justifyContent: "space-between" }}>
        <Box>
          <Typography variant="caption" color="text.secondary">Declaration</Typography>
          <Typography variant="body2" sx={{ fontSize: 11, color: "text.secondary" }}>
            We declare that this invoice shows the actual price of the goods described and that all statements are true and correct.
          </Typography>
        </Box>
        <Box sx={{ textAlign: "right" }}>
          <Typography variant="caption" color="text.secondary">For Recipe Inventory</Typography>
          <Box sx={{ mt: 4, borderTop: "1px solid #94a3b8", pt: 0.5, width: 120 }}>
            <Typography variant="caption" color="text.secondary">Authorized Signatory</Typography>
          </Box>
        </Box>
      </Box>
    </Box>
  );
}

interface InvoiceDialogProps {
  open: boolean;
  onClose: () => void;
  sale: InvoiceSale | null;
}

export const InvoiceDialog = ({ open, onClose, sale }: InvoiceDialogProps) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));
  if (!sale) return null;
  const isGst = sale.is_gst_invoice === 1;

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth fullScreen={isMobile} className="print-invoice">
      <DialogTitle sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", pb: 1 }}>
        <Typography variant="h6">{isGst ? "GST Invoice" : "Invoice"} #{sale.id}</Typography>
      </DialogTitle>
      <DialogContent sx={{ p: { xs: 2, sm: 3 } }}>
        {isGst ? <GSTInvoiceContent sale={sale} /> : <SimpleInvoiceContent sale={sale} />}
      </DialogContent>
      <DialogActions className="invoice-actions" sx={{ px: 3, pb: 2 }}>
        <Button onClick={onClose}>Close</Button>
        <Button variant="outlined" onClick={() => printInvoice(sale as any)}>Print / Save PDF</Button>
      </DialogActions>
    </Dialog>
  );
};
