import { Alert, Box, Button, Card, CardContent, FormControl, InputLabel, MenuItem, Select, Stack, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, TextField, Typography, useMediaQuery, useTheme } from "@mui/material";
import { useState } from "react";
import { useAddPackType, usePackTypes, usePackingMaterials, useUpdatePackType } from "../hooks/useApi";
import { EmptyState, PageHeader, TableSkeleton } from "../components/ui";

type MaterialLine = { material_id: number; qty_per_pack: string };

export const PackTypes = () => {
  const { data: packTypes = [], isLoading: typesLoading } = usePackTypes();
  const { data: materials = [], isLoading: materialsLoading } = usePackingMaterials();
  const addPackType = useAddPackType();
  const updatePackType = useUpdatePackType();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));
  const [name, setName] = useState("");
  const [size, setSize] = useState("");
  const [sellingPrice, setSellingPrice] = useState("");
  const [materialId, setMaterialId] = useState("");
  const [materialQty, setMaterialQty] = useState("");
  const [materialLines, setMaterialLines] = useState<MaterialLine[]>([]);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [error, setError] = useState("");

  const reset = () => {
    setName("");
    setSize("");
    setSellingPrice("");
    setMaterialId("");
    setMaterialQty("");
    setMaterialLines([]);
    setEditingId(null);
  };

  const addMaterial = () => {
    const id = Number(materialId);
    const qty = Number(materialQty);
    if (!id || !Number.isFinite(qty) || qty <= 0) {
      setError("Select a packing material and enter a valid quantity per pack.");
      return;
    }
    if (materialLines.some((line) => line.material_id === id)) {
      setError("That packing material is already included.");
      return;
    }
    setMaterialLines([...materialLines, { material_id: id, qty_per_pack: String(qty) }]);
    setMaterialId("");
    setMaterialQty("");
    setError("");
  };

  const submit = async () => {
    const parsedSize = Number(size);
    const parsedSellingPrice = sellingPrice === "" ? null : Number(sellingPrice);
    if (!name.trim() || !Number.isFinite(parsedSize) || parsedSize <= 0 || (parsedSellingPrice !== null && (!Number.isFinite(parsedSellingPrice) || parsedSellingPrice < 0))) {
      setError("Enter a name, pack size, and valid optional selling price.");
      return;
    }
    try {
      const payload = {
        name: name.trim(),
        size_grams: parsedSize,
        selling_price: parsedSellingPrice,
        materials: materialLines.map((line) => ({ material_id: line.material_id, qty_per_pack: Number(line.qty_per_pack) })),
      };
      if (editingId) await updatePackType.mutateAsync({ id: editingId, ...payload });
      else await addPackType.mutateAsync(payload);
      reset();
      setError("");
    } catch (requestError: any) {
      setError(requestError.response?.data?.detail || "Could not save pack type.");
    }
  };

  const edit = (item: any) => {
    setEditingId(item.id);
    setName(item.name);
    setSize(String(item.size_grams));
    setSellingPrice(item.selling_price == null ? "" : String(item.selling_price));
    setMaterialLines((item.materials || []).map((line: any) => ({ material_id: line.material_id, qty_per_pack: String(line.qty_per_pack) })));
  };

  const materialName = (id: number) => materials.find((material: any) => material.id === id)?.name || "Unknown";

  return (
    <Box>
      <PageHeader
        title="Pack Types"
        subtitle="Define pack size, required packing materials, and selling price. Packaging cost is calculated from current packing-material costs."
      />
      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
      <Card sx={{ maxWidth: 1100 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>{editingId ? "Edit pack type" : "Add pack type"}</Typography>
          <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap", mb: 2 }}>
            <TextField size="small" label="Name" value={name} onChange={(event) => setName(event.target.value)} sx={{ flex: "1 1 200px" }} />
            <TextField size="small" label="Size (grams)" type="number" value={size} onChange={(event) => setSize(event.target.value)} sx={{ flex: "1 1 140px" }} />
            <TextField size="small" label="Selling price per pack (₹)" type="number" value={sellingPrice} onChange={(event) => setSellingPrice(event.target.value)} sx={{ flex: "1 1 180px" }} />
          </Box>
          <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap", alignItems: "center", mb: 2 }}>
            <FormControl size="small" sx={{ flex: "1 1 220px", minWidth: 0 }} disabled={materialsLoading}>
              <InputLabel>{materialsLoading ? "Loading materials..." : "Packing material"}</InputLabel>
              <Select value={materialId} label={materialsLoading ? "Loading materials..." : "Packing material"} onChange={(event) => setMaterialId(String(event.target.value))}>
                {materials.map((material: any) => <MenuItem key={material.id} value={material.id}>{material.name} ({material.unit}) · ₹{material.unit_price.toFixed(2)}</MenuItem>)}
              </Select>
            </FormControl>
            <TextField size="small" label="Quantity per pack" type="number" value={materialQty} onChange={(event) => setMaterialQty(event.target.value)} sx={{ flex: "1 1 160px", minWidth: 0 }} />
            <Button variant="outlined" onClick={addMaterial} sx={{ flexShrink: 0 }}>Add material</Button>
          </Box>

          {isMobile ? (
            <Stack spacing={1.5} sx={{ mb: 2 }}>
              {materialLines.length ? materialLines.map((line) => {
                const material = materials.find((item: any) => item.id === line.material_id);
                return (
                  <Card key={line.material_id} variant="outlined">
                    <CardContent sx={{ p: 2, "&:last-child": { pb: 2 } }}>
                      <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>{materialName(line.material_id)}</Typography>
                      <Box sx={{ display: "flex", justifyContent: "space-between", mt: 0.5 }}>
                        <Typography variant="body2" color="text.secondary">Quantity per pack</Typography>
                        <Typography variant="body2" sx={{ fontWeight: 600 }}>{line.qty_per_pack} {material?.unit || ""}</Typography>
                      </Box>
                      <Box sx={{ display: "flex", justifyContent: "space-between", mt: 0.5 }}>
                        <Typography variant="body2" color="text.secondary">Current cost</Typography>
                        <Typography variant="body2" sx={{ fontWeight: 600 }}>₹{((material?.unit_price || 0) * Number(line.qty_per_pack)).toFixed(2)}</Typography>
                      </Box>
                      <Button size="small" color="error" sx={{ mt: 1, minHeight: 44 }} onClick={() => setMaterialLines(materialLines.filter((item) => item.material_id !== line.material_id))}>Remove</Button>
                    </CardContent>
                  </Card>
                );
              }) : (
                <Box sx={{ py: 3, px: 2, textAlign: "center" }}>
                  <Typography variant="body2" color="text.secondary">No packing materials configured.</Typography>
                  <Typography variant="body2" color="text.secondary">Add a material above to define this pack type.</Typography>
                </Box>
              )}
            </Stack>
          ) : (
            <TableContainer sx={{ overflowX: "auto" }}>
              <Table size="small" sx={{ mb: 2, minWidth: 480 }}>
                <TableHead><TableRow><TableCell>Material</TableCell><TableCell>Quantity per pack</TableCell><TableCell>Current cost</TableCell><TableCell /></TableRow></TableHead>
                <TableBody>{materialLines.length ? materialLines.map((line) => {
                  const material = materials.find((item: any) => item.id === line.material_id);
                  return <TableRow key={line.material_id}><TableCell>{materialName(line.material_id)}</TableCell><TableCell>{line.qty_per_pack} {material?.unit || ""}</TableCell><TableCell>₹{((material?.unit_price || 0) * Number(line.qty_per_pack)).toFixed(2)}</TableCell><TableCell><Button size="small" color="error" onClick={() => setMaterialLines(materialLines.filter((item) => item.material_id !== line.material_id))}>Remove</Button></TableCell></TableRow>;
                }) : <TableRow><TableCell colSpan={4} align="center"><EmptyState title="No packing materials configured." message="Add a material above to define this pack type." /></TableCell></TableRow>}</TableBody>
              </Table>
            </TableContainer>
          )}

          <Box sx={{ display: "flex", gap: 1 }}>
            <Button variant="contained" onClick={submit} disabled={addPackType.isPending || updatePackType.isPending} sx={{ minHeight: 44 }}>{editingId ? "Save changes" : "Add pack type"}</Button>
            {editingId && <Button onClick={reset} sx={{ minHeight: 44 }}>Cancel</Button>}
          </Box>
        </CardContent>
      </Card>
      <Card sx={{ maxWidth: 1100, mt: 3 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>Configured pack types</Typography>
          {isMobile ? (
            <Stack spacing={1.5}>
              {typesLoading ? (
                <Box sx={{ py: 4, display: "flex", justifyContent: "center" }}><Typography color="text.secondary">Loading...</Typography></Box>
              ) : packTypes.length ? packTypes.map((item: any) => (
                <Card key={item.id} variant="outlined">
                  <CardContent sx={{ p: 2, "&:last-child": { pb: 2 } }}>
                    <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 1 }}>
                      <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>{item.name}</Typography>
                      <Button size="small" onClick={() => edit(item)}>Edit</Button>
                    </Box>
                    <Box sx={{ display: "flex", justifyContent: "space-between", mt: 0.5 }}>
                      <Typography variant="body2" color="text.secondary">Size</Typography>
                      <Typography variant="body2" sx={{ fontWeight: 600 }}>{item.size_grams} g</Typography>
                    </Box>
                    <Box sx={{ display: "flex", justifyContent: "space-between", mt: 0.5 }}>
                      <Typography variant="body2" color="text.secondary">Packaging cost</Typography>
                      <Typography variant="body2" sx={{ fontWeight: 600 }}>₹{item.cost_per_pack.toFixed(2)}</Typography>
                    </Box>
                    <Box sx={{ display: "flex", justifyContent: "space-between", mt: 0.5 }}>
                      <Typography variant="body2" color="text.secondary">Selling price</Typography>
                      <Typography variant="body2" sx={{ fontWeight: 600 }}>{item.selling_price == null ? "Not set" : `₹${item.selling_price.toFixed(2)}`}</Typography>
                    </Box>
                    {(item.materials || []).length > 0 && (
                      <Box sx={{ mt: 1, pt: 1, borderTop: 1, borderColor: "divider" }}>
                        <Typography variant="caption" color="text.secondary">Materials</Typography>
                        <Typography variant="body2">{(item.materials || []).map((material: any) => `${material.material_name} × ${material.qty_per_pack}`).join(", ")}</Typography>
                      </Box>
                    )}
                  </CardContent>
                </Card>
              )) : (
                <Box sx={{ py: 3, px: 2, textAlign: "center" }}>
                  <Typography variant="body2" color="text.secondary">No pack types configured.</Typography>
                  <Typography variant="body2" color="text.secondary">Define your first pack type above.</Typography>
                </Box>
              )}
            </Stack>
          ) : (
            <TableContainer sx={{ overflowX: "auto" }}>
              <Table size="small" sx={{ minWidth: 640 }}>
                <TableHead><TableRow><TableCell>Name</TableCell><TableCell>Size</TableCell><TableCell>Packaging cost</TableCell><TableCell>Selling price</TableCell><TableCell>Materials</TableCell><TableCell /></TableRow></TableHead>
                <TableBody>{typesLoading ? <TableSkeleton rows={3} colSpan={6} /> : packTypes.length ? packTypes.map((item: any) => <TableRow key={item.id}><TableCell>{item.name}</TableCell><TableCell>{item.size_grams} g</TableCell><TableCell>₹{item.cost_per_pack.toFixed(2)}</TableCell><TableCell>{item.selling_price == null ? "Not set" : `₹${item.selling_price.toFixed(2)}`}</TableCell><TableCell>{(item.materials || []).map((material: any) => `${material.material_name} × ${material.qty_per_pack}`).join(", ") || "None"}</TableCell><TableCell><Button size="small" onClick={() => edit(item)}>Edit</Button></TableCell></TableRow>) : <TableRow><TableCell colSpan={6} align="center"><EmptyState title="No pack types configured." message="Define your first pack type above." /></TableCell></TableRow>}</TableBody>
              </Table>
            </TableContainer>
          )}
        </CardContent>
      </Card>
      <Card sx={{ maxWidth: 1100, mt: 3 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>Packing material inventory</Typography>
          <Typography color="text.secondary" sx={{ mb: 2 }}>
            Packing materials are consumed when packs are produced and are never saleable inventory.
          </Typography>
          {isMobile ? (
            <Stack spacing={1.5}>
              {materialsLoading ? (
                <Box sx={{ py: 4, display: "flex", justifyContent: "center" }}><Typography color="text.secondary">Loading...</Typography></Box>
              ) : materials.length ? materials.map((material: any) => (
                <Card key={material.id} variant="outlined">
                  <CardContent sx={{ p: 2, "&:last-child": { pb: 2 } }}>
                    <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>{material.name}</Typography>
                    <Box sx={{ display: "flex", justifyContent: "space-between", mt: 0.5 }}>
                      <Typography variant="body2" color="text.secondary">Available quantity</Typography>
                      <Typography variant="body2" sx={{ fontWeight: 600 }}>{material.qty} {material.unit}</Typography>
                    </Box>
                    <Box sx={{ display: "flex", justifyContent: "space-between", mt: 0.5 }}>
                      <Typography variant="body2" color="text.secondary">Average unit cost</Typography>
                      <Typography variant="body2" sx={{ fontWeight: 600 }}>₹{material.unit_price.toFixed(2)}</Typography>
                    </Box>
                    <Box sx={{ display: "flex", justifyContent: "space-between", mt: 0.5 }}>
                      <Typography variant="body2" color="text.secondary">Stock value</Typography>
                      <Typography variant="body2" sx={{ fontWeight: 600 }}>₹{(material.qty * material.unit_price).toFixed(2)}</Typography>
                    </Box>
                  </CardContent>
                </Card>
              )) : (
                <Box sx={{ py: 3, px: 2, textAlign: "center" }}>
                  <Typography variant="body2" color="text.secondary">No packing materials purchased.</Typography>
                  <Typography variant="body2" color="text.secondary">Record a packing-material purchase to stock items here.</Typography>
                </Box>
              )}
            </Stack>
          ) : (
            <TableContainer sx={{ overflowX: "auto" }}>
              <Table size="small" sx={{ minWidth: 520 }}>
                <TableHead><TableRow><TableCell>Material</TableCell><TableCell>Available quantity</TableCell><TableCell>Unit</TableCell><TableCell>Average unit cost</TableCell><TableCell>Stock value</TableCell></TableRow></TableHead>
                <TableBody>{materialsLoading ? <TableSkeleton rows={3} colSpan={5} /> : materials.length ? materials.map((material: any) => <TableRow key={material.id}><TableCell>{material.name}</TableCell><TableCell>{material.qty}</TableCell><TableCell>{material.unit}</TableCell><TableCell>₹{material.unit_price.toFixed(2)}</TableCell><TableCell>₹{(material.qty * material.unit_price).toFixed(2)}</TableCell></TableRow>) : <TableRow><TableCell colSpan={5} align="center"><EmptyState title="No packing materials purchased." message="Record a packing-material purchase to stock items here." /></TableCell></TableRow>}</TableBody>
              </Table>
            </TableContainer>
          )}
        </CardContent>
      </Card>
    </Box>
  );
};
