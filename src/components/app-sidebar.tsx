import Link from "next/link";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { SidebarNav } from "./sidebar-nav";

export default async function AppSidebar() {
  // Server wrapper: keeps sidebar static and lightweight
  const items = [
    { href: "/dashboard", label: "Dashboard", icon: "LayoutDashboard" },
    { href: "/accounts", label: "Accounts", icon: "Wallet" },
    { href: "/transactions", label: "Transactions", icon: "List" },
    { href: "/budgets", label: "Budgets", icon: "PiggyBank" },
    { href: "/goals", label: "Goals", icon: "Target" },
    { href: "/settings", label: "Settings", icon: "Settings" },
  ];

  return (
    <aside className="sticky top-0 hidden h-dvh w-64 shrink-0 border-r bg-muted/40 px-3 py-4 md:block">
      <div className="mb-4 px-2">
        <Link href="/dashboard" className="block select-none text-lg font-semibold tracking-tight text-foreground">
          MiranhaFinance
        </Link>
        <div className="text-xs text-muted-foreground mt-1">Navigation</div>
      </div>
      <SidebarNav items={items} />
      <div className="mt-auto hidden px-2 md:block">
        <div className={cn("text-[11px] text-muted-foreground pt-6")}>Build preview</div>
        <Badge variant="outline" className="mt-2">v0.1</Badge>
      </div>
    </aside>
  );
}

