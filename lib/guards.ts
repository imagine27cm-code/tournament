import { auth } from "@/lib/auth";
import type { NextRequest } from "next/server";

export async function requireSession(req?: any) {
  const session = await auth(req);
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

