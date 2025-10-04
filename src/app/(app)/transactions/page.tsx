"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { AddTransactionButton } from "./add-transaction";
import { ImportStatementDialog } from "./import-statement-dialog";
import { TxnActions } from "./txn-actions";
import { toast } from "sonner";

type Row = {
  id: string;
  date: string;
  description: string;
  amount: number;
  currency: string;
  status: "PENDING" | "POSTED";
  account: { id: string; name: string };
  category: { id: string; name: string } | null;
};

export default function TransactionsPage() {
  const sp = useSearchParams();
  const router = useRouter();
  const [q, setQ] = useState("");
  const [loading, setLoading] = useState(false);
  const [rows, setRows] = useState<Row[]>([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [totalSum, setTotalSum] = useState(0);
  const displayCurrency = useMemo(() => rows[0]?.currency || "USD", [rows]);

  const accountId = sp.get("accountId") || undefined;

  const load = useCallback(async (reset = false) => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      params.set("page", String(reset ? 1 : page));
      params.set("pageSize", "20");
      if (q) params.set("q", q);
      if (accountId) params.set("accountId", accountId);
      if (dateFrom) params.set("dateFrom", dateFrom);
      if (dateTo) params.set("dateTo", dateTo);
      const res = await fetch(`/api/transactions?${params.toString()}`);
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Failed to load");
      setRows((prev) => (reset ? json.data : [...prev, ...json.data]));
      setHasMore(json.meta?.hasMore);
      setTotalSum(json.meta?.totalSum ?? 0);
    } catch (e: any) {
      toast.error(e?.message || "Error loading transactions");
    } finally {
      setLoading(false);
    }
  }, [page, q, accountId, dateFrom, dateTo]);

  useEffect(() => {
    setPage(1);
    load(true);
  }, [q, accountId, dateFrom, dateTo]);

  useEffect(() => {
    if (page > 1) load(false);
  }, [page]);

  function onSearchChange(e: React.ChangeEvent<HTMLInputElement>) {
    setQ(e.target.value);
  }

  function clearFilters() {
    setQ("");
    setDateFrom("");
    setDateTo("");
    setPage(1);
    // load(true) will be triggered by effects
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
            <div className="flex-1 flex flex-wrap items-center gap-2 sm:flex-nowrap">
              <Input placeholder="Search transactions..." value={q} onChange={onSearchChange} className="min-w-0 flex-1" />
              <Input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} className="w-full sm:w-40" aria-label="Start date" />
              <Input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} className="w-full sm:w-40" aria-label="End date" />
              <Button variant="outline" size="sm" onClick={clearFilters} aria-label="Clear filters">Clear</Button>
            </div>
            <div className="flex items-center gap-2">
              <ImportStatementDialog onImported={() => load(true)} />
              <AddTransactionButton accountId={accountId} onAdded={() => load(true)} />
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Account</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Amount</TableHead>
                  <TableHead></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.map((r) => (
                  <TableRow key={r.id}>
                    <TableCell>{formatDate(r.date)}</TableCell>
                    <TableCell>{r.description}</TableCell>
                    <TableCell>{r.category ? <Badge variant="outline">{r.category.name}</Badge> : <span className="text-muted-foreground">—</span>}</TableCell>
                    <TableCell>{r.account.name}</TableCell>
                    <TableCell>
                      <Badge variant={r.status === "POSTED" ? undefined : "outline"}>{r.status.toLowerCase()}</Badge>
                    </TableCell>
                    <TableCell className={"text-right " + (r.amount < 0 ? "text-red-600" : "text-green-600")}>{fmt(r.amount, r.currency)}</TableCell>
                    <TableCell className="text-right">
                      <TxnActions txn={r as any} onChanged={() => load(true)} />
                    </TableCell>
                  </TableRow>
                ))}
                {rows.length === 0 && !loading && (
                  <TableRow>
                    <TableCell className="text-muted-foreground" colSpan={6}>No transactions found</TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
            <div className="flex-1 text-center">
              {hasMore ? (
                <Button variant="outline" onClick={() => setPage((p) => p + 1)} disabled={loading}>{loading ? "Loading..." : "Load more"}</Button>
              ) : (
                <span className="text-xs text-muted-foreground">{loading ? "Loading..." : rows.length ? "End of results" : ""}</span>
              )}
            </div>
            <div className="text-sm self-end sm:self-auto">
              <span className="text-muted-foreground mr-2">Total:</span>
              <span className={(totalSum < 0 ? "text-red-600" : "text-green-600") + " font-medium"}>{fmt(totalSum, displayCurrency)}</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function fmt(n: number, currency: string) {
  try {
    return new Intl.NumberFormat(undefined, { style: "currency", currency }).format(n);
  } catch {
    return `${currency} ${n.toFixed(2)}`;
  }
}

function formatDate(d: string) {
  try {
    const dt = new Date(d);
    return dt.toISOString().slice(0, 10);
  } catch {
    return d;
  }
}
