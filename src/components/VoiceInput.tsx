import { Alert, Box, Button, CircularProgress, Dialog, DialogActions, DialogContent, DialogTitle, IconButton, TextField, Tooltip, Typography } from "@mui/material";
import MicIcon from "@mui/icons-material/Mic";
import MicOffIcon from "@mui/icons-material/MicOff";
import { useState, useRef, useCallback } from "react";

export type VoiceVariant = "purchase" | "sale" | "payment" | "production" | "packing" | "ingredient";

interface VoiceInputProps {
  onResult: (json: string) => void;
  disabled?: boolean;
  label?: string;
  variant?: VoiceVariant;
}

const HINTS: Record<VoiceVariant, string> = {
  purchase: '"Add 50 kg almonds at 950 from supplier Hari Nath"',
  sale: '"Sell 10 packs badam mix at 520 to customer Rahul"',
  payment: '"Receive 5000 from Rahul UPI" or "Pay 3000 to Hari cash"',
  production: '"Produce 200 kg badam mix"',
  packing: '"Pack 50 boxes John"',
  ingredient: '"Add saffron kg minimum 10"',
};

export const VoiceInput = ({ onResult, disabled = false, label = "Voice entry", variant = "purchase" }: VoiceInputProps) => {
  const [open, setOpen] = useState(false);
  const [listening, setListening] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [interim, setInterim] = useState("");
  const [error, setError] = useState("");
  const [manualText, setManualText] = useState("");
  const recognitionRef = useRef<any>(null);

  const startListening = useCallback(() => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setError("Speech recognition is not supported in this browser. Try Chrome.");
      return;
    }
    setTranscript("");
    setInterim("");
    setError("");
    const recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = true;
    recognition.lang = "en-IN";
    recognition.onresult = (event: any) => {
      let final = "";
      let interimText = "";
      for (let i = 0; i < event.results.length; i++) {
        const result = event.results[i];
        if (result.isFinal) final += result[0].transcript;
        else interimText += result[0].transcript;
      }
      if (final) setTranscript(final);
      setInterim(interimText);
    };
    recognition.onend = () => setListening(false);
    recognition.onerror = (e: any) => {
      setListening(false);
      const messages: Record<string, string> = {
        network: "Network error. Voice recognition requires an internet connection and works best in Chrome. Check your connection and try again.",
        "not-allowed": "Microphone access denied. Please allow microphone permission in your browser settings.",
        "no-speech": "No speech detected. Try speaking louder or closer to the microphone.",
        aborted: "Recognition was aborted. Please try again.",
        "audio-capture": "No microphone found. Please connect a microphone.",
        "service-not-available": "Speech service is unavailable. Try again later or use Chrome.",
      };
      setError(messages[e.error] || `Recognition error: ${e.error}`);
    };
    recognitionRef.current = recognition;
    recognition.start();
    setListening(true);
  }, []);

  const stopListening = () => { recognitionRef.current?.stop(); setListening(false); };

  const parsed = parseVoiceEntry(transcript || interim, variant);
  const displayFields = parsed ? getDisplayFields(parsed, variant) : null;

  return (
    <>
      <Tooltip title={label}>
        <span>
          <IconButton size="small" onClick={() => setOpen(true)} disabled={disabled} sx={{ color: "primary.main" }}>
            <MicIcon fontSize="small" />
          </IconButton>
        </span>
      </Tooltip>
      <Dialog open={open} onClose={() => { setOpen(false); stopListening(); setManualText(""); }} maxWidth="xs" fullWidth>
        <DialogTitle sx={{ fontWeight: 700 }}>{label}</DialogTitle>
        <DialogContent>
          {error && <Alert severity="error" sx={{ mb: 1 }}>{error}</Alert>}
          <Box sx={{ display: "flex", alignItems: "center", gap: 2, mb: 2 }}>
            <Button variant={listening ? "outlined" : "contained"} color={listening ? "error" : "primary"} onClick={listening ? stopListening : startListening} startIcon={listening ? <MicOffIcon /> : <MicIcon />}>
              {listening ? "Stop" : "Start speaking"}
            </Button>
            {listening && <CircularProgress size={20} />}
          </Box>
          {transcript && <Box sx={{ p: 2, bgcolor: "grey.50", borderRadius: 2, mb: 1 }}><Typography sx={{ fontWeight: 700 }}>Recognized:</Typography><Typography variant="body2">"{transcript}"</Typography></Box>}
          {interim && !transcript && <Box sx={{ p: 2, bgcolor: "grey.50", borderRadius: 2, mb: 1 }}><Typography variant="body2" color="text.secondary">"{interim}"</Typography></Box>}
          {parsed && displayFields && (
            <Box sx={{ p: 2, bgcolor: "primary.50", borderRadius: 2, border: 1, borderColor: "primary.200" }}>
              <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 0.5 }}>Parsed:</Typography>
              {displayFields.map((field) => (
                <Typography key={field.label} variant="body2">{field.label}: <strong>{field.value}</strong></Typography>
              ))}
            </Box>
          )}
          {!transcript && !interim && !error && <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>Try: {HINTS[variant]}</Typography>}
          <Box sx={{ mt: 2, pt: 2, borderTop: 1, borderColor: "divider" }}>
            <Typography variant="caption" color="text.secondary" sx={{ display: "block", mb: 0.5 }}>Or type it manually:</Typography>
            <TextField size="small" fullWidth placeholder={HINTS[variant]} value={manualText} onChange={(e) => { setManualText(e.target.value); setTranscript(e.target.value); setError(""); }} onKeyDown={(e) => { if (e.key === "Enter" && parsed) { onResult(JSON.stringify(parsed)); setOpen(false); stopListening(); setManualText(""); } }} />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => { setOpen(false); stopListening(); setManualText(""); }}>Cancel</Button>
          <Button variant="contained" disabled={!parsed} onClick={() => { if (parsed) onResult(JSON.stringify(parsed)); setOpen(false); stopListening(); setManualText(""); }}>Use this</Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

