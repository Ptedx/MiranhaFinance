import { auth } from "@/auth";
import { NextResponse } from "next/server";
import { prisma } from "@/server/prisma";
import { verifyRegistrationResponse } from "@simplewebauthn/server";

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const user = await prisma.user.findUnique({ where: { id: session.user.id } });
  if (!user || !user.webauthnChallenge) return NextResponse.json({ error: "No challenge" }, { status: 400 });

  const body = await req.json();

  const rpID = process.env.AUTH_WEBAUTHN_RP_ID || "localhost";
  const expectedOrigin = process.env.AUTH_ORIGIN || "http://localhost:3000";

  let verified = false;
  try {
    const result = await verifyRegistrationResponse({
      response: body,
      expectedChallenge: user.webauthnChallenge,
      expectedOrigin,
      expectedRPID: rpID,
    });
    verified = result.verified;
    if (!verified) return NextResponse.json({ error: "Verification failed" }, { status: 400 });
    const { credential } = result.registrationInfo!;
    await prisma.webAuthnCredential.create({
      data: {
        userId: user.id,
        credentialId: Buffer.from(credential.id).toString("base64url"),
        publicKey: Buffer.from(credential.publicKey).toString("base64url"),
        counter: credential.counter,
        transports: body.transports?.join(","),
        deviceType: result.registrationInfo?.authenticatorDeviceType,
        backedUp: result.registrationInfo?.credentialBackedUp ?? false,
      },
    });
    await prisma.user.update({ where: { id: user.id }, data: { webauthnChallenge: null } });
    return NextResponse.json({ ok: true });
  } catch (e: any) {
    return NextResponse.json({ error: e.message || "Bad request" }, { status: 400 });
  }
}

