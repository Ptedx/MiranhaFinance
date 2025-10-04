import { withAuth } from "next-auth/middleware";

export default withAuth({
  pages: { signIn: "/login" },
  callbacks: {
    authorized: ({ token }) => !!token,
  },
});

export const config = {
  matcher: [
    // Protect everything except core public assets and auth routes (including aliases)
    "/((?!api|auth|login|register|_next/static|_next/image|favicon.ico|assets|images|public).*)",
  ],
};
