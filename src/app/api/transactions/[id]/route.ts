import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/server/prisma";
import { Prisma, TxnStatus } from "@prisma/client";
import { z } from "zod";

const UpdateSchema = z.object({
  accountId: z.string().optional(),
  date: z.union([z.string(), z.date()]).optional().transform((v) => (typeof v === "string" ? new Date(v) : v)),
  amount: z.union([z.number(), z.string()]).optional().transform((v) => (typeof v === "string" ? Number(v) : v)),
  currency: z.string().length(3).optional(),
  description: z.string().optional(),
  notes: z.string().optional(),
  categoryId: z.string().optional(),
  status: z.enum(["PENDING", "POSTED"]).optional(),
});

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const userId = session.user.id;
  const id = params.id;

  let body: z.infer<typeof UpdateSchema>;
  try {
    body = UpdateSchema.parse(await req.json());
  } catch {
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
  }

  const existing = await prisma.transaction.findFirst({ where: { id, userId, deletedAt: null } });
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

  // Validate account and category ownership if changed
  let newAccountId = body.accountId ?? existing.accountId;
  const newAccount = await prisma.finAccount.findFirst({ where: { id: newAccountId, userId, deletedAt: null } });
  if (!newAccount) return NextResponse.json({ error: "Account not found" }, { status: 400 });

  if (typeof body.categoryId !== "undefined") {
    const cat = await prisma.category.findFirst({ where: { id: body.categoryId, userId } });
    if (!cat) return NextResponse.json({ error: "Category not found" }, { status: 400 });
  }

  const newAmount = typeof body.amount === "number" ? body.amount : Number(existing.amount);
  const newStatus: TxnStatus = (body.status as TxnStatus) ?? existing.status;
  const newCurrency = body.currency ?? existing.currency ?? newAccount.currency;

  try {
    await prisma.$transaction(async (tx) => {
      // adjust balances if needed
      const oldPosted = existing.status === TxnStatus.POSTED;
      const newPosted = newStatus === TxnStatus.POSTED;
      const oldAmount = new Prisma.Decimal(existing.amount);
      const newAmountDec = new Prisma.Decimal(newAmount);

      if (oldPosted) {
        await tx.finAccount.update({ where: { id: existing.accountId }, data: { balance: { decrement: oldAmount } as any } });
      }
      if (newPosted) {
        await tx.finAccount.update({ where: { id: newAccountId }, data: { balance: { increment: newAmountDec } as any } });
      }

      await tx.transaction.update({
        where: { id },
        data: {
          accountId: newAccountId,
          date: body.date ?? existing.date,
          amount: newAmountDec,
          currency: newCurrency,
          description: body.description ?? existing.description,
          notes: body.notes ?? existing.notes,
          categoryId: body.categoryId ?? existing.categoryId,
          status: newStatus,
        },
      });
    });
    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json({ error: "Failed to update" }, { status: 500 });
  }
}

export async function DELETE(_req: Request, { params }: { params: { id: string } }) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const userId = session.user.id;
  const id = params.id;

  const existing = await prisma.transaction.findFirst({ where: { id, userId, deletedAt: null } });
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

  try {
    await prisma.$transaction(async (tx) => {
      if (existing.status === TxnStatus.POSTED) {
        await tx.finAccount.update({ where: { id: existing.accountId }, data: { balance: { decrement: new Prisma.Decimal(existing.amount) } as any } });
      }
      await tx.transaction.update({ where: { id }, data: { deletedAt: new Date() } });
    });
    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json({ error: "Failed to delete" }, { status: 500 });
  }
}

