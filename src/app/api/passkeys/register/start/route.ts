import { auth } from "@/auth";
import { NextResponse } from "next/server";
import { prisma } from "@/server/prisma";
import { generateRegistrationOptions } from "@simplewebauthn/server";

export async function POST() {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const user = await prisma.user.findUnique({ where: { id: session.user.id }, include: { passkeys: true } });
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const rpName = process.env.AUTH_WEBAUTHN_RP_NAME || "Miranha Finance";
  const rpID = process.env.AUTH_WEBAUTHN_RP_ID || "localhost";
  const existing = user.passkeys.map((p) => ({ id: Buffer.from(p.credentialId, "base64url"), type: "public-key" as const }));
  const options = await generateRegistrationOptions({
    rpName,
    rpID,
    userID: user.id,
    userName: user.email,
    excludeCredentials: existing,
    attestationType: "none",
  });
  await prisma.user.update({ where: { id: user.id }, data: { webauthnChallenge: options.challenge } });
  return NextResponse.json(options);
}

