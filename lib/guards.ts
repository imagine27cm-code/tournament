import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { getToken, decode } from "next-auth/jwt";
import { type NextRequest } from "next/server";

const COOKIE_NAME = "__Secure-authjs.session-token";

function getCookieValue(cookieHeader: string, name: string): string | undefined {
  const match = cookieHeader.match(new RegExp(`(?:^|; )${name}=([^;]+)`));
  return match ? decodeURIComponent(match[1]) : undefined;
}

export async function requireSession(req?: NextRequest | Request) {
  try {
    // Попытка 1: стандартный auth()
    // @ts-ignore
    let session = await auth();

    if (!session?.user?.id) {
      // Попытка 2: auth(headers()) — для серверных компонентов
      // @ts-ignore
      session = await auth(headers());
    }

    if (!session?.user?.id && req) {
      // Попытка 3: getToken с явным cookieName и salt (NextAuth v5 beta)
      const token = await getToken({
        req: req as NextRequest,
        secret: process.env.NEXTAUTH_SECRET || process.env.AUTH_SECRET,
        cookieName: COOKIE_NAME,
        salt: COOKIE_NAME,
      });
      if (token?.uid) {
        session = {
          user: {
            id: token.uid as string,
            email: token.email as string,
            name: token.name as string | null | undefined,
            role: token.role as "PLAYER" | "ADMIN",
          },
          expires: token.exp ? new Date(token.exp * 1000).toISOString() : new Date(Date.now() + 86400000).toISOString(),
        };
      }

      // Попытка 4: ручное чтение cookie через decode
      if (!session?.user?.id) {
        const cookieHeader = req.headers.get("cookie") || "";
        const jwtValue = getCookieValue(cookieHeader, COOKIE_NAME);
        if (jwtValue) {
          const decoded = await decode({
            token: jwtValue,
            secret: (process.env.NEXTAUTH_SECRET || process.env.AUTH_SECRET)!,
            salt: COOKIE_NAME,
          });
          if (decoded?.uid) {
            session = {
              user: {
                id: decoded.uid as string,
                email: decoded.email as string,
                name: decoded.name as string | null | undefined,
                role: decoded.role as "PLAYER" | "ADMIN",
              },
              expires: decoded.exp ? new Date(decoded.exp * 1000).toISOString() : new Date(Date.now() + 86400000).toISOString(),
            };
          }
        }
      }
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
