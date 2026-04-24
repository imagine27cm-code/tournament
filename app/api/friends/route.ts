import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/guards";

export async function GET(req: Request) {
  try {
    const session = await requireSession(req);
    const me = session.user!.id;

    const rows = await prisma.$queryRaw<
      Array<{ id: string; email: string; name: string | null }>
    >`
      SELECT u.id, u.email, u.name
      FROM "User" u
      JOIN "FriendRequest" fr
        ON (
          (fr."fromUserId" = ${me} AND fr."toUserId" = u.id)
          OR
          (fr."toUserId" = ${me} AND fr."fromUserId" = u.id)
        )
      WHERE fr.status = 'ACCEPTED'
      ORDER BY u.name ASC NULLS LAST
    `;

    return NextResponse.json({ friends: rows });
  } catch {
    return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });
  }
}
