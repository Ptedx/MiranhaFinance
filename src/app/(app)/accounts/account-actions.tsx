"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
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
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { MoreVertical } from "lucide-react";

type Account = {
  id: string;
  name: string;
  type: "CHECKING" | "SAVINGS" | "CREDIT_CARD" | "BROKERAGE" | "CRYPTO" | string;
  currency: string;
  balance: number;
  institution?: { name: string; type: string } | null;
};

export function AccountActionsMenu({ account }: { account: Account }) {
  const router = useRouter();
  const [editOpen, setEditOpen] = useState(false);
  const [viewOpen, setViewOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon" aria-label="Account actions">
            <MoreVertical className="size-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-48">
          <DropdownMenuItem onClick={() => setEditOpen(true)}>Edit</DropdownMenuItem>
          <DropdownMenuItem onClick={() => setViewOpen(true)}>View Transactions</DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem variant="destructive" onClick={() => setDeleteOpen(true)}>Delete</DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <EditAccountDialog open={editOpen} setOpen={setEditOpen} account={account} onUpdated={() => router.refresh()} />
      <ViewTransactionsDialog open={viewOpen} setOpen={setViewOpen} account={account} />
      <DeleteAccountDialog open={deleteOpen} setOpen={setDeleteOpen} account={account} onDeleted={() => router.refresh()} />
    </>
  );
}

function EditAccountDialog({ open, setOpen, account, onUpdated }: { open: boolean; setOpen: (v: boolean) => void; account: Account; onUpdated: () => void }) {
  const [name, setName] = useState(account.name);
  const [type, setType] = useState<string>(account.type);
  const [currency, setCurrency] = useState<string>(account.currency);
  const [balance, setBalance] = useState<string>(String(account.balance ?? 0));
  const [institutionName, setInstitutionName] = useState<string>(account.institution?.name || "");
  const [institutionType, setInstitutionType] = useState<string>(account.institution?.type || "bank");
  const [submitting, setSubmitting] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    try {
      const res = await fetch(`/api/accounts/${account.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, type, currency, balance, institutionName: institutionName.trim() || undefined, institutionType }),
      });
      if (!res.ok) throw new Error("Update failed");
      toast.success("Account updated");
      setOpen(false);
      onUpdated();
    } catch (e: any) {
      toast.error(e?.message || "Failed to update");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit Account</DialogTitle>
          <DialogDescription>Modify account details.</DialogDescription>
        </DialogHeader>
        <form onSubmit={onSubmit} className="space-y-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <label htmlFor="name" className="text-sm font-medium">Name</label>
              <Input id="name" value={name} onChange={(e) => setName(e.target.value)} required />
            </div>
            <div className="space-y-2">
              <label htmlFor="type" className="text-sm font-medium">Type</label>
              <Select value={type} onValueChange={setType}>
                <SelectTrigger id="type"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="CHECKING">Checking</SelectItem>
                  <SelectItem value="SAVINGS">Savings</SelectItem>
                  <SelectItem value="CREDIT_CARD">Credit Card</SelectItem>
                  <SelectItem value="BROKERAGE">Brokerage</SelectItem>
                  <SelectItem value="CRYPTO">Crypto</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <label htmlFor="currency" className="text-sm font-medium">Currency</label>
              <Select value={currency} onValueChange={setCurrency}>
                <SelectTrigger id="currency"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="USD">USD</SelectItem>
                  <SelectItem value="BRL">BRL</SelectItem>
                  <SelectItem value="EUR">EUR</SelectItem>
                  <SelectItem value="GBP">GBP</SelectItem>
                  <SelectItem value="JPY">JPY</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <label htmlFor="balance" className="text-sm font-medium">Balance</label>
              <Input id="balance" type="number" step="0.01" value={balance} onChange={(e) => setBalance(e.target.value)} />
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <label htmlFor="inst" className="text-sm font-medium">Institution</label>
              <Input id="inst" value={institutionName} onChange={(e) => setInstitutionName(e.target.value)} placeholder="Optional" />
            </div>
            <div className="space-y-2">
              <label htmlFor="instType" className="text-sm font-medium">Institution Type</label>
              <Select value={institutionType} onValueChange={setInstitutionType}>
                <SelectTrigger id="instType"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="bank">Bank</SelectItem>
                  <SelectItem value="broker">Broker</SelectItem>
                  <SelectItem value="card">Card</SelectItem>
                  <SelectItem value="crypto">Crypto</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)} disabled={submitting}>Cancel</Button>
            <Button type="submit" disabled={submitting}>{submitting ? "Saving..." : "Save changes"}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function ViewTransactionsDialog({ open, setOpen, account }: { open: boolean; setOpen: (v: boolean) => void; account: Account }) {
  const router = useRouter();
  const mock = [
    { date: "2025-01-02", description: "Grocery Store", amount: -65.32 },
    { date: "2025-01-03", description: "Salary", amount: 3200.0 },
    { date: "2025-01-05", description: "Electric Bill", amount: -120.45 },
    { date: "2025-01-08", description: "Coffee Shop", amount: -4.9 },
    { date: "2025-01-10", description: "Transfer", amount: -250.0 },
  ];
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Transactions — {account.name}</DialogTitle>
          <DialogDescription>Preview only. Full transactions experience will arrive soon.</DialogDescription>
        </DialogHeader>
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Description</TableHead>
                <TableHead className="text-right">Amount</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {mock.map((r, i) => (
                <TableRow key={i}>
                  <TableCell>{r.date}</TableCell>
                  <TableCell>{r.description}</TableCell>
                  <TableCell className="text-right">{formatCurrency(r.amount, account.currency)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>Close</Button>
          <Button onClick={() => router.push(`/transactions?accountId=${account.id}`)}>Go to Transactions</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function DeleteAccountDialog({ open, setOpen, account, onDeleted }: { open: boolean; setOpen: (v: boolean) => void; account: Account; onDeleted: () => void }) {
  const [busy, setBusy] = useState(false);
  async function confirm() {
    setBusy(true);
    try {
      const res = await fetch(`/api/accounts/${account.id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Delete failed");
      toast.success("Account deleted");
      setOpen(false);
      onDeleted();
    } catch (e: any) {
      toast.error(e?.message || "Failed to delete");
    } finally {
      setBusy(false);
    }
  }
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Delete account?</DialogTitle>
          <DialogDescription>This action is reversible later, but transactions remain linked. The account will be hidden.</DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)} disabled={busy}>Cancel</Button>
          <Button variant="destructive" onClick={confirm} disabled={busy}>{busy ? "Deleting..." : "Delete"}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function formatCurrency(n: number, currency: string) {
  try {
    return new Intl.NumberFormat(undefined, { style: "currency", currency }).format(n);
  } catch {
    return `${currency} ${n.toFixed(2)}`;
  }
}

