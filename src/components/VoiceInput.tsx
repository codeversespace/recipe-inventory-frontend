import { Alert, Box, Button, CircularProgress, Dialog, DialogActions, DialogContent, DialogTitle, Divider, IconButton, TextField, Tooltip, Typography } from "@mui/material";
import MicIcon from "@mui/icons-material/Mic";
import MicOffIcon from "@mui/icons-material/MicOff";
import { useState, useRef, useCallback } from "react";

export type VoiceVariant = "purchase" | "sale" | "payment" | "production" | "packing" | "ingredient";

export interface VoiceResult {
  items: Record<string, any>[];
  shared: Record<string, any>;
}

interface VoiceInputProps {
  onResult: (json: string) => void;
  disabled?: boolean;
  label?: string;
  variant?: VoiceVariant;
}

const HINTS: Record<VoiceVariant, string[]> = {
  purchase: [
    "50 kg almonds 950",
    "50 kg almond 950 and 10 kg cashew 870",
    "50 kg almonds at 950 from supplier Hari Nath",
  ],
  sale: [
    "10 packs badam mix 520",
    "10 packs badam mix 520 and 5 boxes kaju 300",
    "sell 10 packs to customer Rahul at 520",
  ],
  payment: [
    "receive 5000 from Rahul UPI",
    "pay 3000 to Hari cash",
  ],
  production: [
    "produce 200 kg badam mix",
  ],
  packing: [
    "50 boxes John",
    "pack 30 bags Hari",
  ],
  ingredient: [
    "add saffron kg minimum 10",
  ],
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

  const result = parseVoiceEntry(transcript || interim, variant);

  const submit = () => {
    if (result) { onResult(JSON.stringify(result)); setOpen(false); stopListening(); setManualText(""); }
  };

  return (
    <>
      <Tooltip title={label}>
        <span>
          <IconButton size="small" onClick={() => setOpen(true)} disabled={disabled} sx={{ color: "primary.main" }}>
            <MicIcon fontSize="small" />
          </IconButton>
        </span>
      </Tooltip>
      <Dialog open={open} onClose={() => { setOpen(false); stopListening(); setManualText(""); }} maxWidth="sm" fullWidth>
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
          {result && (
            <Box sx={{ p: 2, bgcolor: "primary.50", borderRadius: 2, border: 1, borderColor: "primary.200", mb: 1 }}>
              <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1 }}>Parsed ({result.items.length} item{result.items.length > 1 ? "s" : ""}):</Typography>
              {result.items.map((item, i) => (
                <Box key={i}>
                  {i > 0 && <Divider sx={{ my: 0.5 }} />}
                  {renderItemPreview(item, variant, i)}
                </Box>
              ))}
              {Object.keys(result.shared).length > 0 && (
                <Box sx={{ mt: 1, pt: 1, borderTop: 1, borderColor: "primary.200" }}>
                  <Typography variant="caption" sx={{ fontWeight: 700 }}>Shared:</Typography>
                  {Object.entries(result.shared).map(([k, v]) => (
                    <Typography key={k} variant="caption" sx={{ display: "block" }}>{k}: <strong>{String(v)}</strong></Typography>
                  ))}
                </Box>
              )}
            </Box>
          )}
          {!transcript && !interim && !error && (
            <Box sx={{ mt: 1 }}>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5 }}>Try saying:</Typography>
              {HINTS[variant].map((h, i) => (
                <Typography key={i} variant="caption" sx={{ display: "block", color: "text.secondary" }}>"{h}"</Typography>
              ))}
            </Box>
          )}
          <Box sx={{ mt: 2, pt: 2, borderTop: 1, borderColor: "divider" }}>
            <Typography variant="caption" color="text.secondary" sx={{ display: "block", mb: 0.5 }}>Or type it manually:</Typography>
            <TextField size="small" fullWidth placeholder={HINTS[variant][0]} value={manualText} onChange={(e) => { setManualText(e.target.value); setTranscript(e.target.value); setError(""); }} onKeyDown={(e) => { if (e.key === "Enter") submit(); }} />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => { setOpen(false); stopListening(); setManualText(""); }}>Cancel</Button>
          <Button variant="contained" disabled={!result} onClick={submit}>Use this</Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

