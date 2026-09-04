import { Alert, Box, Button, Card, CardContent, FormControl, InputLabel, MenuItem, Select, Table, TableBody, TableCell, TableHead, TableRow, TextField, Typography } from "@mui/material";
import { useState } from "react";
import { useAddPackType, usePackTypes, usePackingMaterials, useUpdatePackType } from "../hooks/useApi";

type MaterialLine = { material_id: number; qty_per_pack: string };

export const PackTypes = () => {
  const { data: packTypes = [] } = usePackTypes();
  const { data: materials = [] } = usePackingMaterials();
  const addPackType = useAddPackType();
  const updatePackType = useUpdatePackType();
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
      <Typography variant="h4" gutterBottom>Pack Types</Typography>
      <Typography color="text.secondary" sx={{ mb: 3 }}>
        Define pack size, required packing materials, and selling price. Packaging cost is calculated from current packing-material costs.
      </Typography>
      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
      <Card sx={{ maxWidth: 1100 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>{editingId ? "Edit pack type" : "Add pack type"}</Typography>
          <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap", mb: 2 }}>
            <TextField size="small" label="Name" value={name} onChange={(event) => setName(event.target.value)} />
            <TextField size="small" label="Size (grams)" type="number" value={size} onChange={(event) => setSize(event.target.value)} />
            <TextField size="small" label="Selling price per pack (₹)" type="number" value={sellingPrice} onChange={(event) => setSellingPrice(event.target.value)} />
          </Box>
          <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap", alignItems: "center", mb: 2 }}>
            <FormControl size="small" sx={{ minWidth: 240 }}>
              <InputLabel>Packing material</InputLabel>
              <Select value={materialId} label="Packing material" onChange={(event) => setMaterialId(String(event.target.value))}>
                {materials.map((material: any) => <MenuItem key={material.id} value={material.id}>{material.name} ({material.unit}) · ₹{material.unit_price.toFixed(2)}</MenuItem>)}
              </Select>
            </FormControl>
            <TextField size="small" label="Quantity per pack" type="number" value={materialQty} onChange={(event) => setMaterialQty(event.target.value)} />
            <Button variant="outlined" onClick={addMaterial}>Add material</Button>
          </Box>
          <Table size="small" sx={{ mb: 2 }}>
            <TableHead><TableRow><TableCell>Material</TableCell><TableCell>Quantity per pack</TableCell><TableCell>Current cost</TableCell><TableCell /></TableRow></TableHead>
            <TableBody>{materialLines.length ? materialLines.map((line) => {
              const material = materials.find((item: any) => item.id === line.material_id);
              return <TableRow key={line.material_id}><TableCell>{materialName(line.material_id)}</TableCell><TableCell>{line.qty_per_pack} {material?.unit || ""}</TableCell><TableCell>₹{((material?.unit_price || 0) * Number(line.qty_per_pack)).toFixed(2)}</TableCell><TableCell><Button size="small" color="error" onClick={() => setMaterialLines(materialLines.filter((item) => item.material_id !== line.material_id))}>Remove</Button></TableCell></TableRow>;
            }) : <TableRow><TableCell colSpan={4} align="center">No packing materials configured.</TableCell></TableRow>}</TableBody>
          </Table>
          <Box sx={{ display: "flex", gap: 1 }}>
            <Button variant="contained" onClick={submit} disabled={addPackType.isPending || updatePackType.isPending}>{editingId ? "Save changes" : "Add pack type"}</Button>
            {editingId && <Button onClick={reset}>Cancel</Button>}
          </Box>
        </CardContent>
      </Card>
      <Card sx={{ maxWidth: 1100, mt: 3 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>Configured pack types</Typography>
          <Table size="small">
            <TableHead><TableRow><TableCell>Name</TableCell><TableCell>Size</TableCell><TableCell>Packaging cost</TableCell><TableCell>Selling price</TableCell><TableCell>Materials</TableCell><TableCell /></TableRow></TableHead>
            <TableBody>{packTypes.map((item: any) => <TableRow key={item.id}><TableCell>{item.name}</TableCell><TableCell>{item.size_grams} g</TableCell><TableCell>₹{item.cost_per_pack.toFixed(2)}</TableCell><TableCell>{item.selling_price == null ? "Not set" : `₹${item.selling_price.toFixed(2)}`}</TableCell><TableCell>{(item.materials || []).map((material: any) => `${material.material_name} × ${material.qty_per_pack}`).join(", ") || "None"}</TableCell><TableCell><Button size="small" onClick={() => edit(item)}>Edit</Button></TableCell></TableRow>)}</TableBody>
          </Table>
        </CardContent>
      </Card>
      <Card sx={{ maxWidth: 1100, mt: 3 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>Packing material inventory</Typography>
          <Typography color="text.secondary" sx={{ mb: 2 }}>
            Packing materials are consumed when packs are produced and are never saleable inventory.
          </Typography>
          <Table size="small">
            <TableHead><TableRow><TableCell>Material</TableCell><TableCell>Available quantity</TableCell><TableCell>Unit</TableCell><TableCell>Average unit cost</TableCell><TableCell>Stock value</TableCell></TableRow></TableHead>
            <TableBody>{materials.length ? materials.map((material: any) => <TableRow key={material.id}><TableCell>{material.name}</TableCell><TableCell>{material.qty}</TableCell><TableCell>{material.unit}</TableCell><TableCell>₹{material.unit_price.toFixed(2)}</TableCell><TableCell>₹{(material.qty * material.unit_price).toFixed(2)}</TableCell></TableRow>) : <TableRow><TableCell colSpan={5} align="center">No packing materials purchased.</TableCell></TableRow>}</TableBody>
          </Table>
        </CardContent>
      </Card>
    </Box>
  );
};
