import type { Metadata } from "next";

export const metadata: Metadata = { title: "Auth | Miranha Finance" };

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8 py-6">{children}</div>;
}

