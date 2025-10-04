import { prisma } from "@/server/prisma";

const DEFAULT_CATEGORIES = [
  { name: "Income", color: "#16A34A" },
  { name: "Food", color: "#10B981" },
  { name: "Transport", color: "#2563EB" },
  { name: "Shopping", color: "#F59E0B" },
  { name: "Bills", color: "#EF4444" },
  { name: "Entertainment", color: "#8B5CF6" },
  { name: "Health", color: "#DC2626" },
  { name: "Education", color: "#1F2937" },
  { name: "Investments", color: "#065F46" },
  { name: "Subscriptions", color: "#0EA5E9" },
  { name: "Taxes", color: "#EA580C" },
  { name: "Gifts", color: "#E11D48" },
  { name: "Fees", color: "#6B7280" },
  { name: "Transfer", color: "#334155" },
  { name: "Others", color: "#9CA3AF" },
];

export async function ensureUserCategories(userId: string) {
  const count = await prisma.category.count({ where: { userId } });
  if (count > 0) {
    // Ensure "Others" exists even if user has categories
    const existsOthers = await prisma.category.findFirst({ where: { userId, name: "Others" } });
    if (!existsOthers) {
      await prisma.category.create({ data: { userId, name: "Others", color: "#9CA3AF" } });
    }
    return;
  }

  for (const c of DEFAULT_CATEGORIES) {
    await prisma.category.create({ data: { userId, name: c.name, color: c.color } });
  }
}
