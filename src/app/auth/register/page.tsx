"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";

export default function RegisterPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    const res = await fetch("/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, email, password }),
    });
    setLoading(false);
    if (res.ok) {
      toast.success("Account created");
      const s = await signIn("password", { email, password, redirect: false });
      if (s?.ok) router.replace("/dashboard");
    } else {
      const { error } = await res.json().catch(() => ({ error: "Registration failed" }));
      toast.error(error || "Registration failed");
    }
  }

  return (
    <div className="mx-auto mt-10 max-w-md">
      <Card>
        <CardHeader>
          <CardTitle>Create account</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={onSubmit} className="space-y-4">
            <div>
              <label className="block text-sm text-muted-foreground">Name</label>
              <Input value={name} onChange={(e) => setName(e.target.value)} required />
            </div>
            <div>
              <label className="block text-sm text-muted-foreground">Email</label>
              <Input value={email} onChange={(e) => setEmail(e.target.value)} type="email" required />
            </div>
            <div>
              <label className="block text-sm text-muted-foreground">Password</label>
              <Input value={password} onChange={(e) => setPassword(e.target.value)} type="password" minLength={6} required />
            </div>
            <Button type="submit" disabled={loading} className="w-full">Create account</Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

