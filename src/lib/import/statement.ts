import Papa from "papaparse";

export type ParsedTxn = {
  date: Date;
  description: string;
  amount: number;
  currency?: string;
  accountNameHint?: string;
  status?: "PENDING" | "POSTED";
};

export function normalizeDesc(s: string) {
  return s.trim().replace(/\s+/g, " ").slice(0, 256);
}

function normalizeKey(k: string) {
  return k
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "") // remove accents
    .trim();
}

export type CsvColumnMap = { date?: string; description?: string; amount?: string; credit?: string; debit?: string; currency?: string; account?: string; status?: string };

export function detectCsvColumnMap(headers: string[]): CsvColumnMap {
  const map: CsvColumnMap = {};
  const norm = headers.map((h) => ({ raw: h, key: normalizeKey(h) }));
  const find = (candidates: string[]) => norm.find((h) => candidates.includes(h.key))?.raw;
  map.date = find(["date", "data", "posted date", "transaction date", "booking date"]);
  map.description = find(["description", "descricao", "memo", "details", "narrative", "historico", "historico"]); // historico with/without accent
  map.amount = find(["amount", "valor", "montante", "value"]);
  map.credit = find(["credit", "deposit", "credito", "credit amount"]);
  map.debit = find(["debit", "withdrawal", "debito", "debit amount"]);
  map.currency = find(["currency", "moeda", "curr"]);
  map.account = find(["account", "account name", "conta", "agencia/conta"]);
  map.status = find(["status", "situacao", "state"]);
  return map;
}

export function parseCsvStatement(text: string, map?: CsvColumnMap): ParsedTxn[] {
  const res = Papa.parse<Record<string, any>>(text, { header: true, dynamicTyping: true, skipEmptyLines: true });
  const rows: ParsedTxn[] = [];
  for (const r of res.data) {
    const lower = Object.fromEntries(Object.entries(r).map(([k, v]) => [normalizeKey(String(k)), v])) as Record<string, any>;
    const get = (key?: string, ...fallbacks: string[]) => {
      if (key && typeof key === "string") return r[key] ?? lower[normalizeKey(key)] ?? undefined;
      for (const fb of fallbacks) {
        const v = lower[fb];
        if (typeof v !== "undefined") return v;
      }
      return undefined;
    };
    // If map not provided, try to auto-detect via headers
    const auto = map || detectCsvColumnMap(Object.keys(r));
    const desc = get(auto.description, "description", "descricao", "memo", "details", "narrative", "historico");
    const dateRaw = get(auto.date, "date", "data", "posted date", "transaction date", "booking date");
    let amount = get(auto.amount, "amount", "valor");
    const credit = get(auto.credit, "credit", "deposit", "credito", "credit amount");
    const debit = get(auto.debit, "debit", "withdrawal", "debito", "debit amount");
    if (typeof amount === "undefined") {
      if (typeof credit !== "undefined" || typeof debit !== "undefined") {
        const c = Number(String(credit || 0).toString().replace(/,/g, "."));
        const d = Number(String(debit || 0).toString().replace(/,/g, "."));
        amount = c - d; // debit negative
      }
    }
    if (typeof amount === "undefined") {
      // try to infer first numeric column
      const numericKeys = Object.keys(lower).filter((k) => {
        const v = lower[k];
        const n = Number(String(v).replace(/\./g, "").replace(/,/g, "."));
        return !Number.isNaN(n) && Number.isFinite(n);
      });
      if (numericKeys.length === 1) amount = lower[numericKeys[0]];
    }
    if (typeof amount === "string") amount = Number(amount.replace(/,/g, "."));
    const currency = get(auto.currency, "currency", "moeda", "curr");
    const accountNameHint = get(auto.account, "account", "account name", "conta");
    const status = String(get(auto.status, "status") || "").toUpperCase() === "PENDING" ? "PENDING" : "POSTED";
    const d = parseDate(dateRaw);
    if (!desc || !d || !(Number.isFinite(amount) && !Number.isNaN(amount))) continue;
    rows.push({ date: d, description: normalizeDesc(String(desc)), amount: Number(amount), currency: currency ? String(currency).toUpperCase() : undefined, accountNameHint, status });
  }
  return rows;
}

export async function parsePdfStatement(buffer: Buffer): Promise<ParsedTxn[]> {
  // Prefer using pdfjs-dist directly to avoid worker issues in some runtimes
  try {
    const { createRequire } = await import("module");
    const req = createRequire(import.meta.url);
    // legacy build is better for Node
    const pdfjs: any = req("pdfjs-dist/legacy/build/pdf.js");
    if (pdfjs?.GlobalWorkerOptions) {
      // Disable worker in server runtime
      pdfjs.GlobalWorkerOptions.workerSrc = undefined;
    }
    const loadingTask = pdfjs.getDocument({ data: buffer, disableWorker: true, isEvalSupported: false, useSystemFonts: true });
    const pdf = await loadingTask.promise;
    let text = "";
    for (let i = 1; i <= pdf.numPages; i++) {
      const page = await pdf.getPage(i);
      const content = await page.getTextContent();
      const strings: string[] = (content.items || []).map((it: any) => it.str).filter(Boolean);
      text += strings.join(" ") + "\n";
    }
    if (text.trim().length > 0) return parseTextToTxns(text);
  } catch (e) {
    // ignore and try other loaders
  }

  // Try 'pdf-parse' if available
  try {
    const { createRequire } = await import("module");
    const req = createRequire(import.meta.url);
    const m: any = req("pdf-parse");
    const fn = (m?.default ?? m) as (b: Buffer) => Promise<{ text: string }>;
    if (typeof fn === "function") {
      const { text } = await fn(buffer);
      if (text) return parseTextToTxns(text);
    }
  } catch {}

  // Final fallback: naive UTF-8
  const text = buffer.toString("utf8");
  if (text && /\d{2}[\/.-]\d{2}[\/.-]\d{4}/.test(text)) return parseTextToTxns(text);
  throw new Error("Failed to extract text from PDF (no worker). For scanned PDFs, enable OCR.");
}

