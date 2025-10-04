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
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <span className="hidden md:inline">MiranhaFinance</span>
        </div>
        <div className="flex items-center gap-2">
          {session?.user ? (
            <SignOutButton />
          ) : (
            <>
              <Link href="/auth/login" className={cn(buttonVariants({ variant: "outline", size: "sm" }))}>Sign in</Link>
              <Link href="/auth/register" className={cn(buttonVariants({ size: "sm" }))}>Register</Link>
            </>
          )}
          <ThemeToggle />
        </div>
      </div>
    </header>
  );
}
