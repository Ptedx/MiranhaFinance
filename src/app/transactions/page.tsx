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
      <Card>
        <CardHeader>
          <CardTitle>Transactions</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-3">
            <Input type="file" accept=".csv" onChange={onFile} />
            <Button onClick={importCsv} disabled={!rows.length || busy}>Import CSV</Button>
          </div>
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
            <p className="text-sm text-muted-foreground">Transactions table and import will go here.</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
