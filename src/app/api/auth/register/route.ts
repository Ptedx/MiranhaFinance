import { NextResponse } from "next/server";
import { prisma } from "@/server/prisma";
import { z } from "zod";
import { hash } from "bcryptjs";

const schema = z.object({
  name: z.string().min(1),
  email: z.string().email(),
  password: z.string().min(6),
});

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { name, email, password } = schema.parse(body);
    const exists = await prisma.user.findUnique({ where: { email } });
    if (exists) return NextResponse.json({ error: "Email already in use" }, { status: 400 });
    const passwordHash = await hash(password, 10);
    await prisma.user.create({ data: { email, name, passwordHash } });
    return NextResponse.json({ ok: true });
  } catch (e: any) {
    return NextResponse.json({ error: e.message ?? "Bad request" }, { status: 400 });
  }
}

