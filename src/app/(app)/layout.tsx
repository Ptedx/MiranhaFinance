import { SiteHeader } from "@/components/site-header";
import AppSidebar from "@/components/app-sidebar";
import { auth } from "@/auth";
import { redirect } from "next/navigation";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  if (!session?.user) redirect("/login");

  return (
    <div className="flex min-h-dvh">
      <AppSidebar />
      <div className="flex min-h-dvh w-full flex-1 flex-col">
        <SiteHeader />
        <main className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8 py-6">{children}</main>
      </div>
    </div>
  );
}
