"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  Wallet,
  List,
  PiggyBank,
  Target,
  Settings as SettingsIcon,
} from "lucide-react";

type Item = { href: string; label: string; icon: string };

export function SidebarNav({ items }: { items: Item[] }) {
  const pathname = usePathname();

  function Icon({ name, className }: { name: string; className?: string }) {
    const cls = cn("size-4", className);
    switch (name) {
      case "LayoutDashboard":
        return <LayoutDashboard className={cls} />;
      case "Wallet":
        return <Wallet className={cls} />;
      case "List":
        return <List className={cls} />;
      case "PiggyBank":
        return <PiggyBank className={cls} />;
      case "Target":
        return <Target className={cls} />;
      case "Settings":
        return <SettingsIcon className={cls} />;
      default:
        return null;
    }
  }

  return (
    <nav className="flex flex-col gap-1">
      {items.map((it) => {
        const active = pathname === it.href || pathname?.startsWith(it.href + "/");
        return (
          <Link
            key={it.href}
            href={it.href}
            className={cn(
              "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium text-foreground/90",
              "hover:bg-accent hover:text-accent-foreground",
              active && "bg-accent text-accent-foreground"
            )}
          >
            <Icon name={it.icon} />
            <span>{it.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}

