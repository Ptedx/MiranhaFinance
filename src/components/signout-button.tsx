"use client";

import { signOut } from "next-auth/react";
import { Button, buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function SignOutButton() {
  return (
    <Button
      variant="outline"
      size="sm"
      onClick={() => signOut({ callbackUrl: "/auth/login" })}
      className={cn(buttonVariants({}))}
    >
      Sign out
    </Button>
  );
}

