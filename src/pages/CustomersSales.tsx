import { Alert, Autocomplete, Box, Button, Card, CardContent, CircularProgress, Dialog, DialogActions, DialogContent, DialogTitle, FormControl, InputLabel, MenuItem, Paper, Select, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, TextField, Typography } from "@mui/material";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAddCustomer, useAddSale, useCustomerPrices, useCustomerProfile, useCustomers, useSaleableStock, useUpdateCustomer, useSales } from "../hooks/useApi";

type SaleLine = { stock_item_id: number; quantity: number; unit_price: string };

export const CustomersSales = () => {
  const salesOnly = window.location.pathname === "/sales";
  const walkIn = { id: 0, name: "Walk-in customer" };
  const navigate = useNavigate();
  const { data: customers = [] } = useCustomers();
  const customerOptions = [walkIn, ...customers];
  const { data: saleableStock = [] } = useSaleableStock();
  const { data: sales = [] } = useSales();
  const addCustomer = useAddCustomer();
  const updateCustomer = useUpdateCustomer();
  const addSale = useAddSale();
  const [customerId, setCustomerId] = useState(0);
  const { data: prices = [] } = useCustomerPrices(customerId);
  const [customerOpen, setCustomerOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [customer, setCustomer] = useState({ name: "", phone: "", email: "", address: "", credit_limit: 0 });
  const [saleOpen, setSaleOpen] = useState(false);
  const [saleReference, setSaleReference] = useState("");
  const [saleDueDate, setSaleDueDate] = useState("");
  const [amountPaid, setAmountPaid] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("CASH");
  const [paymentReference, setPaymentReference] = useState("");
  const [saleRecipe, setSaleRecipe] = useState(0);
  const [saleQty, setSaleQty] = useState("");
  const [salePrice, setSalePrice] = useState("");
  const [saleLines, setSaleLines] = useState<SaleLine[]>([]);
  const [editingLineIndex, setEditingLineIndex] = useState<number | null>(null);
  const [saleError, setSaleError] = useState("");
  const [customerError, setCustomerError] = useState("");
  const [profileId, setProfileId] = useState(0);
  const [profileStatus, setProfileStatus] = useState("");
  const [profileStart, setProfileStart] = useState("");
  const [profileEnd, setProfileEnd] = useState("");
  const [invoiceSale, setInvoiceSale] = useState<any>(null);
  const { data: profile, isFetching: profileLoading } = useCustomerProfile(profileId, profileStatus, profileStart, profileEnd);
  useEffect(() => {
    if (!saleRecipe) return;
    const item = saleableStock.find((stock: any) => stock.id === saleRecipe);
    const customerPrice = prices.find((price: any) => price.recipe_id === item?.recipe_id)?.price_per_unit;
    const defaultPrice = customerPrice ?? item?.unit_price;
    if (defaultPrice != null) setSalePrice(String(defaultPrice));
  }, [customerId, saleRecipe, saleableStock, prices]);

  const resetCustomer = () => { setCustomer({ name: "", phone: "", email: "", address: "", credit_limit: 0 }); setEditingId(null); setCustomerError(""); };
  const saveCustomer = async () => {
    if (!customer.name.trim()) { setCustomerError("Customer name is required."); return; }
    try {
      if (editingId) await updateCustomer.mutateAsync({ id: editingId, ...customer });
      else await addCustomer.mutateAsync(customer);
      resetCustomer(); setCustomerOpen(false); setCustomerError("");
    } catch (requestError: any) {
      setCustomerError(requestError.response?.data?.detail || "Could not save customer.");
    }
  };
  const addSaleLine = () => {
    const item = saleableStock.find((stock: any) => stock.id === saleRecipe);
    const quantity = Number(saleQty);
    if (!item || item.unit_price <= 0 || !Number.isFinite(quantity) || quantity <= 0 || quantity > item.qty || !Number(salePrice) || Number(salePrice) <= 0 || (editingLineIndex === null && saleLines.some((line) => line.stock_item_id === saleRecipe))) { setSaleError("Choose a priced item, enter a valid quantity within available stock, and enter a price greater than zero."); return; }
    const line = { stock_item_id: saleRecipe, quantity, unit_price: salePrice };
    setSaleLines(editingLineIndex === null ? [...saleLines, line] : saleLines.map((oldLine, index) => index === editingLineIndex ? line : oldLine));
    setSaleRecipe(0); setSaleQty(""); setSalePrice(""); setEditingLineIndex(null); setSaleError("");
  };
  const saveSale = async () => {
    if (!saleLines.length) { setSaleError("Add at least one product to the sale."); return; }
    try {
      const paid = amountPaid ? Number(amountPaid) : 0;
      await addSale.mutateAsync({ customer_id: customerId || undefined, reference: saleReference || undefined, due_date: saleDueDate || undefined, payment_status: "PENDING", amount_paid: paid, payment_method: paymentMethod, payment_reference: paymentReference || undefined, lines: saleLines.map((line) => ({ stock_item_id: line.stock_item_id, quantity: line.quantity, unit_price: line.unit_price ? Number(line.unit_price) : undefined })) });
      setSaleOpen(false); setSaleLines([]); setEditingLineIndex(null); setSaleReference(""); setSaleDueDate(""); setAmountPaid(""); setPaymentReference(""); setPaymentMethod("CASH"); setCustomerId(0); setSaleError("");
    } catch (requestError: any) { setSaleError(requestError.response?.data?.detail || "Could not record sale."); }
  };
  const exportSales = () => {
    const rows = [["Invoice", "Date", "Customer", "Status", "Total", "Paid", "Due"], ...sales.map((sale: any) => [sale.id, sale.sold_at, sale.customer_name || "Walk-in", sale.payment_status, sale.total_amount, sale.amount_paid, sale.amount_due])];
    const csv = rows.map((row) => row.map((value) => `"${String(value).replace(/"/g, '""')}"`).join(",")).join("\n");
    const link = document.createElement("a");
    link.href = URL.createObjectURL(new Blob([csv], { type: "text/csv" }));
    link.download = "sales.csv";
    link.click();
    URL.revokeObjectURL(link.href);
  };
  return <Box className="screen-content">
    <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1.5, justifyContent: "space-between", alignItems: "center" }}><Typography variant="h4" gutterBottom>Customers & Sales</Typography></Box>
    {!salesOnly && <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", md: "1fr 1fr" }, gap: 3 }}>
      <Card><CardContent><Box sx={{ display: "flex", justifyContent: "space-between", mb: 2 }}><Typography variant="h6">Customers</Typography><Button variant="contained" onClick={() => { resetCustomer(); setCustomerOpen(true); }}>Add customer</Button></Box><Table size="small"><TableHead><TableRow><TableCell>Name</TableCell><TableCell>Phone</TableCell><TableCell>Credit limit</TableCell><TableCell>Actions</TableCell></TableRow></TableHead><TableBody>{customers.map((item: any) => <TableRow key={item.id} hover onClick={() => navigate(`/customers/${item.id}`)} sx={{ cursor: "pointer" }}><TableCell>{item.name}</TableCell><TableCell>{item.phone || "—"}</TableCell><TableCell>₹{(item.credit_limit || 0).toFixed(2)}</TableCell><TableCell><Button size="small" onClick={(event) => { event.stopPropagation(); setEditingId(item.id); setCustomer({ name: item.name, phone: item.phone || "", email: item.email || "", address: item.address || "", credit_limit: item.credit_limit || 0 }); setCustomerOpen(true); }}>Edit</Button></TableCell></TableRow>)}</TableBody></Table></CardContent></Card>
    </Box>}
    {salesOnly && <><Box sx={{ display: "flex", flexWrap: "wrap", gap: 1.5, justifyContent: "space-between", alignItems: "center", mt: 4, mb: 2 }}><Typography variant="h6">Sales history</Typography><Box sx={{ display: "flex", flexWrap: "wrap", gap: 1 }}><Button onClick={exportSales}>Export CSV</Button><Button onClick={() => window.print()}>Print</Button><Button variant="contained" onClick={() => { setSaleLines([]); setCustomerId(0); setSaleError(""); setSaleOpen(true); }}>Record sale</Button></Box></Box>
    <TableContainer component={Paper}><Table><TableHead><TableRow><TableCell>Invoice</TableCell><TableCell>Date</TableCell><TableCell>Customer</TableCell><TableCell>Products</TableCell><TableCell>Status</TableCell><TableCell>Total</TableCell><TableCell>Invoice</TableCell></TableRow></TableHead><TableBody>{sales.map((sale: any) => <TableRow key={sale.id}><TableCell>#{sale.id}{sale.reference ? ` · ${sale.reference}` : ""}</TableCell><TableCell>{new Date(sale.sold_at).toLocaleDateString()}</TableCell><TableCell>{sale.customer_name || "Walk-in"}</TableCell><TableCell>{sale.lines.map((line: any) =>     `${line.item_name || line.recipe_name} × ${line.quantity}`).join(", ")}</TableCell><TableCell>{sale.payment_status}</TableCell><TableCell>₹{sale.total_amount.toFixed(2)}</TableCell><TableCell><Button size="small" onClick={() => setInvoiceSale(sale)}>View / Print</Button></TableCell></TableRow>)}</TableBody></Table></TableContainer>
    </>}
    <Dialog open={customerOpen} onClose={() => setCustomerOpen(false)}><DialogTitle>{editingId ? "Edit customer" : "Add customer"}</DialogTitle><DialogContent>{customerError && <Alert severity="error" sx={{ mt: 1 }}>{customerError}</Alert>}<TextField margin="dense" label="Name" fullWidth value={customer.name} onChange={(e) => setCustomer({ ...customer, name: e.target.value })} /><TextField margin="dense" label="Phone" fullWidth value={customer.phone} onChange={(e) => setCustomer({ ...customer, phone: e.target.value })} /><TextField margin="dense" label="Email" fullWidth value={customer.email} onChange={(e) => setCustomer({ ...customer, email: e.target.value })} /><TextField margin="dense" label="Address" fullWidth multiline value={customer.address} onChange={(e) => setCustomer({ ...customer, address: e.target.value })} /><TextField margin="dense" label="Credit limit" type="number" fullWidth value={customer.credit_limit} onChange={(e) => setCustomer({ ...customer, credit_limit: Number(e.target.value) })} /></DialogContent><DialogActions><Button onClick={() => setCustomerOpen(false)}>Cancel</Button><Button variant="contained" onClick={saveCustomer}>Save</Button></DialogActions></Dialog>
    <Dialog open={saleOpen} onClose={() => setSaleOpen(false)} maxWidth="sm" fullWidth><DialogTitle>Record sale</DialogTitle><DialogContent>{saleError && <Alert severity="error" sx={{ mt: 1 }} onClose={() => setSaleError("")}>{saleError}</Alert>}<Autocomplete options={customerOptions} getOptionLabel={(item: any) => item.name} value={customerOptions.find((item: any) => item.id === customerId) || walkIn} onChange={(_, item) => { setCustomerId(item?.id || 0); setSalePrice(""); }} renderInput={(params) => <TextField {...params} margin="dense" label="Customer" />} />    <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>Selling price comes from the pack type. Calculated cost includes production cost plus packing materials.</Typography><Box sx={{ display: "flex", flexWrap: "wrap", gap: 1, mt: 1 }}><FormControl sx={{ flex: "1 1 180px" }} size="small">    <InputLabel>Items</InputLabel><Select value={saleRecipe} label="Items" onChange={(event) => { const itemId = Number(event.target.value); setSaleRecipe(itemId); const item = saleableStock.find((stock: any) => stock.id === itemId); setSalePrice(item?.unit_price > 0 ? String(item.unit_price) : ""); }}>{saleableStock.map((item: any) => <MenuItem key={item.id} value={item.id}>{item.name} · {item.qty} {item.unit} · Sell ₹{item.unit_price > 0 ? item.unit_price.toFixed(2) : "not set"} · Cost ₹{item.cost_per_unit > 0 ? item.cost_per_unit.toFixed(2) : "not calculated"}</MenuItem>)}</Select></FormControl><TextField sx={{ flex: "1 1 90px" }} size="small" label="Qty" type="number" value={saleQty} onChange={(e) => setSaleQty(e.target.value)} /><TextField sx={{ flex: "1 1 120px" }} size="small" label="Selling price" type="number" value={salePrice} onChange={(e) => setSalePrice(e.target.value)} /><Button onClick={addSaleLine}>{editingLineIndex === null ? "Add" : "Update"}</Button></Box>{saleLines.map((line, index) => <Box key={`${line.stock_item_id}-${index}`} sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mt: 1 }}><Typography>{saleableStock.find((item: any) => item.id === line.stock_item_id)?.name}: {line.quantity} @ ₹{line.unit_price}</Typography><Box><Button size="small" onClick={() => { setEditingLineIndex(index); setSaleRecipe(line.stock_item_id); setSaleQty(String(line.quantity)); setSalePrice(String(line.unit_price)); }}>Edit</Button><Button size="small" color="error" onClick={() => setSaleLines(saleLines.filter((_, lineIndex) => lineIndex !== index))}>Remove</Button></Box></Box>)}<Typography variant="h6" sx={{ mt: 2, textAlign: "right" }}>Total: ₹{saleLines.reduce((sum, line) => sum + line.quantity * Number(line.unit_price), 0).toFixed(2)}</Typography><Typography variant="subtitle2" sx={{ mt: 2 }}>Payment</Typography><Box sx={{ display: "flex", gap: 1, flexWrap: "wrap" }}><TextField sx={{ flex: "1 1 150px" }} margin="dense" label="Paid now (optional)" type="number" value={amountPaid} onChange={(e) => setAmountPaid(e.target.value)} /><Select sx={{ flex: "1 1 130px", mt: 1 }} size="small" value={paymentMethod} onChange={(e) => setPaymentMethod(e.target.value)}><MenuItem value="CASH">Cash</MenuItem><MenuItem value="UPI">UPI</MenuItem><MenuItem value="BANK">Bank transfer</MenuItem><MenuItem value="CHEQUE">Cheque</MenuItem></Select><TextField sx={{ flex: "1 1 180px" }} margin="dense" label="Payment reference" value={paymentReference} onChange={(e) => setPaymentReference(e.target.value)} /></Box><TextField margin="dense" label="Invoice / reference" fullWidth value={saleReference} onChange={(e) => setSaleReference(e.target.value)} /><TextField margin="dense" label="Due date" type="date" fullWidth value={saleDueDate} onChange={(e) => setSaleDueDate(e.target.value)} slotProps={{ inputLabel: { shrink:     true } }} /></DialogContent><DialogActions><Button onClick={() => setSaleOpen(false)} disabled={addSale.isPending}>Cancel</Button><Button variant="contained" onClick={saveSale} disabled={addSale.isPending}>{addSale.isPending ? <CircularProgress size={20} color="inherit" /> : "Record sale"}</Button></DialogActions></Dialog>
    <Dialog open={!!profileId} onClose={() => setProfileId(0)} maxWidth="lg" fullWidth><DialogTitle>{profile?.name || "Customer profile"}</DialogTitle><DialogContent>{profile && <><Typography color="text.secondary">{profile.phone || "No phone"} · {profile.email || "No email"} · Credit limit: ₹{(profile.credit_limit || 0).toFixed(2)}</Typography><Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr 1fr", md: "repeat(4, 1fr)" }, gap: 2, my: 2 }}><Card><CardContent><Typography variant="caption">Sales</Typography><Typography variant="h6">{profile.total_sales}</Typography></CardContent></Card><Card><CardContent><Typography variant="caption">Billed</Typography><Typography variant="h6">₹{profile.total_billed.toFixed(2)}</Typography></CardContent></Card><Card><CardContent><Typography variant="caption">Paid</Typography><Typography variant="h6">₹{profile.total_paid.toFixed(2)}</Typography></CardContent></Card><Card><CardContent><Typography variant="caption">Due</Typography><Typography variant="h6" color={profile.total_due ? "error" : "success.main"}>₹{profile.total_due.toFixed(2)}</Typography></CardContent></Card></Box><Box sx={{ display: "flex", gap: 1, mb: 2, flexWrap: "wrap" }}><FormControl size="small" sx={{ minWidth: 140 }}><InputLabel>Status</InputLabel><Select value={profileStatus} label="Status" onChange={(e) => setProfileStatus(e.target.value)}><MenuItem value="">All</MenuItem><MenuItem value="PAID">Paid</MenuItem><MenuItem value="PARTIAL">Partial</MenuItem><MenuItem value="PENDING">Pending</MenuItem></Select></FormControl><TextField size="small" label="From" type="date" value={profileStart} onChange={(e) => setProfileStart(e.target.value)} slotProps={{ inputLabel: { shrink: true } }} /><TextField size="small" label="To" type="date" value={profileEnd} onChange={(e) => setProfileEnd(e.target.value)} slotProps={{ inputLabel: { shrink: true } }} /></Box>{profileLoading ? <Typography>Loading...</Typography> : <Table size="small"><TableHead><TableRow><TableCell>Invoice</TableCell><TableCell>Date</TableCell><TableCell>Due date</TableCell><TableCell>Products</TableCell><TableCell>Status</TableCell><TableCell>Billed</TableCell><TableCell>Paid</TableCell><TableCell>Due</TableCell><TableCell>Action</TableCell></TableRow></TableHead><TableBody>{profile.sales.map((sale: any) => <TableRow key={sale.id}><TableCell>#{sale.id} {sale.reference || ""}</TableCell><TableCell>{new Date(sale.sold_at).toLocaleDateString()}</TableCell><TableCell>{sale.due_date || "—"}</TableCell><TableCell>{sale.lines.map((line: any) => `${line.recipe_name} × ${line.quantity}`).join(", ")}</TableCell><TableCell>{sale.payment_status}</TableCell><TableCell>₹{sale.total_amount.toFixed(2)}</TableCell><TableCell>₹{sale.amount_paid.toFixed(2)}</TableCell><TableCell>₹{sale.amount_due.toFixed(2)}</TableCell></TableRow>)}</TableBody></Table>}</>}</DialogContent><DialogActions><Button onClick={() => setProfileId(0)}>Close</Button></DialogActions></Dialog>
    {invoiceSale && <Box className="print-invoice"><Box sx={{ maxWidth: 760, mx: "auto", p: { xs: 2, sm: 5 }, color: "#172033" }}><Box sx={{ display: "flex", justifyContent: "space-between", borderBottom: "3px solid #0f766e", pb: 2, mb: 3 }}><Box><Typography variant="h4" sx={{ fontWeight: 800, color: "#0f766e" }}>INVOICE</Typography><Typography variant="body2">Recipe Inventory</Typography></Box><Box sx={{ textAlign: "right" }}><Typography variant="h6">#{invoiceSale.id}</Typography><Typography variant="body2">{new Date(invoiceSale.sold_at).toLocaleDateString()}</Typography>{invoiceSale.reference && <Typography variant="body2">Ref: {invoiceSale.reference}</Typography>}</Box></Box><Box sx={{ mb: 3 }}><Typography variant="overline">Bill to</Typography><Typography variant="h6">{invoiceSale.customer_name || "Walk-in customer"}</Typography></Box><Table size="small"><TableHead><TableRow sx={{ bgcolor: "#f0fdfa" }}><TableCell>Product</TableCell><TableCell align="right">Qty</TableCell><TableCell align="right">Unit price</TableCell><TableCell align="right">Amount</TableCell></TableRow></TableHead><TableBody>{invoiceSale.lines.map((line: any) => <TableRow key={line.recipe_id}>    <TableCell>{line.item_name || line.recipe_name}</TableCell><TableCell align="right">{line.quantity}</TableCell><TableCell align="right">₹{line.unit_price.toFixed(2)}</TableCell><TableCell align="right">₹{line.line_total.toFixed(2)}</TableCell></TableRow>)}</TableBody></Table><Box sx={{ ml: "auto", maxWidth: 280, mt: 3 }}><Box sx={{ display: "flex", justifyContent: "space-between" }}><Typography>Total</Typography><Typography sx={{ fontWeight: 700 }}>₹{invoiceSale.total_amount.toFixed(2)}</Typography></Box><Box sx={{ display: "flex", justifyContent: "space-between" }}><Typography>Paid</Typography><Typography>₹{invoiceSale.amount_paid.toFixed(2)}</Typography></Box><Box sx={{ display: "flex", justifyContent: "space-between", borderTop: "1px solid #ddd", mt: 1, pt: 1 }}><Typography sx={{ fontWeight: 700 }}>Due</Typography><Typography sx={{ fontWeight: 700, color: invoiceSale.amount_due ? "#dc2626" : "#15803d" }}>₹{invoiceSale.amount_due.toFixed(2)}</Typography></Box></Box><Typography sx={{ mt: 5, textAlign: "center", color: "#64748b" }}>Thank you for your business.</Typography></Box><Box className="invoice-actions" sx={{ textAlign: "center", pb: 2 }}><Button variant="contained" onClick={() => window.print()}>Print / Save PDF</Button><Button sx={{ ml: 1 }} onClick={() => setInvoiceSale(null)}>Close</Button></Box></Box>}
  </Box>;
};
