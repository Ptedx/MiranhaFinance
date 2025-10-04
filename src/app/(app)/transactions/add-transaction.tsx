"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

type Account = { id: string; name: string; currency: string };
type Category = { id: string; name: string };

export function AddTransactionButton({ accountId, onAdded }: { accountId?: string; onAdded?: () => void }) {
  const [open, setOpen] = useState(false);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loadingMeta, setLoadingMeta] = useState(false);
  const router = useRouter();

  useEffect(() => {
    if (!open) return;
    (async () => {
      try {
        setLoadingMeta(true);
        const [accRes, catRes] = await Promise.all([
          fetch("/api/accounts"),
          fetch("/api/categories"),
        ]);
        const [accs, cats] = await Promise.all([accRes.json(), catRes.json()]);
        // accounts endpoint returns with extra fields; map minimal
        setAccounts((accs || []).map((a: any) => ({ id: a.id, name: a.name, currency: a.currency })));
        setCategories(cats || []);
      } catch {
        toast.error("Failed to load form data");
      } finally {
        setLoadingMeta(false);
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

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>+ Add Transaction</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add Transaction</DialogTitle>
          <DialogDescription>Record a new transaction manually.</DialogDescription>
        </DialogHeader>
        <AddTransactionForm
          accounts={accounts}
          categories={categories}
          defaultAccountId={accountId}
          loadingMeta={loadingMeta}
          onSuccess={() => {
            setOpen(false);
            router.refresh();
            onAdded?.();
          }}
        />
      </DialogContent>
    </Dialog>
  );
}

function AddTransactionForm({ accounts, categories, defaultAccountId, loadingMeta, onSuccess }: { accounts: Account[]; categories: Category[]; defaultAccountId?: string; loadingMeta: boolean; onSuccess: () => void }) {
  const [submitting, setSubmitting] = useState(false);
  const [description, setDescription] = useState("");
  const [amount, setAmount] = useState<string>("0");
  const [date, setDate] = useState<string>(() => new Date().toISOString().slice(0, 10));
  const [accountId, setAccountId] = useState<string | undefined>(defaultAccountId);
  const [categoryId, setCategoryId] = useState<string | undefined>(undefined);
  const [status, setStatus] = useState<string>("POSTED");
  const [notes, setNotes] = useState<string>("");

  useEffect(() => {
    if (!accountId && accounts.length) setAccountId(defaultAccountId || accounts[0]?.id);
  }, [accounts, accountId, defaultAccountId]);

  const accountCurrency = useMemo(() => accounts.find((a) => a.id === accountId)?.currency || "USD", [accounts, accountId]);

  const categoriesOrdered = useMemo(() => {
    const arr = [...categories];
    arr.sort((a, b) => {
      if (a.name === "Others" && b.name !== "Others") return 1;
      if (b.name === "Others" && a.name !== "Others") return -1;
      return a.name.localeCompare(b.name);
    });
    return arr;
  }, [categories]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!accountId) return;
    if (!categoryId) {
      toast.error("Please select a category");
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch("/api/transactions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          accountId,
          date,
          amount,
          currency: accountCurrency,
          description,
          categoryId,
          status,
          notes: notes || undefined,
        }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json.error || "Failed to create");
      toast.success("Transaction added");
      // reset minimal fields
      setDescription("");
      setAmount("0");
      onSuccess();
    } catch (e: any) {
      toast.error(e?.message || "Error adding transaction");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <div className="space-y-2">
        <label htmlFor="desc" className="text-sm font-medium">Description</label>
        <Input id="desc" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="e.g., Grocery Store" required />
      </div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <label htmlFor="amount" className="text-sm font-medium">Amount</label>
          <Input id="amount" type="number" step="0.01" value={amount} onChange={(e) => setAmount(e.target.value)} />
        </div>
        <div className="space-y-2">
          <label htmlFor="date" className="text-sm font-medium">Date</label>
          <Input id="date" type="date" value={date} onChange={(e) => setDate(e.target.value)} />
        </div>
      </div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <label htmlFor="category" className="text-sm font-medium">Category</label>
          <Select value={categoryId} onValueChange={setCategoryId}>
            <SelectTrigger id="category"><SelectValue placeholder="Select category" /></SelectTrigger>
            <SelectContent>
              {categoriesOrdered.map((c) => (
                <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <label htmlFor="account" className="text-sm font-medium">Account</label>
          <Select value={accountId} onValueChange={setAccountId}>
            <SelectTrigger id="account"><SelectValue placeholder={loadingMeta ? "Loading..." : "Select account"} /></SelectTrigger>
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
          <label htmlFor="status" className="text-sm font-medium">Status</label>
          <Select value={status} onValueChange={setStatus}>
            <SelectTrigger id="status"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="POSTED">posted</SelectItem>
              <SelectItem value="PENDING">pending</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <label htmlFor="notes" className="text-sm font-medium">Notes</label>
          <Input id="notes" value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Optional notes" />
        </div>
      </div>
      <DialogFooter>
        <Button type="submit" disabled={submitting || loadingMeta}>{submitting ? "Saving..." : "Add Transaction"}</Button>
      </DialogFooter>
    </form>
  );
}