function getDisplayFields(parsed: Record<string, any>, variant: VoiceVariant): { label: string; value: string }[] {
  switch (variant) {
    case "purchase":
      return [
        { label: "Product", value: parsed.name || "—" },
        { label: "Qty", value: `${parsed.qty || 0} ${parsed.unit || ""}` },
        { label: "Price", value: parsed.price ? `₹${parsed.price}` : "—" },
        ...(parsed.supplier ? [{ label: "Supplier", value: parsed.supplier }] : []),
      ];
    case "sale":
      return [
        { label: "Product", value: parsed.name || "—" },
        { label: "Qty", value: `${parsed.qty || 0} ${parsed.unit || ""}` },
        { label: "Price", value: parsed.price ? `₹${parsed.price}` : "—" },
        ...(parsed.customer ? [{ label: "Customer", value: parsed.customer }] : []),
      ];
    case "payment":
      return [
        { label: "Entity", value: parsed.entity || "—" },
        { label: "Amount", value: parsed.amount ? `₹${parsed.amount}` : "—" },
        ...(parsed.method ? [{ label: "Method", value: parsed.method.toUpperCase() }] : []),
      ];
    case "production":
      return [
        { label: "Recipe", value: parsed.name || "—" },
        { label: "Qty", value: parsed.qty ? `${parsed.qty} ${parsed.unit || ""}` : "—" },
      ];
    case "packing":
      return [
        { label: "Boxes", value: String(parsed.count || 0) },
        ...(parsed.employee ? [{ label: "Employee", value: parsed.employee }] : []),
      ];
    case "ingredient":
      return [
        { label: "Name", value: parsed.name || "—" },
        { label: "Unit", value: parsed.unit || "—" },
        ...(parsed.minStock ? [{ label: "Min stock", value: String(parsed.minStock) }] : []),
      ];
    default:
      return [];
  }
}

