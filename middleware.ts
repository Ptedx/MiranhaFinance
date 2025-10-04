export { default as middleware } from "next-auth/middleware";

export const config = {
  matcher: ["/dashboard/:path*", "/accounts/:path*", "/transactions/:path*", "/settings/:path*"],
};
