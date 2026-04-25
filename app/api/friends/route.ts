import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/guards";

export async function GET(req: Request) {
  try {
    const session = await requireSession(req);
    const me = session.user!.id;

    // Обновляем последнюю активность текущего пользователя
    await prisma.user.update({
      where: { id: me },
      data: { lastActivityAt: new Date() },
    });

    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);

    const rows = await prisma.$queryRaw<
      Array<{ id: string; email: string; name: string | null; lastActivityAt: Date | null }>
    >`
      SELECT u.id, u.email, u.name, u."lastActivityAt"
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

    const friends = rows.map((r) => ({
      ...r,
      online: r.lastActivityAt && new Date(r.lastActivityAt) > fiveMinutesAgo,
    }));

    return NextResponse.json({ friends });
  } catch {
    return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });
  }
}
