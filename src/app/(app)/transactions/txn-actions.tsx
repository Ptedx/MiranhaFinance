"use client";

import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { MoreVertical } from "lucide-react";

type Txn = {
  id: string;
  date: string;
  description: string;
  amount: number;
  currency: string;
  status: "PENDING" | "POSTED";
  account: { id: string; name: string };
  category: { id: string; name: string } | null;
};

export function TxnActions({ txn, onChanged }: { txn: Txn; onChanged: () => void }) {
  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon" aria-label="Transaction actions">
            <MoreVertical className="size-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onClick={() => setEditOpen(true)}>Edit</DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem variant="destructive" onClick={() => setDeleteOpen(true)}>Delete</DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
      <EditTxnDialog open={editOpen} setOpen={setEditOpen} txn={txn} onChanged={onChanged} />
      <DeleteTxnDialog open={deleteOpen} setOpen={setDeleteOpen} txn={txn} onChanged={onChanged} />
    </>
  );
}

function EditTxnDialog({ open, setOpen, txn, onChanged }: { open: boolean; setOpen: (v: boolean) => void; txn: Txn; onChanged: () => void }) {
  const [accounts, setAccounts] = useState<Array<{ id: string; name: string; currency: string }>>([]);
  const [categories, setCategories] = useState<Array<{ id: string; name: string }>>([]);
  const [loading, setLoading] = useState(false);

  const [description, setDescription] = useState(txn.description);
  const [amount, setAmount] = useState(String(txn.amount));
  const [date, setDate] = useState(txn.date.slice(0, 10));
  const [accountId, setAccountId] = useState(txn.account.id);
  const [categoryId, setCategoryId] = useState(txn.category?.id);
  const [status, setStatus] = useState(txn.status);
  const [notes, setNotes] = useState("");

  useEffect(() => {
    if (!open) return;
    (async () => {
      try {
        setLoading(true);
        const [accRes, catRes] = await Promise.all([fetch("/api/accounts"), fetch("/api/categories")]);
        const [accs, cats] = await Promise.all([accRes.json(), catRes.json()]);
        setAccounts((accs || []).map((a: any) => ({ id: a.id, name: a.name, currency: a.currency })));
        setCategories(cats || []);
      } catch {
        toast.error("Failed to load data");
      } finally {
        setLoading(false);
      }
    })();
  }, [open]);

  const categoriesOrdered = useMemo(() => {
    const arr = [...categories];
    arr.sort((a, b) => {
      if (a.name === "Others" && b.name !== "Others") return 1;
      if (b.name === "Others" && a.name !== "Others") return -1;
      return a.name.localeCompare(b.name);
    });
    return arr;
  }, [categories]);

  async function save() {
    if (!categoryId) {
      toast.error("Please select a category");
      return;
    }
    try {
      setLoading(true);
      const res = await fetch(`/api/transactions/${txn.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          description,
          amount,
          date,
          accountId,
          categoryId,
          status,
          notes: notes || undefined,
        }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json.error || "Update failed");
      toast.success("Transaction updated");
      setOpen(false);
      onChanged();
    } catch (e: any) {
      toast.error(e?.message || "Error updating");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit Transaction</DialogTitle>
          <DialogDescription>Adjust fields and save.</DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium" htmlFor="desc">Description</label>
            <Input id="desc" value={description} onChange={(e) => setDescription(e.target.value)} />
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <label className="text-sm font-medium" htmlFor="amt">Amount</label>
              <Input id="amt" type="number" step="0.01" value={amount} onChange={(e) => setAmount(e.target.value)} />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium" htmlFor="date">Date</label>
              <Input id="date" type="date" value={date} onChange={(e) => setDate(e.target.value)} placeholder="dd/mm/yyyy" />
            </div>
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <label className="text-sm font-medium">Category</label>
              <Select value={categoryId} onValueChange={setCategoryId}>
                <SelectTrigger><SelectValue placeholder="Select category" /></SelectTrigger>
                <SelectContent>
                  {categoriesOrdered.map((c) => (
                    <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Account</label>
              <Select value={accountId} onValueChange={setAccountId}>
                <SelectTrigger><SelectValue placeholder={loading ? "Loading..." : "Select account"} /></SelectTrigger>
                <SelectContent>
                  {accounts.map((a) => (
                    <SelectItem key={a.id} value={a.id}>{a.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <label className="text-sm font-medium">Status</label>
              <Select value={status} onValueChange={(v) => setStatus(v as any)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="POSTED">posted</SelectItem>
                  <SelectItem value="PENDING">pending</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium" htmlFor="notes">Notes</label>
              <Input id="notes" value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Optional notes" />
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)} disabled={loading}>Cancel</Button>
          <Button onClick={save} disabled={loading}>{loading ? "Saving..." : "Save changes"}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function DeleteTxnDialog({ open, setOpen, txn, onChanged }: { open: boolean; setOpen: (v: boolean) => void; txn: Txn; onChanged: () => void }) {
  const [busy, setBusy] = useState(false);
  async function confirm() {
    try {
      setBusy(true);
      const res = await fetch(`/api/transactions/${txn.id}`, { method: "DELETE" });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json.error || "Delete failed");
      toast.success("Transaction deleted");
      setOpen(false);
      onChanged();
    } catch (e: any) {
      toast.error(e?.message || "Error deleting");
    } finally {
      setBusy(false);
    }
  }
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Delete transaction?</DialogTitle>
          <DialogDescription>This will remove it from reports and adjust account balance if posted.</DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)} disabled={busy}>Cancel</Button>
          <Button variant="destructive" onClick={confirm} disabled={busy}>{busy ? "Deleting..." : "Delete"}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
