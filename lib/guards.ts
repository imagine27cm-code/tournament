import { auth } from "@/lib/auth";
import { headers } from "next/headers";

export async function requireSession() {
  const headersList = await headers();
  const cookie = headersList.get("cookie") ?? "NO COOKIE";
  const authSession = await auth();
  
  // ДЕБАГ: смотрим что реально приходит
  console.log("DEBUG requireSession:", {
    hasCookie: !!cookie,
    hasAuthSession: !!authSession,
    userId: authSession?.user?.id ?? "NULL",
    cookiePreview: cookie.slice(0, 150)
  });

  if (!authSession?.user?.id) throw new Error("UNAUTHORIZED");
  return authSession;
}

export async function requireAdmin() {
  const session = await requireSession();
  if (session.user?.role !== "ADMIN") {
    const { redirect } = await import("next/navigation");
    redirect("/dashboard");
  }
  return session;
}

