import { auth } from "@/lib/auth";
import type { NextRequest } from "next/server";
import { cache } from "react";

// Оборачиваем auth() в кэш React. Это решает ВСЕ проблемы!
const getSession = cache(async () => {
  return await auth();
});

export async function requireSession(req?: any) {
  let session;
  
  if (req) {
    session = await auth(req);
  } else {
    session = await getSession();
  }

  if (!session?.user?.id) throw new Error("UNAUTHORIZED");
  return session;
}

export async function requireAdmin(req?: NextRequest) {
  const session = await requireSession(req);
  if (session.user?.role !== "ADMIN") {
    const { redirect } = await import("next/navigation");
    redirect("/dashboard");
  }
  return session;
}

