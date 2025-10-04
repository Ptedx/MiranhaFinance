import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/server/prisma";
import { Prisma, TxnStatus } from "@prisma/client";
import { z } from "zod";

const ListSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
  q: z.string().optional(),
  accountId: z.string().optional(),
  categoryId: z.string().optional(),
  status: z.enum(["PENDING", "POSTED"]).optional(),
  dateFrom: z.string().datetime().optional(),
  dateTo: z.string().datetime().optional(),
});

const CreateSchema = z.object({
  accountId: z.string().min(1),
  date: z.union([z.string(), z.date()]).transform((v) => (typeof v === "string" ? new Date(v) : v)),
  amount: z.union([z.number(), z.string()]).transform((v) => (typeof v === "string" ? Number(v) : v)),
  currency: z.string().length(3).optional(),
  description: z.string().min(1),
  notes: z.string().optional(),
  categoryId: z.string().min(1),
  subcategoryId: z.string().optional(),
  tags: z.array(z.string()).optional(),
  status: z.enum(["PENDING", "POSTED"]).default("POSTED"),
  counterpart: z.string().optional(),
});

export async function GET(req: Request) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const userId = session.user.id;
  const url = new URL(req.url);
  const parsed = ListSchema.safeParse(Object.fromEntries(url.searchParams));
  if (!parsed.success) return NextResponse.json({ error: "Invalid query" }, { status: 400 });
  const { page, pageSize, q, accountId, categoryId, status, dateFrom, dateTo } = parsed.data;

  const where: Prisma.TransactionWhereInput = {
    userId,
    deletedAt: null,
    ...(q ? { OR: [{ description: { contains: q, mode: "insensitive" } }, { notes: { contains: q, mode: "insensitive" } }] } : {}),
    ...(accountId ? { accountId } : {}),
    ...(categoryId ? { categoryId } : {}),
    ...(status ? { status } : {}),
    ...(dateFrom || dateTo
      ? { date: { gte: dateFrom ? new Date(dateFrom) : undefined, lte: dateTo ? new Date(dateTo) : undefined } }
      : {}),
  };

  const [total, rows] = await Promise.all([
    prisma.transaction.count({ where }),
    prisma.transaction.findMany({
      where,
      include: { account: { select: { name: true, currency: true } }, category: { select: { name: true } } },
      orderBy: { date: "desc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
  ]);

  return NextResponse.json({
    data: rows.map((t) => ({
      id: t.id,
      date: t.date,
      description: t.description,
      amount: Number(t.amount),
      currency: t.currency,
      status: t.status,
      account: { id: t.accountId, name: t.account.name },
      category: t.category ? { id: t.categoryId!, name: t.category.name } : null,
    })),
    meta: { total, page, pageSize, hasMore: page * pageSize < total },
  });
}

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const userId = session.user.id;

  let body: z.infer<typeof CreateSchema>;
  try {
    body = CreateSchema.parse(await req.json());
  } catch {
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
  }

  // Validate account ownership and get default currency
  const account = await prisma.finAccount.findFirst({ where: { id: body.accountId, userId, deletedAt: null } });
  if (!account) return NextResponse.json({ error: "Account not found" }, { status: 404 });

  const cat = await prisma.category.findFirst({ where: { id: body.categoryId, userId } });
  if (!cat) return NextResponse.json({ error: "Category not found" }, { status: 400 });

  const currency = body.currency || account.currency;
  const decimalAmount = new Prisma.Decimal(isFinite(body.amount) ? body.amount : 0);
  const shouldAffectBalance = body.status === TxnStatus.POSTED;

  try {
    const result = await prisma.$transaction(async (tx) => {
      const created = await tx.transaction.create({
        data: {
          userId,
          accountId: body.accountId,
          date: body.date,
          amount: decimalAmount,
          currency,
          description: body.description,
          notes: body.notes,
          categoryId: body.categoryId,
          subcategoryId: body.subcategoryId,
          tags: body.tags || [],
          status: body.status,
          counterpart: body.counterpart,
        },
      });
      if (shouldAffectBalance) {
        await tx.finAccount.update({ where: { id: body.accountId }, data: { balance: { increment: decimalAmount } as any } });
      }
      return created;
    });

    return NextResponse.json({ id: result.id });
  } catch (e) {
    return NextResponse.json({ error: "Failed to create transaction" }, { status: 500 });
  }
}
