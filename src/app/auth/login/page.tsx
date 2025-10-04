"use client";

import { useEffect, useState } from "react";
import { signIn } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";
// import { startAuthentication } from "@simplewebauthn/browser";
import Link from "next/link";
import { useSession } from "next-auth/react";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  // const params = useSearchParams();
  const { status } = useSession();

  useEffect(() => {
    if (status === "authenticated") router.replace("/dashboard");
  }, [status, router]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    const res = await signIn("password", { email, password, redirect: false });
    setLoading(false);
    if (res?.ok) {
      router.replace("/dashboard");
    } else {
      toast.error("Invalid email or password");
    }
  }

  // async function loginWithPasskey() {
  //   try {
  //     setLoading(true);
  //     // 1) Ask server for auth options (stores challenge in DB)
  //     const r1 = await fetch("/api/passkeys/login/start", {
  //       method: "POST",
  //       headers: { "Content-Type": "application/json" },
  //       body: JSON.stringify({ email }),
  //     });
  //     if (!r1.ok) throw new Error("Failed to start passkey login");
  //     const options = await r1.json();
  //     // 2) Browser performs ceremony
  //     const assertion = await startAuthentication(options);
  //     // 3) Use NextAuth credentials provider to verify & sign in
  //     const res = await signIn("passkey", {
  //       email,
  //       assertion: JSON.stringify(assertion),
  //       redirect: false,
  //     });
  //     if (res?.ok) {
  //       router.replace("/dashboard");
  //     } else {
  //       throw new Error(res?.error || "Passkey sign-in failed");
  //     }
  //   } catch (e: any) {
  //     toast.error(e.message || "Passkey error");
  //   } finally {
  //     setLoading(false);
  //   }
  // }

  return (
    <div className="mx-auto mt-10 max-w-md">
      <Card>
        <CardHeader>
          <CardTitle>Sign in</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={onSubmit} className="space-y-4">
            <div>
              <label className="block text-sm text-muted-foreground">Email</label>
              <Input value={email} onChange={(e) => setEmail(e.target.value)} type="email" required />
            </div>
            <div>
              <label className="block text-sm text-muted-foreground">Password</label>
              <Input value={password} onChange={(e) => setPassword(e.target.value)} type="password" required />
            </div>
            <div className="flex gap-2">
              <Button type="submit" disabled={loading} className="w-full">
                Sign in
              </Button>
             
            </div>
          </form>
          <div className="mt-4 text-sm text-muted-foreground">
            Don&apos;t have an account? {" "}
            <Link href="/auth/register" className="text-primary underline-offset-4 hover:underline">
              Create one
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
