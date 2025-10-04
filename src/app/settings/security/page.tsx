"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useState } from "react";
import { startRegistration } from "@simplewebauthn/browser";
import { toast } from "sonner";

export default function SecurityPage() {
  const [loading, setLoading] = useState(false);

  async function registerPasskey() {
    try {
      setLoading(true);
      const r1 = await fetch("/api/passkeys/register/start", { method: "POST" });
      if (!r1.ok) throw new Error("Failed to start registration");
      const options = await r1.json();
      const att = await startRegistration(options);
      const r2 = await fetch("/api/passkeys/register/finish", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(att),
      });
      if (!r2.ok) throw new Error("Failed to verify passkey");
      toast.success("Passkey registered");
    } catch (e: any) {
      toast.error(e.message || "Passkey error");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Security</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">Register a passkey to sign in without a password.</p>
          <Button onClick={registerPasskey} disabled={loading}>Register Passkey</Button>
        </CardContent>
      </Card>
    </div>
  );
}

