import { redirect } from "next/navigation";
import { auth } from "@/auth";

export default async function RegisterAlias() {
  const session = await auth();
  if (session?.user) redirect("/dashboard");
  redirect("/auth/register");
}
