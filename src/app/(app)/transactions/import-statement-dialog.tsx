"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { toast } from "sonner";

type PreviewRow = { date: string; description: string; amount: number; currency: string; status: string };

export function ImportStatementDialog({ onImported }: { onImported: () => void }) {
  const [open, setOpen] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [availableCols, setAvailableCols] = useState<string[]>([]);
  const [map, setMap] = useState<{ date?: string; description?: string; amount?: string; credit?: string; debit?: string; currency?: string; account?: string; status?: string }>({});
  const [preview, setPreview] = useState<PreviewRow[]>([]);
  const [totalRows, setTotalRows] = useState(0);
  const [dupCount, setDupCount] = useState(0);
  const [accounts, setAccounts] = useState<Array<{ id: string; name: string; type: string }>>([]);
  const [accountType, setAccountType] = useState<string | undefined>(undefined);
  const [defaultAccountId, setDefaultAccountId] = useState<string | undefined>(undefined);
  const [useOcr, setUseOcr] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);

  useEffect(() => {
    if (!open) return;
    (async () => {
      try {
        const res = await fetch("/api/accounts");
        const json = await res.json();
        const list = (json || []).map((a: any) => ({ id: a.id, name: a.name, type: a.type }));
        setAccounts(list);
        if (list.length) {
          setAccountType(list[0].type);
          setDefaultAccountId(list[0].id);
        }
      } catch {}
    })();
  }, [open]);

  async function requestPreview(f: File, m = map) {
    const fd = new FormData();
    fd.set("file", f);
    if (Object.keys(m).length) fd.set("columnMap", JSON.stringify(m));
    if (useOcr) fd.set("useOcr", "true");
    if (accountType) fd.set("accountType", accountType);
    const res = await fetch("/api/import/preview", { method: "POST", body: fd });
    const json = await res.json();
    if (!res.ok) throw new Error(json.error || "Preview failed");
    setAvailableCols(json.columns || []);
    setPreview(json.preview || []);
    setTotalRows(json.totalRows || 0);
    setDupCount(json.dupPreviewCount || 0);
    if (json.detectedMap && Object.keys(json.detectedMap).length) setMap(json.detectedMap);
    return json;
  }

  async function onFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0] || null;
    setFile(f);
    setPreview([]);
    setAvailableCols([]);
    setMap({});
    if (!f) return;
    try {
      setLoading(true);
      await requestPreview(f);
    } catch (err: any) {
      toast.error(err?.message || "Preview error");
    } finally {
      setLoading(false);
    }
  }

  async function onMapChange(field: string, value?: string) {
    if (!file) return;
    const next = { ...map, [field]: value } as any;
    setMap(next);
    try {
      setLoading(true);
      await requestPreview(file, next);
    } catch (err: any) {
      toast.error(err?.message || "Preview error");
    } finally {
      setLoading(false);
    }
  }

  async function commitImport() {
    if (!file) return;
    try {
      setLoading(true);
      const fd = new FormData();
      fd.set("file", file);
      if (Object.keys(map).length) fd.set("columnMap", JSON.stringify(map));
      if (defaultAccountId) fd.set("defaultAccountId", defaultAccountId);
      if (accountType) fd.set("accountType", accountType);
      if (useOcr) fd.set("useOcr", "true");
      const res = await fetch("/api/import/statement", { method: "POST", body: fd });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Import failed");
      toast.success(`Imported ${json.inserted} new, skipped ${json.skipped}`);
      setOpen(false);
      setFile(null);
      setPreview([]);
      onImported();
    } catch (err: any) {
      toast.error(err?.message || "Import error");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline">Import Statement</Button>
      </DialogTrigger>
      <DialogContent className="w-full max-w-[calc(100vw-2rem)] sm:max-w-3xl max-h-[90vh] overflow-hidden p-4 sm:p-6 flex flex-col">
        <DialogHeader>
          <DialogTitle>Import Statement</DialogTitle>
          <DialogDescription>Upload a CSV or PDF. Mapping is auto-detected; adjust only if needed.</DialogDescription>
        </DialogHeader>

        <div className="space-y-3 flex-1 overflow-hidden">
          <Input type="file" accept=".csv,.pdf" onChange={onFileChange} />

          {file && availableCols.length > 0 && (showAdvanced || preview.length === 0) && (
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
              <div>
                <label className="text-xs text-muted-foreground">Date column</label>
                <Select value={map.date} onValueChange={(v) => onMapChange("date", v)}>
                  <SelectTrigger><SelectValue placeholder="Auto" /></SelectTrigger>
                  <SelectContent>
                    {availableCols.map((c) => (<SelectItem key={c} value={c}>{c}</SelectItem>))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-xs text-muted-foreground">Description column</label>
                <Select value={map.description} onValueChange={(v) => onMapChange("description", v)}>
                  <SelectTrigger><SelectValue placeholder="Auto" /></SelectTrigger>
                  <SelectContent>
                    {availableCols.map((c) => (<SelectItem key={c} value={c}>{c}</SelectItem>))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-xs text-muted-foreground">Amount / or Credit/Debit</label>
                <Select value={map.amount} onValueChange={(v) => onMapChange("amount", v)}>
                  <SelectTrigger><SelectValue placeholder="Amount column" /></SelectTrigger>
                  <SelectContent>
                    {availableCols.map((c) => (<SelectItem key={c} value={c}>{c}</SelectItem>))}
                  </SelectContent>
                </Select>
                <div className="mt-1 grid grid-cols-2 gap-1">
                  <Select value={map.credit} onValueChange={(v) => onMapChange("credit", v)}>
                    <SelectTrigger><SelectValue placeholder="Credit" /></SelectTrigger>
                    <SelectContent>
                      {availableCols.map((c) => (<SelectItem key={c} value={c}>{c}</SelectItem>))}
                    </SelectContent>
                  </Select>
                  <Select value={map.debit} onValueChange={(v) => onMapChange("debit", v)}>
                    <SelectTrigger><SelectValue placeholder="Debit" /></SelectTrigger>
                    <SelectContent>
                      {availableCols.map((c) => (<SelectItem key={c} value={c}>{c}</SelectItem>))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
          )}

          {file && (
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
              <div>
                <label className="text-xs text-muted-foreground">Account Type</label>
                <Select value={accountType} onValueChange={(v) => { setAccountType(v); const first = accounts.find(a => a.type === v); setDefaultAccountId(first?.id); }}>
                  <SelectTrigger><SelectValue placeholder="Select type" /></SelectTrigger>
                  <SelectContent>
                    {Array.from(new Set(accounts.map(a => a.type))).map((t) => (
                      <SelectItem key={t} value={t}>{t.replace(/_/g, ' ').toLowerCase()}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-xs text-muted-foreground">Account</label>
                <Select value={defaultAccountId} onValueChange={(v) => setDefaultAccountId(v)}>
                  <SelectTrigger><SelectValue placeholder="Select account" /></SelectTrigger>
                  <SelectContent>
                    {accounts.filter(a => !accountType || a.type === accountType).map((a) => (
                      <SelectItem key={a.id} value={a.id}>{a.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-end justify-between gap-2 text-xs text-muted-foreground">
                <label className="inline-flex items-center gap-2">
                  <input type="checkbox" className="h-4 w-4" checked={useOcr} onChange={(e) => setUseOcr(e.target.checked)} />
                  Use OCR for scanned PDF
                </label>
                <div className="self-end sm:text-right">{totalRows} rows detected · {dupCount} possible duplicates in preview</div>
              </div>
            </div>
          )}

          {preview.length > 0 && (
            <div className="rounded-md border overflow-auto max-h-[50vh] sm:max-h-[60vh]">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead className="text-right">Amount</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {preview.map((r, i) => (
                    <TableRow key={i}>
                      <TableCell>{r.date}</TableCell>
                      <TableCell className="whitespace-normal break-words max-w-[14rem] sm:max-w-none">{r.description}</TableCell>
                      <TableCell className={"text-right " + (r.amount < 0 ? "text-red-600" : "text-green-600")}>{fmt(r.amount, r.currency)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
          {file && availableCols.length > 0 && preview.length > 0 && (
            <div className="text-xs text-muted-foreground">
              <button className="underline" type="button" onClick={() => setShowAdvanced((v) => !v)}>
                {showAdvanced ? "Hide advanced mapping" : "Adjust mapping"}
              </button>
            </div>
          )}
        </div>

        <DialogFooter className="pt-3 mt-3 border-t">
          <Button variant="outline" onClick={() => setOpen(false)} disabled={loading}>Cancel</Button>
          <Button onClick={commitImport} disabled={!file || loading}>{loading ? "Importing..." : "Import"}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function fmt(n: number, currency: string) {
  try {
    return new Intl.NumberFormat(undefined, { style: "currency", currency }).format(n);
  } catch {
    return `${currency} ${n.toFixed(2)}`;
  }
}
