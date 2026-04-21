import { auth } from "@/lib/auth";

export async function requireSession() {
  try {
    // auth() сам определяет контекст в Next Auth v5
    // @ts-ignore
    const session = await auth();
    if (!session?.user?.id) throw new Error("UNAUTHORIZED");
    return session;
  } catch {
    throw new Error("UNAUTHORIZED");
  }
}

export async function requireAdmin() {
  const session = await requireSession();
  if (session.user?.role !== "ADMIN") {
    const { redirect } = await import("next/navigation");
    redirect("/dashboard");
  }
  return session;
}

