import { Alert, Box, Button, Card, CardContent, Dialog, DialogActions, DialogContent, DialogTitle, FormControl, InputLabel, MenuItem, Paper, Select, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, TextField, Typography } from "@mui/material";
import { useEffect, useState } from "react";
import { useAddCustomer, useAddSale, useCustomerPrices, useCustomerProfile, useCustomers, useRecipes, useSetCustomerPrice, useUpdateCustomer, useSales } from "../hooks/useApi";

type SaleLine = { recipe_id: number; quantity: number; unit_price: string };

export const CustomersSales = () => {
  const { data: customers = [] } = useCustomers();
  const { data: recipes = [] } = useRecipes();
  const { data: sales = [] } = useSales();
  const addCustomer = useAddCustomer();
  const updateCustomer = useUpdateCustomer();
  const addSale = useAddSale();
  const setPrice = useSetCustomerPrice();
  const [customerId, setCustomerId] = useState(0);
  const { data: prices = [] } = useCustomerPrices(customerId);
  const [customerOpen, setCustomerOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [customer, setCustomer] = useState({ name: "", phone: "", email: "", address: "" });
  const [priceRecipe, setPriceRecipe] = useState(0);
  const [priceValue, setPriceValue] = useState("");
  const [saleOpen, setSaleOpen] = useState(false);
  const [saleReference, setSaleReference] = useState("");
  const [paymentStatus, setPaymentStatus] = useState("PENDING");
  const [saleRecipe, setSaleRecipe] = useState(0);
  const [saleQty, setSaleQty] = useState("");
  const [salePrice, setSalePrice] = useState("");
  const [amountPaid, setAmountPaid] = useState("");
  const [saleLines, setSaleLines] = useState<SaleLine[]>([]);
  const [error, setError] = useState("");
  const [profileId, setProfileId] = useState(0);
  const [profileStatus, setProfileStatus] = useState("");
  const [profileStart, setProfileStart] = useState("");
  const [profileEnd, setProfileEnd] = useState("");
  const { data: profile, isFetching: profileLoading } = useCustomerProfile(profileId, profileStatus, profileStart, profileEnd);
  useEffect(() => {
    if (!saleRecipe || salePrice) return;
    const customerPrice = prices.find((item: any) => item.recipe_id === saleRecipe);
    const recipe = recipes.find((item: any) => item.id === saleRecipe);
    const defaultPrice = customerPrice?.price_per_unit ?? recipe?.selling_price;
    if (defaultPrice != null) setSalePrice(String(defaultPrice));
  }, [customerId, saleRecipe, prices, recipes, salePrice]);

  const resetCustomer = () => { setCustomer({ name: "", phone: "", email: "", address: "" }); setEditingId(null); };
  const saveCustomer = async () => {
    if (!customer.name.trim()) { setError("Customer name is required."); return; }
    if (editingId) await updateCustomer.mutateAsync({ id: editingId, ...customer });
    else await addCustomer.mutateAsync(customer);
    resetCustomer(); setCustomerOpen(false);
  };
  const addPrice = async () => {
    if (!customerId || !priceRecipe || !Number.isFinite(Number(priceValue)) || Number(priceValue) < 0) { setError("Select a customer and recipe and enter a valid price."); return; }
    await setPrice.mutateAsync({ customer_id: customerId, recipe_id: priceRecipe, price_per_unit: Number(priceValue) });
    setPriceRecipe(0); setPriceValue(""); setError("");
  };
  const addSaleLine = () => {
    const recipe = recipes.find((item: any) => item.id === saleRecipe);
    const quantity = Number(saleQty);
    if (!recipe || !Number.isFinite(quantity) || quantity <= 0 || saleLines.some((line) => line.recipe_id === saleRecipe)) { setError("Choose a new recipe and enter a quantity greater than zero."); return; }
    setSaleLines([...saleLines, { recipe_id: saleRecipe, quantity, unit_price: salePrice }]);
    setSaleRecipe(0); setSaleQty(""); setSalePrice(""); setError("");
  };
  const saveSale = async () => {
    if (!saleLines.length) { setError("Add at least one product to the sale."); return; }
    try {
      await addSale.mutateAsync({ customer_id: customerId || undefined, reference: saleReference || undefined, payment_status: paymentStatus, amount_paid: amountPaid ? Number(amountPaid) : 0, lines: saleLines.map((line) => ({ recipe_id: line.recipe_id, quantity: line.quantity, unit_price: line.unit_price ? Number(line.unit_price) : undefined })) });
      setSaleOpen(false); setSaleLines([]); setSaleReference(""); setAmountPaid(""); setError("");
    } catch (requestError: any) { setError(requestError.response?.data?.detail || "Could not record sale."); }
  };

  return <Box>
    <Typography variant="h4" gutterBottom>Customers & Sales</Typography>
    {error && <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError("")}>{error}</Alert>}
    <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", md: "1fr 1fr" }, gap: 3 }}>
      <Card><CardContent><Box sx={{ display: "flex", justifyContent: "space-between", mb: 2 }}><Typography variant="h6">Customers</Typography><Button variant="contained" onClick={() => { resetCustomer(); setCustomerOpen(true); }}>Add customer</Button></Box><Table size="small"><TableHead><TableRow><TableCell>Name</TableCell><TableCell>Phone</TableCell><TableCell>Actions</TableCell></TableRow></TableHead><TableBody>{customers.map((item: any) => <TableRow key={item.id} hover onClick={() => setProfileId(item.id)} sx={{ cursor: "pointer" }}><TableCell>{item.name}</TableCell><TableCell>{item.phone || "—"}</TableCell><TableCell><Button size="small" onClick={(event) => { event.stopPropagation(); setEditingId(item.id); setCustomer({ name: item.name, phone: item.phone || "", email: item.email || "", address: item.address || "" }); setCustomerOpen(true); }}>Edit</Button></TableCell></TableRow>)}</TableBody></Table></CardContent></Card>
      <Card><CardContent><Typography variant="h6" gutterBottom>Customer recipe prices</Typography><FormControl fullWidth size="small"><InputLabel>Customer</InputLabel><Select value={customerId} label="Customer" onChange={(event) => setCustomerId(Number(event.target.value))}>{customers.map((item: any) => <MenuItem key={item.id} value={item.id}>{item.name}</MenuItem>)}</Select></FormControl>{customerId && <><Box sx={{ display: "flex", gap: 1, mt: 2 }}><FormControl fullWidth size="small"><InputLabel>Recipe</InputLabel><Select value={priceRecipe} label="Recipe" onChange={(event) => setPriceRecipe(Number(event.target.value))}>{recipes.map((item: any) => <MenuItem key={item.id} value={item.id}>{item.name}</MenuItem>)}</Select></FormControl><TextField size="small" label="Price / unit" type="number" value={priceValue} onChange={(event) => setPriceValue(event.target.value)} /><Button variant="outlined" onClick={addPrice}>Save</Button></Box><Table size="small" sx={{ mt: 2 }}><TableHead><TableRow><TableCell>Recipe</TableCell><TableCell>Customer price</TableCell></TableRow></TableHead><TableBody>{prices.map((item: any) => <TableRow key={item.id}><TableCell>{item.recipe_name}</TableCell><TableCell>₹{item.price_per_unit.toFixed(2)}</TableCell></TableRow>)}</TableBody></Table></>}</CardContent></Card>
    </Box>
    <Box sx={{ display: "flex", justifyContent: "space-between", mt: 4, mb: 2 }}><Typography variant="h6">Sales history</Typography><Button variant="contained" onClick={() => { setSaleLines([]); setAmountPaid(""); setSaleOpen(true); }}>Record sale</Button></Box>
    <TableContainer component={Paper}><Table><TableHead><TableRow><TableCell>Invoice</TableCell><TableCell>Date</TableCell><TableCell>Customer</TableCell><TableCell>Products</TableCell><TableCell>Status</TableCell><TableCell>Total</TableCell></TableRow></TableHead><TableBody>{sales.map((sale: any) => <TableRow key={sale.id}><TableCell>#{sale.id}{sale.reference ? ` · ${sale.reference}` : ""}</TableCell><TableCell>{new Date(sale.sold_at).toLocaleDateString()}</TableCell><TableCell>{sale.customer_name || "Walk-in"}</TableCell><TableCell>{sale.lines.map((line: any) => `${line.recipe_name} × ${line.quantity}`).join(", ")}</TableCell><TableCell>{sale.payment_status}</TableCell><TableCell>₹{sale.total_amount.toFixed(2)}</TableCell></TableRow>)}</TableBody></Table></TableContainer>
    <Dialog open={customerOpen} onClose={() => setCustomerOpen(false)}><DialogTitle>{editingId ? "Edit customer" : "Add customer"}</DialogTitle><DialogContent><TextField margin="dense" label="Name" fullWidth value={customer.name} onChange={(e) => setCustomer({ ...customer, name: e.target.value })} /><TextField margin="dense" label="Phone" fullWidth value={customer.phone} onChange={(e) => setCustomer({ ...customer, phone: e.target.value })} /><TextField margin="dense" label="Email" fullWidth value={customer.email} onChange={(e) => setCustomer({ ...customer, email: e.target.value })} /><TextField margin="dense" label="Address" fullWidth multiline value={customer.address} onChange={(e) => setCustomer({ ...customer, address: e.target.value })} /></DialogContent><DialogActions><Button onClick={() => setCustomerOpen(false)}>Cancel</Button><Button variant="contained" onClick={saveCustomer}>Save</Button></DialogActions></Dialog>
    <Dialog open={saleOpen} onClose={() => setSaleOpen(false)} maxWidth="sm" fullWidth><DialogTitle>Record sale</DialogTitle><DialogContent><FormControl fullWidth margin="dense"><InputLabel>Customer (optional)</InputLabel><Select value={customerId} label="Customer (optional)" onChange={(event) => { setCustomerId(Number(event.target.value)); setSalePrice(""); }}><MenuItem value={0}>Walk-in customer</MenuItem>{customers.map((item: any) => <MenuItem key={item.id} value={item.id}>{item.name}</MenuItem>)}</Select></FormControl><TextField margin="dense" label="Invoice / reference" fullWidth value={saleReference} onChange={(e) => setSaleReference(e.target.value)} /><FormControl fullWidth margin="dense"><InputLabel>Payment status</InputLabel><Select value={paymentStatus} label="Payment status" onChange={(event) => setPaymentStatus(event.target.value)}><MenuItem value="PAID">Paid</MenuItem><MenuItem value="PENDING">Pending</MenuItem><MenuItem value="PARTIAL">Partial</MenuItem></Select></FormControl><TextField margin="dense" label="Amount paid" type="number" fullWidth value={amountPaid} onChange={(e) => setAmountPaid(e.target.value)} /><Box sx={{ display: "flex", gap: 1, mt: 1 }}><FormControl fullWidth size="small"><InputLabel>Recipe</InputLabel><Select value={saleRecipe} label="Recipe" onChange={(event) => { const recipeId = Number(event.target.value); setSaleRecipe(recipeId); const customerPrice = prices.find((item: any) => item.recipe_id === recipeId); const recipe = recipes.find((item: any) => item.id === recipeId); setSalePrice(String(customerPrice?.price_per_unit ?? recipe?.selling_price ?? "")); }}>{recipes.map((item: any) => <MenuItem key={item.id} value={item.id}>{item.name}</MenuItem>)}</Select></FormControl><TextField size="small" label="Qty" type="number" value={saleQty} onChange={(e) => setSaleQty(e.target.value)} /><TextField size="small" label="Price (editable)" type="number" value={salePrice} onChange={(e) => setSalePrice(e.target.value)} /><Button onClick={addSaleLine}>Add</Button></Box>{saleLines.map((line) => <Typography key={line.recipe_id} variant="body2" sx={{ mt: 1 }}>{recipes.find((item: any) => item.id === line.recipe_id)?.name}: {line.quantity} @ ₹{line.unit_price || "customer/default price"}</Typography>)}</DialogContent><DialogActions><Button onClick={() => setSaleOpen(false)}>Cancel</Button><Button variant="contained" onClick={saveSale} disabled={addSale.isPending}>Record sale</Button></DialogActions></Dialog>
    <Dialog open={!!profileId} onClose={() => setProfileId(0)} maxWidth="lg" fullWidth><DialogTitle>{profile?.name || "Customer profile"}</DialogTitle><DialogContent>{profile && <><Typography color="text.secondary">{profile.phone || "No phone"} · {profile.email || "No email"}</Typography><Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr 1fr", md: "repeat(4, 1fr)" }, gap: 2, my: 2 }}><Card><CardContent><Typography variant="caption">Sales</Typography><Typography variant="h6">{profile.total_sales}</Typography></CardContent></Card><Card><CardContent><Typography variant="caption">Billed</Typography><Typography variant="h6">₹{profile.total_billed.toFixed(2)}</Typography></CardContent></Card><Card><CardContent><Typography variant="caption">Paid</Typography><Typography variant="h6">₹{profile.total_paid.toFixed(2)}</Typography></CardContent></Card><Card><CardContent><Typography variant="caption">Due</Typography><Typography variant="h6" color={profile.total_due ? "error" : "success.main"}>₹{profile.total_due.toFixed(2)}</Typography></CardContent></Card></Box><Box sx={{ display: "flex", gap: 1, mb: 2, flexWrap: "wrap" }}><FormControl size="small" sx={{ minWidth: 140 }}><InputLabel>Status</InputLabel><Select value={profileStatus} label="Status" onChange={(e) => setProfileStatus(e.target.value)}><MenuItem value="">All</MenuItem><MenuItem value="PAID">Paid</MenuItem><MenuItem value="PARTIAL">Partial</MenuItem><MenuItem value="PENDING">Pending</MenuItem></Select></FormControl><TextField size="small" label="From" type="date" value={profileStart} onChange={(e) => setProfileStart(e.target.value)} slotProps={{ inputLabel: { shrink: true } }} /><TextField size="small" label="To" type="date" value={profileEnd} onChange={(e) => setProfileEnd(e.target.value)} slotProps={{ inputLabel: { shrink: true } }} /></Box>{profileLoading ? <Typography>Loading...</Typography> : <Table size="small"><TableHead><TableRow><TableCell>Invoice</TableCell><TableCell>Date</TableCell><TableCell>Products</TableCell><TableCell>Status</TableCell><TableCell>Billed</TableCell><TableCell>Paid</TableCell><TableCell>Due</TableCell></TableRow></TableHead><TableBody>{profile.sales.map((sale: any) => <TableRow key={sale.id}><TableCell>#{sale.id} {sale.reference || ""}</TableCell><TableCell>{new Date(sale.sold_at).toLocaleDateString()}</TableCell><TableCell>{sale.lines.map((line: any) => `${line.recipe_name} × ${line.quantity}`).join(", ")}</TableCell><TableCell>{sale.payment_status}</TableCell><TableCell>₹{sale.total_amount.toFixed(2)}</TableCell><TableCell>₹{sale.amount_paid.toFixed(2)}</TableCell><TableCell>₹{sale.amount_due.toFixed(2)}</TableCell></TableRow>)}</TableBody></Table>}</>}</DialogContent><DialogActions><Button onClick={() => setProfileId(0)}>Close</Button></DialogActions></Dialog>
  </Box>;
};
