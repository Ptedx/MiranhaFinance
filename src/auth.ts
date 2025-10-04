import NextAuth, { type NextAuthOptions, getServerSession } from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { PrismaAdapter } from "@auth/prisma-adapter";
import { prisma } from "@/server/prisma";
import { compare } from "bcryptjs";
import { z } from "zod";
import { verifyAuthenticationResponse } from "@simplewebauthn/server";

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma),
  // Use JWT sessions so middleware can read the token and Credentials works
  session: { strategy: "jwt" },
  trustHost: true,
  providers: [
    Credentials({
      id: "password",
      name: "Password",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(creds) {
        const schema = z.object({ email: z.string().email(), password: z.string().min(6) });
        const parsed = schema.safeParse(creds);
        if (!parsed.success) return null;
        const { email, password } = parsed.data;
        const user = await prisma.user.findUnique({ where: { email } });
        if (!user || !user.passwordHash) return null;
        const ok = await compare(password, user.passwordHash);
        if (!ok) return null;
        return { id: user.id, email: user.email, name: user.name } as any;
      },
    }),
    Credentials({
      id: "passkey",
      name: "Passkey",
      credentials: {
        email: { label: "Email", type: "email" },
        assertion: { label: "Assertion", type: "text" },
      },
      async authorize(creds) {
        const schema = z.object({ email: z.string().email(), assertion: z.string() });
        const parsed = schema.safeParse(creds);
        if (!parsed.success) return null;
        const { email, assertion } = parsed.data;
        const user = await prisma.user.findUnique({ where: { email }, include: { passkeys: true } });
        if (!user || !user.webauthnChallenge) return null;

        const rpID = process.env.AUTH_WEBAUTHN_RP_ID || "localhost";
        const expectedOrigin = process.env.AUTH_ORIGIN || "http://localhost:3000";

        const dbCredentials = user.passkeys.map((c) => ({
          credentialID: Buffer.from(c.credentialId, "base64url"),
          credentialPublicKey: Buffer.from(c.publicKey, "base64url"),
          counter: c.counter,
          transports: (c.transports ?? "").split(",").filter(Boolean),
        }));

        try {
          const result = await verifyAuthenticationResponse({
            response: JSON.parse(assertion),
            expectedChallenge: user.webauthnChallenge,
            expectedOrigin,
            expectedRPID: rpID,
            authenticator: dbCredentials[0],
          });
          if (!result.verified) return null;
          const first = user.passkeys[0];
          if (first && typeof result.authenticationInfo.newCounter === "number") {
            await prisma.webAuthnCredential.update({ where: { id: first.id }, data: { counter: result.authenticationInfo.newCounter } });
          }
          await prisma.user.update({ where: { id: user.id }, data: { webauthnChallenge: null } });
          return { id: user.id, email: user.email, name: user.name } as any;
        } catch {
          return null;
        }
      },
    }),
  ],
  pages: { signIn: "/login" },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        // on initial sign-in
        token.uid = (user as any).id;
        token.name = user.name ?? token.name;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        (session.user as any).id = (token.uid as string) || (token.sub as string);
      }
      return session;
    },
  },
  secret: process.env.AUTH_SECRET || process.env.NEXTAUTH_SECRET,
};

// Helper for Server Components
export async function auth() {
  return getServerSession(authOptions);
}


declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      name?: string | null;
      email?: string | null;
      image?: string | null;
    };
  }
}