// Optional OCR path for scanned PDFs. Requires 'canvas' and 'tesseract.js' packages at runtime.
export async function parsePdfWithOcr(buffer: Buffer): Promise<ParsedTxn[]> {
  // Dynamically load heavy deps only if available
  let pdfjs: any, createCanvas: any, tesseract: any;
  try {
    const { createRequire } = await import("module");
    const req = createRequire(import.meta.url);
    pdfjs = req("pdfjs-dist/legacy/build/pdf.js");
  } catch {}
  try {
    const mod: any = await import("canvas");
    createCanvas = (mod.createCanvas || (mod.default && mod.default.createCanvas));
  } catch {}
  try {
    tesseract = await import("tesseract.js");
  } catch {}
  if (!pdfjs || !createCanvas || !tesseract) {
    throw new Error("OCR dependencies missing. Install 'pdfjs-dist', 'canvas' and 'tesseract.js'.");
  }

  class NodeCanvasFactory {
    create(width: number, height: number) {
      const canvas = createCanvas(Math.ceil(width), Math.ceil(height));
      const context = canvas.getContext("2d");
      return { canvas, context };
    }
    reset(canvasAndContext: any, width: number, height: number) {
      canvasAndContext.canvas.width = Math.ceil(width);
      canvasAndContext.canvas.height = Math.ceil(height);
    }
    destroy(canvasAndContext: any) {
      canvasAndContext.canvas.width = 0;
      canvasAndContext.canvas.height = 0;
    }
  }

  const worker = await (tesseract as any).createWorker?.();
  if (!worker) throw new Error("Tesseract worker not available");
  await worker.loadLanguage("eng");
  await worker.initialize("eng");

  const loadingTask = pdfjs.getDocument({ data: buffer, disableWorker: true, isEvalSupported: false });
  const pdf = await loadingTask.promise;
  let text = "";
  const canvasFactory = new NodeCanvasFactory();
  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const viewport = page.getViewport({ scale: 2.0 });
    const c = canvasFactory.create(viewport.width, viewport.height);
    await page.render({ canvasContext: c.context, viewport, canvasFactory }).promise;
    const png = c.canvas.toBuffer("image/png");
    const result = await worker.recognize(png);
    text += (result?.data?.text || "") + "\n";
    canvasFactory.destroy(c);
  }
  await worker.terminate();
  if (!text.trim()) throw new Error("OCR produced no text");
  return parseTextToTxns(text);
}

function parseTextToTxns(text: string): ParsedTxn[] {
  const lines = text.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
  const out: ParsedTxn[] = [];
  for (const line of lines) {
    // Patterns like: 2025-01-05; Grocery Store; -125.50 or 05/01/2025 Grocery Store -125,50
    const mIso = line.match(/(\d{4}-\d{2}-\d{2})\D+(.+?)\D+(-?\d+[.,]?\d*)/);
    const mBr = line.match(/(\d{2}[\/.-]\d{2}[\/.-]\d{4})\s+(.+?)\s+(-?\d+[.,]?\d*)/);
    const m = mIso || mBr;
    if (!m) continue;
    const d = parseDate(m[1]);
    const desc = normalizeDesc(m[2]);
    const amt = Number(String(m[3]).replace(/\./g, "").replace(/,/g, "."));
    if (!d || !Number.isFinite(amt)) continue;
    out.push({ date: d, description: desc, amount: amt, status: "POSTED" });
  }
  return out;
}

function parseDate(val: any): Date | null {
  if (!val) return null;
  if (val instanceof Date) return val;
  const s = String(val).trim();
  // Try ISO
  const iso = new Date(s);
  if (!isNaN(iso.getTime())) return iso;
  // Try DD/MM/YYYY
  const m = s.match(/^(\d{2})[\/.-](\d{2})[\/.-](\d{4})$/);
  if (m) {
    const [_, dd, mm, yyyy] = m;
    const d = new Date(Number(yyyy), Number(mm) - 1, Number(dd));
    if (!isNaN(d.getTime())) return d;
  }
  return null;
}

export function guessCategory(name: string, keywords: Record<string, string>): string | undefined {
  const text = name.toLowerCase();
  for (const [kw, cat] of Object.entries(keywords)) {
    if (text.includes(kw)) return cat;
  }
  return undefined;
}