function parseVoiceEntry(text: string, variant: VoiceVariant): Record<string, any> | null {
  const cleaned = text.toLowerCase().replace(/[₹$,]/g, "").trim();
  if (!cleaned) return null;
  switch (variant) {
    case "purchase": return parsePurchase(cleaned);
    case "sale": return parseSale(cleaned);
    case "payment": return parsePayment(cleaned);
    case "production": return parseProduction(cleaned);
    case "packing": return parsePacking(cleaned);
    case "ingredient": return parseIngredient(cleaned);
    default: return parsePurchase(cleaned);
  }
}

function parsePurchase(text: string) {
  const qtyMatch = text.match(/(\d+\.?\d*)\s*(kg|kilogram|kilos|l|litre|liter|ltr|pcs?|pieces?|units?|g|grams?)\b/);
  if (!qtyMatch) return null;
  const qty = Number(qtyMatch[1]);
  const unit = qtyMatch[2];
  let price = 0;
  const priceMatch = text.match(/(?:price|at|for|rate)\s+(\d+\.?\d*)/);
  if (priceMatch) price = Number(priceMatch[1]);
  let supplier = "";
  const supplierMatch = text.match(/(?:supplier|from)\s+(.+)$/);
  if (supplierMatch) supplier = supplierMatch[1].trim();
  let name = text
    .replace(/^(add|record|purchase|buy|got|please|i need|i want|need|want)\s+/i, "")
    .replace(/\d+\.?\d*\s*(kg|kilogram|kilos|l|litre|liter|ltr|pcs?|pieces?|units?|g|grams?)\b/gi, "")
    .replace(/(?:price|at|for|rate)\s+\d+\.?\d*/gi, "")
    .replace(/(?:supplier|from)\s+.+$/gi, "")
    .replace(/\d+\.?\d*/g, "")
    .replace(/\s+/g, " ").trim();
  if (!name || qty <= 0) return null;
  return { name, qty, unit: normalizeUnit(unit), price, supplier };
}

function parseSale(text: string) {
  const qtyMatch = text.match(/(\d+\.?\d*)\s*(kg|kilogram|kilos|l|litre|liter|ltr|pcs?|pieces?|packs?|units?|boxes?|g|grams?)\b/);
  if (!qtyMatch) return null;
  const qty = Number(qtyMatch[1]);
  const unit = qtyMatch[2];
  let price = 0;
  const priceMatch = text.match(/(?:price|at|for|rate)\s+(\d+\.?\d*)/);
  if (priceMatch) price = Number(priceMatch[1]);
  let customer = "";
  const custMatch = text.match(/(?:customer|to|from)\s+(.+)$/);
  if (custMatch) customer = custMatch[1].trim();
  let name = text
    .replace(/^(sell|record|sale|sold|add|give|send)\s+/i, "")
    .replace(/\d+\.?\d*\s*(kg|kilogram|kilos|l|litre|liter|ltr|pcs?|pieces?|packs?|units?|boxes?|g|grams?)\b/gi, "")
    .replace(/(?:price|at|for|rate)\s+\d+\.?\d*/gi, "")
    .replace(/(?:customer|to|from)\s+.+$/gi, "")
    .replace(/\d+\.?\d*/g, "")
    .replace(/\s+/g, " ").trim();
  if (!name || qty <= 0) return null;
  return { name, qty, unit: normalizeUnit(unit), price, customer };
}

