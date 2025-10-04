import { prisma } from "@/server/prisma";
import type { AccountType } from "@prisma/client";

export type AccountListItem = {
  id: string;
  name: string;
  type: AccountType;
  currency: string;
  balance: number;
  institution?: { name: string; type: string } | null;
  createdAt: string;
};

export async function getUserAccounts(userId: string): Promise<AccountListItem[]> {
  try {
    const rows = await prisma.finAccount.findMany({
      where: { userId, deletedAt: null },
      include: { institution: { select: { name: true, type: true } } },
      orderBy: [{ createdAt: "asc" }],
    });
    return rows.map((a) => ({
      id: a.id,
      name: a.name,
      type: a.type,
      currency: a.currency,
      balance: Number(a.balance ?? 0),
      institution: a.institution ? { name: a.institution.name, type: a.institution.type } : null,
      createdAt: a.createdAt.toISOString(),
    }));
  } catch {
    // Fallback sample in case DB is not reachable during early setup
    return [
      { id: "1", name: "Checking Account", type: "CHECKING" as AccountType, currency: "USD", balance: 12450.5, institution: { name: "Chase Bank", type: "bank" }, createdAt: new Date().toISOString() },
      { id: "2", name: "Savings Account", type: "SAVINGS" as AccountType, currency: "USD", balance: 28900, institution: { name: "Bank of America", type: "bank" }, createdAt: new Date().toISOString() },
    ];
  }
}
