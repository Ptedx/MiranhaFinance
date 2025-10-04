"use client";

import { useState } from "react";
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

type Props = { defaultCurrency?: string };

export function AddAccountDialog({ defaultCurrency = "USD" }: Props) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const [name, setName] = useState("");
  const [type, setType] = useState<string>("CHECKING");
  const [currency, setCurrency] = useState<string>(defaultCurrency);
  const [balance, setBalance] = useState<string>("0");
  const [institutionName, setInstitutionName] = useState<string>("");
  const [institutionType, setInstitutionType] = useState<string>("bank");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name || !type) return;
    setSubmitting(true);
    try {
      const res = await fetch("/api/accounts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          type,
          currency,
          balance,
          institutionName: institutionName.trim() || undefined,
          institutionType: institutionName.trim() ? institutionType : undefined,
        }),
      });
      if (!res.ok) throw new Error("Failed to create account");
      toast.success("Account created");
      setOpen(false);
      // Reset fields
      setName("");
      setType("CHECKING");
      setCurrency(defaultCurrency);
      setBalance("0");
      setInstitutionName("");
      setInstitutionType("bank");
      router.refresh();
    } catch (err: any) {
      toast.error(err?.message || "Error creating account");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="default">Add Account</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>New Account</DialogTitle>
          <DialogDescription>Set up a financial account to track balances and transactions.</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <label htmlFor="name" className="text-sm font-medium">Name</label>
              <Input id="name" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g., Checking" required />
            </div>
            <div className="space-y-2">
              <label htmlFor="type" className="text-sm font-medium">Type</label>
              <Select value={type} onValueChange={setType}>
                <SelectTrigger id="type"><SelectValue placeholder="Select type" /></SelectTrigger>
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
                <SelectTrigger id="currency"><SelectValue placeholder="Select currency" /></SelectTrigger>
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
              <label htmlFor="balance" className="text-sm font-medium">Initial Balance</label>
              <Input id="balance" value={balance} onChange={(e) => setBalance(e.target.value)} type="number" step="0.01" />
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <label htmlFor="institution" className="text-sm font-medium">Institution (optional)</label>
              <Input id="institution" value={institutionName} onChange={(e) => setInstitutionName(e.target.value)} placeholder="e.g., Chase Bank" />
            </div>
            <div className="space-y-2">
              <label htmlFor="institutionType" className="text-sm font-medium">Institution Type</label>
              <Select value={institutionType} onValueChange={setInstitutionType}>
                <SelectTrigger id="institutionType"><SelectValue /></SelectTrigger>
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
            <Button type="submit" disabled={submitting}>{submitting ? "Saving..." : "Create"}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
