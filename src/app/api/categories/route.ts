import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/server/prisma";
import { ensureUserCategories } from "@/lib/data/categories";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const userId = session.user.id;
  await ensureUserCategories(userId);
  const cats = await prisma.category.findMany({ where: { userId }, orderBy: [{ name: "asc" }] });
  return NextResponse.json(cats.map((c) => ({ id: c.id, name: c.name, color: c.color })));
}
