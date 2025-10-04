"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import Papa from "papaparse";
import { toast } from "sonner";

export default function TransactionsPage() {
  const [rows, setRows] = useState<any[]>([]);
  const [cols, setCols] = useState<string[]>([]);
  const [busy, setBusy] = useState(false);

  function onFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    Papa.parse(file, {
      header: true,
      dynamicTyping: true,
      skipEmptyLines: true,
      complete: (res) => {
        const data = (res.data as any[]).slice(0, 50);
        setRows(data);
        setCols(Object.keys(data[0] || {}));
      },
      error: () => toast.error("Failed to parse CSV"),
    });
  }

  async function importCsv() {
    try {
      setBusy(true);
      const r = await fetch("/api/import/csv", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rows }),
      });
      const json = await r.json();
      if (!r.ok) throw new Error(json.error || "Import failed");
      toast.success(`Imported ${json.count} rows (preview)`);
    } catch (e: any) {
      toast.error(e.message || "Import error");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-semibold tracking-tight">Transactions</h1>
        <p className="text-muted-foreground">View and manage your transactions</p>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex-1">
              <Input placeholder="Search transactions..." />
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" asChild>
                <label className="cursor-pointer">
                  <input type="file" accept=".csv" onChange={onFile} className="hidden" />
                  Import CSV
                </label>
              </Button>
              <Button onClick={importCsv} disabled={!rows.length || busy}>Add Transaction</Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {rows.length > 0 ? (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    {cols.map((c) => (
                      <TableHead key={c}>{c}</TableHead>
                    ))}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {rows.slice(0, 10).map((r, i) => (
                    <TableRow key={i}>
                      {cols.map((c) => (
                        <TableCell key={c}>{String(r[c] ?? "")}</TableCell>
                      ))}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">Upload a CSV to preview transactions.</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
