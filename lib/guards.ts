import { auth } from "@/lib/auth";
import { headers } from "next/headers";

// ✅ ЕДИНСТВЕННОЕ РАБОЧЕЕ РЕШЕНИЕ ДЛЯ NEXT AUTH v5
export async function requireSession() {
  try {
    // ✅ В серверных компонентах работает auth()
    // @ts-ignore
    let session = await auth();
    
    if (!session?.user?.id) {
      // ✅ В API маршрутах нужно передать headers()
      // @ts-ignore
      session = await auth(headers());
    }
    
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