function renderItemPreview(item: Record<string, any>, variant: VoiceVariant, index: number): React.ReactNode {
  const rows: [string, string][] = [];
  switch (variant) {
    case "purchase":
      rows.push(["Product", item.name || "—"]);
      rows.push(["Qty", `${item.qty || 0} ${item.unit || ""}`]);
      if (item.price) rows.push(["Price", `₹${item.price}`]);
      break;
    case "sale":
      rows.push(["Product", item.name || "—"]);
      rows.push(["Qty", `${item.qty || 0} ${item.unit || ""}`]);
      if (item.price) rows.push(["Price", `₹${item.price}`]);
      break;
    case "payment":
      rows.push(["Amount", item.amount ? `₹${item.amount}` : "—"]);
      break;
    case "production":
      rows.push(["Recipe", item.name || "—"]);
      rows.push(["Qty", item.qty ? `${item.qty} ${item.unit || ""}` : "—"]);
      break;
    case "packing":
      rows.push(["Boxes", String(item.count || 0)]);
      if (item.employee) rows.push(["Employee", item.employee]);
      break;
    case "ingredient":
      rows.push(["Name", item.name || "—"]);
      if (item.unit) rows.push(["Unit", item.unit]);
      if (item.minStock) rows.push(["Min stock", String(item.minStock)]);
      break;
  }
  return (
    <Box sx={{ mb: 0.5 }}>
      {rows.map(([label, value]) => (
        <Typography key={label} variant="body2">{label}: <strong>{value}</strong></Typography>
      ))}
    </Box>
  );
}

// ─── Main parser ────────────────────────────────────────────

function parseVoiceEntry(text: string, variant: VoiceVariant): VoiceResult | null {
  const cleaned = text.toLowerCase().replace(/[₹$,]/g, "").trim();
  if (!cleaned) return null;
  if (variant === "payment") return { items: [parsePayment(cleaned)].filter(Boolean) as Record<string, any>[], shared: {} };
  if (variant === "packing") return { items: [parsePacking(cleaned)].filter(Boolean) as Record<string, any>[], shared: {} };
  if (variant === "ingredient") return { items: [parseIngredient(cleaned)].filter(Boolean) as Record<string, any>[], shared: {} };
  if (variant === "production") return { items: [parseProduction(cleaned)].filter(Boolean) as Record<string, any>[], shared: {} };

  // Split into segments for multi-product: "and", "&", "plus", comma
  const segments = splitSegments(cleaned);
  const shared: Record<string, any> = {};

  // Extract shared context from full text
  if (variant === "purchase") {
    const supMatch = cleaned.match(/(?:supplier|from)\s+(.+?)(?:\s+(?:and|&|plus|,)\s+\d|$)/i) || cleaned.match(/(?:supplier|from)\s+(.+)$/i);
    if (supMatch) shared.supplier = supMatch[1].trim();
  } else if (variant === "sale") {
    const custMatch = cleaned.match(/(?:customer|to)\s+(.+?)(?:\s+(?:and|&|plus|,)\s+\d|$)/i) || cleaned.match(/(?:customer|to)\s+(.+)$/i);
    if (custMatch) shared.customer = custMatch[1].trim();
  }

  const items: Record<string, any>[] = [];
  for (const seg of segments) {
    const parsed = variant === "purchase" ? parsePurchase(seg) : parseSale(seg);
    if (parsed) items.push(parsed);
  }
  if (!items.length) return null;
  return { items, shared };
}

function splitSegments(text: string): string[] {
  // Split on "and", "&", "plus", comma, semicolon — but only before a digit (next item)
  let normalized = text
    .replace(/\band\b/gi, "&")
    .replace(/\bplus\b/gi, "&")
    .replace(/;/g, "&")
    .replace(/,\s*(\d)/g, "& $1");
  const parts = normalized.split("&").map((s) => s.trim()).filter(Boolean);
  return parts.length ? parts : [text];
}

// ─── Single-item parsers ────────────────────────────────────

const UNIT_RE = "(kg|kilogram|kilos|l|litre|liter|ltr|pcs?|pieces?|packs?|units?|boxes?|g|grams?)";

function parsePurchase(text: string): Record<string, any> | null {
  const qtyMatch = text.match(new RegExp(`(\\d+\\.?\\d*)\\s*${UNIT_RE}\\b`));
  if (!qtyMatch) return null;
  const qty = Number(qtyMatch[1]);
  const unit = qtyMatch[2];
  let price = 0;
  const priceMatch = text.match(/(?:price|at|for|rate)\s+(\d+\.?\d*)/);
  if (priceMatch) price = Number(priceMatch[1]);
  else {
    // Trailing number after unit that isn't the qty: "50 kg almond 950"
    const afterUnit = text.slice(text.indexOf(unit) + unit.length).trim();
    const trailing = afterUnit.match(/^(\d+\.?\d*)/);
    if (trailing && !/(?:supplier|from)/.test(afterUnit.slice(trailing[0].length))) price = Number(trailing[1]);
  }
  let name = text
    .replace(/^(add|record|purchase|buy|got|please|i need|i want|need|want|order)\s+/i, "")
    .replace(new RegExp(`\\d+\\.?\\d*\\s*${UNIT_RE}\\b`, "gi"), "")
    .replace(/(?:price|at|for|rate)\s+\d+\.?\d*/gi, "")
    .replace(/(?:supplier|from)\s+.+$/gi, "")
    .replace(/\d+\.?\d*/g, "")
    .replace(/\s+/g, " ").trim();
  if (!name || qty <= 0) return null;
  return { name, qty, unit: normalizeUnit(unit), price };
}

