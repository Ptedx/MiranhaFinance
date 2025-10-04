import Link from "next/link";
import { ThemeToggle } from "@/components/theme-toggle";
import { cn } from "@/lib/utils";
import { buttonVariants } from "@/components/ui/button";
import { auth } from "@/auth";
import { SignOutButton } from "@/components/signout-button";

export async function SiteHeader() {
  const session = await auth();
  return (
    <header className="sticky top-0 z-40 w-full border-b bg-background/80 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="mx-auto flex h-14 max-w-7xl items-center justify-between gap-3 px-4 sm:px-6 lg:px-8">
        <div className="flex items-center gap-6">
          <Link href="/dashboard" className="font-semibold tracking-tight text-foreground">
            Miranha Finance
          </Link>
          <nav className="hidden items-center gap-2 text-sm font-medium md:flex">
            <Link href="/dashboard" className={cn(buttonVariants({ variant: "ghost" }), "px-3")}>Dashboard</Link>
            <Link href="/accounts" className={cn(buttonVariants({ variant: "ghost" }), "px-3")}>Accounts</Link>
            <Link href="/transactions" className={cn(buttonVariants({ variant: "ghost" }), "px-3")}>Transactions</Link>
            {session?.user ? (
              <Link href="/settings/security" className={cn(buttonVariants({ variant: "ghost" }), "px-3")}>Settings</Link>
            ) : null}
          </nav>
        </div>
        <div className="flex items-center gap-2">
          {session?.user ? (
            <SignOutButton />
          ) : (
            <Link href="/auth/login" className={cn(buttonVariants({ variant: "outline", size: "sm" }))}>Sign in</Link>
          )}
          <ThemeToggle />
        </div>
      </div>
    </header>
  );
}
