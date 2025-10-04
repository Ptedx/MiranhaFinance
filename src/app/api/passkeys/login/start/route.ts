import { NextResponse } from "next/server";
import { prisma } from "@/server/prisma";
import { z } from "zod";
import { generateAuthenticationOptions } from "@simplewebauthn/server";

const schema = z.object({ email: z.string().email() });

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { email } = schema.parse(body);
    const user = await prisma.user.findUnique({ where: { email }, include: { passkeys: true } });
    if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });
    const rpID = process.env.AUTH_WEBAUTHN_RP_ID || "localhost";
    const options = await generateAuthenticationOptions({
      rpID,
      allowCredentials: user.passkeys.map((p) => ({ id: Buffer.from(p.credentialId, "base64url"), type: "public-key" as const })),
      userVerification: "preferred",
    });
    await prisma.user.update({ where: { id: user.id }, data: { webauthnChallenge: options.challenge } });
    return NextResponse.json(options);
  } catch (e: any) {
    return NextResponse.json({ error: e.message || "Bad request" }, { status: 400 });
  }
}

