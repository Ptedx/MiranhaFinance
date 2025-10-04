import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/server/prisma";
import { Prisma } from "@prisma/client";
import { z } from "zod";

const UpdateSchema = z.object({
  name: z.string().min(1).optional(),
  type: z.enum(["CHECKING", "SAVINGS", "CREDIT_CARD", "BROKERAGE", "CRYPTO"]).optional(),
  currency: z.string().length(3).optional(),
  balance: z.union([z.number(), z.string()]).optional().transform((v) => (typeof v === "string" ? Number(v) : v)),
  institutionName: z.string().min(1).optional(),
  institutionType: z.string().optional(),
});

export async function PATCH(_req: Request, { params }: { params: { id: string } }) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const userId = session.user.id;
  const id = params.id;

  let body: z.infer<typeof UpdateSchema>;
  try {
    body = UpdateSchema.parse(await _req.json());
  } catch {
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
  }

  try {
    const acc = await prisma.finAccount.findFirst({ where: { id, userId, deletedAt: null } });
    if (!acc) return NextResponse.json({ error: "Not found" }, { status: 404 });

    let institutionId = acc.institutionId || undefined;
    if (body.institutionName) {
      const existing = await prisma.institution.findFirst({ where: { name: body.institutionName } });
      if (existing) institutionId = existing.id;
      else {
        const created = await prisma.institution.create({ data: { name: body.institutionName, type: body.institutionType || "bank" } });
        institutionId = created.id;
      }
    }

    const data: any = {};
    if (typeof body.name !== "undefined") data.name = body.name;
    if (typeof body.type !== "undefined") data.type = body.type;
    if (typeof body.currency !== "undefined") data.currency = body.currency;
    if (typeof body.balance !== "undefined" && isFinite(Number(body.balance))) data.balance = new Prisma.Decimal(Number(body.balance));
    if (typeof institutionId !== "undefined") data.institutionId = institutionId;

    await prisma.finAccount.update({ where: { id }, data });
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Failed to update" }, { status: 500 });
  }
}

export async function DELETE(_req: Request, { params }: { params: { id: string } }) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const userId = session.user.id;
  const id = params.id;

  try {
    const acc = await prisma.finAccount.findFirst({ where: { id, userId, deletedAt: null } });
    if (!acc) return NextResponse.json({ error: "Not found" }, { status: 404 });
    // Soft delete
    await prisma.finAccount.update({ where: { id }, data: { deletedAt: new Date() } });
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Failed to delete" }, { status: 500 });
  }
}

