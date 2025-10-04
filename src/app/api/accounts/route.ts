import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/server/prisma";
import { AccountType, Prisma } from "@prisma/client";
import { z } from "zod";

const CreateAccountSchema = z.object({
  name: z.string().min(1, "Name is required"),
  type: z.enum(["CHECKING", "SAVINGS", "CREDIT_CARD", "BROKERAGE", "CRYPTO"]).transform((v) => v as AccountType),
  currency: z.string().length(3).optional().default("USD"),
  balance: z.union([z.number(), z.string()]).transform((v) => (typeof v === "string" ? Number(v) : v)),
  institutionName: z.string().min(1).optional(),
  institutionType: z.string().optional(),
});

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const userId = session.user.id;
  try {
    const accounts = await prisma.finAccount.findMany({
      where: { userId, deletedAt: null },
      include: { institution: { select: { name: true, type: true } } },
      orderBy: { createdAt: "asc" },
    });
    return NextResponse.json(
      accounts.map((a) => ({
        id: a.id,
        name: a.name,
        type: a.type,
        currency: a.currency,
        balance: Number(a.balance ?? 0),
        institution: a.institution ? { name: a.institution.name, type: a.institution.type } : null,
        createdAt: a.createdAt,
      }))
    );
  } catch (e) {
    return NextResponse.json({ error: "Failed to fetch accounts" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const userId = session.user.id;

  let parsed;
  try {
    const body = await req.json();
    parsed = CreateAccountSchema.parse(body);
  } catch (e) {
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
  }

  try {
    let institutionId: string | undefined = undefined;
    if (parsed.institutionName) {
      const existing = await prisma.institution.findFirst({ where: { name: parsed.institutionName } });
      if (existing) institutionId = existing.id;
      else {
        const created = await prisma.institution.create({
          data: { name: parsed.institutionName, type: parsed.institutionType || "bank" },
        });
        institutionId = created.id;
      }
    }

    const acc = await prisma.finAccount.create({
      data: {
        userId,
        institutionId,
        type: parsed.type,
        name: parsed.name,
        currency: parsed.currency ?? "USD",
        balance: new Prisma.Decimal(isFinite(parsed.balance) ? parsed.balance : 0),
      },
    });

    return NextResponse.json({ id: acc.id });
  } catch (e) {
    return NextResponse.json({ error: "Failed to create account" }, { status: 500 });
  }
}