function parsePayment(text: string) {
  let amount = 0;
  const amtMatch = text.match(/(\d+\.?\d*)/);
  if (amtMatch) amount = Number(amtMatch[1]);
  let method = "";
  if (/\b(upi|pay|google pay|gpay|phonepe|paytm)\b/.test(text)) method = "UPI";
  else if (/\b(bank|neft|rtgs|transfer|imps)\b/.test(text)) method = "BANK";
  else if (/\b(cheque|check)\b/.test(text)) method = "CHEQUE";
  else if (/\b(cash)\b/.test(text)) method = "CASH";
  let entity = "";
  const entityMatch = text.match(/(?:from|to|pay|receive|paid)\s+(.+?)(?:\s+(?:upi|cash|bank|cheque|neft|rtgs|transfer|imps|pay|google pay|gpay|phonepe|paytm)\b)/i)
    || text.match(/(?:from|to)\s+(.+)$/);
  if (entityMatch) entity = entityMatch[1].trim().replace(/\d+\.?\d*/g, "").trim();
  if (amount <= 0) return null;
  return { entity, amount, method };
}

function parseProduction(text: string) {
  let name = text
    .replace(/^(produce|make|batch|record|start)\s+/i, "")
    .replace(/\d+\.?\d*\s*(kg|kilogram|kilos|l|litre|liter|ltr|pcs?|pieces?|units?|g|grams?)\b/gi, "")
    .replace(/\d+\.?\d*/g, "")
    .replace(/\s+/g, " ").trim();
  let qty = 0;
  let unit = "kg";
  const qtyMatch = text.match(/(\d+\.?\d*)\s*(kg|kilogram|kilos|l|litre|liter|ltr|pcs?|pieces?|units?|g|grams?)\b/);
  if (qtyMatch) { qty = Number(qtyMatch[1]); unit = qtyMatch[2]; }
  if (!name) return null;
  return { name, qty: qty || 0, unit: normalizeUnit(unit) };
}

function parsePacking(text: string) {
  let count = 0;
  const countMatch = text.match(/(\d+)\s*(boxes|packs|bags|cartons|pcs|pieces|units)/i);
  if (countMatch) count = Number(countMatch[1]);
  else { const num = text.match(/(\d+)/); if (num) count = Number(num[1]); }
  let employee = "";
  const empMatch = text.match(/(?:by|employee|worker|packed by|john)\s+(.+)$/i)
    || text.match(/\b([a-zA-Z]+(?:\s+[a-zA-Z]+)?)$/);
  if (empMatch) {
    const raw = empMatch[1].trim();
    if (!/^(boxes|packs|bags|cartons|pcs|pieces|units)$/i.test(raw)) employee = raw;
  }
  if (count <= 0) return null;
  return { count, employee };
}

function parseIngredient(text: string) {
  let name = text
    .replace(/^(add|new|create|record)\s+/i, "")
    .replace(/\b(minimum|min|alert|stock)\s+\d+/gi, "")
    .replace(/\d+\.?\d*\s*(kg|kilogram|kilos|l|litre|liter|ltr|pcs?|pieces?|units?|g|grams?)\b/gi, "")
    .replace(/\d+\.?\d*/g, "")
    .replace(/\s+/g, " ").trim();
  let unit = "";
  const unitMatch = text.match(/\b(kg|kilogram|kilos|l|litre|liter|ltr|pcs?|pieces?|units?|g|grams?)\b/);
  if (unitMatch) unit = normalizeUnit(unitMatch[1]);
  let minStock = 0;
  const minMatch = text.match(/(?:minimum|min|alert|stock)\s+(\d+)/i);
  if (minMatch) minStock = Number(minMatch[1]);
  if (!name) return null;
  return { name, unit, minStock };
}

function normalizeUnit(unit: string): string {
  const map: Record<string, string> = { kg: "kg", kilogram: "kg", kilos: "kg", g: "g", gram: "g", grams: "g", l: "L", litre: "L", liter: "L", ltr: "L", pcs: "pcs", pc: "pcs", piece: "pcs", pieces: "pcs", pack: "pcs", packs: "pcs", unit: "pcs", units: "pcs", box: "pcs", boxes: "pcs", bag: "pcs", bags: "pcs", carton: "pcs", cartons: "pcs" };
  return map[unit.toLowerCase()] || unit;
}