function parseSale(text: string): Record<string, any> | null {
  const qtyMatch = text.match(new RegExp(`(\\d+\\.?\\d*)\\s*${UNIT_RE}\\b`));
  if (!qtyMatch) return null;
  const qty = Number(qtyMatch[1]);
  const unit = qtyMatch[2];
  let price = 0;
  const priceMatch = text.match(/(?:price|at|for|rate)\s+(\d+\.?\d*)/);
  if (priceMatch) price = Number(priceMatch[1]);
  else {
    const afterUnit = text.slice(text.indexOf(unit) + unit.length).trim();
    const trailing = afterUnit.match(/^(\d+\.?\d*)/);
    if (trailing && !/(?:customer|to|from)/.test(afterUnit.slice(trailing[0].length))) price = Number(trailing[1]);
  }
  let name = text
    .replace(/^(sell|record|sale|sold|add|give|send)\s+/i, "")
    .replace(new RegExp(`\\d+\\.?\\d*\\s*${UNIT_RE}\\b`, "gi"), "")
    .replace(/(?:price|at|for|rate)\s+\d+\.?\d*/gi, "")
    .replace(/(?:customer|to|from)\s+.+$/gi, "")
    .replace(/\d+\.?\d*/g, "")
    .replace(/\s+/g, " ").trim();
  if (!name || qty <= 0) return null;
  return { name, qty, unit: normalizeUnit(unit), price };
}

function parsePayment(text: string): Record<string, any> {
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
  return { entity, amount, method };
}

function parseProduction(text: string): Record<string, any> {
  let name = text
    .replace(/^(produce|make|batch|record|start)\s+/i, "")
    .replace(new RegExp(`\\d+\\.?\\d*\\s*${UNIT_RE}\\b`, "gi"), "")
    .replace(/\d+\.?\d*/g, "")
    .replace(/\s+/g, " ").trim();
  let qty = 0;
  let unit = "kg";
  const qtyMatch = text.match(new RegExp(`(\\d+\\.?\\d*)\\s*${UNIT_RE}\\b`));
  if (qtyMatch) { qty = Number(qtyMatch[1]); unit = qtyMatch[2]; }
  return { name, qty: qty || 0, unit: normalizeUnit(unit) };
}

function parsePacking(text: string): Record<string, any> {
  let count = 0;
  const countMatch = text.match(/(\d+)\s*(boxes|packs|bags|cartons|pcs|pieces|units)/i);
  if (countMatch) count = Number(countMatch[1]);
  else { const num = text.match(/(\d+)/); if (num) count = Number(num[1]); }
  let employee = "";
  const empMatch = text.match(/(?:by|employee|worker|packed by)\s+(.+)$/i)
    || text.match(/\b([a-zA-Z]+(?:\s+[a-zA-Z]+)?)$/);
  if (empMatch) {
    const raw = empMatch[1].trim();
    if (!/^(boxes|packs|bags|cartons|pcs|pieces|units)$/i.test(raw)) employee = raw;
  }
  return { count, employee };
}

function parseIngredient(text: string): Record<string, any> {
  let name = text
    .replace(/^(add|new|create|record)\s+/i, "")
    .replace(/\b(minimum|min|alert|stock)\s+\d+/gi, "")
    .replace(new RegExp(`\\d+\\.?\\d*\\s*${UNIT_RE}\\b`, "gi"), "")
    .replace(/\d+\.?\d*/g, "")
    .replace(/\s+/g, " ").trim();
  let unit = "";
  const unitMatch = text.match(new RegExp(`${UNIT_RE}\\b`));
  if (unitMatch) unit = normalizeUnit(unitMatch[1]);
  let minStock = 0;
  const minMatch = text.match(/(?:minimum|min|alert|stock)\s+(\d+)/i);
  if (minMatch) minStock = Number(minMatch[1]);
  return { name, unit, minStock };
}

function normalizeUnit(unit: string): string {
  const map: Record<string, string> = { kg: "kg", kilogram: "kg", kilos: "kg", g: "g", gram: "g", grams: "g", l: "L", litre: "L", liter: "L", ltr: "L", pcs: "pcs", pc: "pcs", piece: "pcs", pieces: "pcs", pack: "pcs", packs: "pcs", unit: "pcs", units: "pcs", box: "pcs", boxes: "pcs", bag: "pcs", bags: "pcs", carton: "pcs", cartons: "pcs" };
  return map[unit.toLowerCase()] || unit;
}
