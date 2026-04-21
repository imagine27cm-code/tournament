import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/guards";

type PlayerRow = {
  id: string;
  email: string;
  name: string | null;
  relationStatus: "NONE" | "OUTGOING_PENDING" | "INCOMING_PENDING" | "FRIEND";
  relationRequestId: string | null;
};

export async function GET(req: Request) {
  try {
    const session = await requireSession();
    const me = session.user!.id;

    const rows = await prisma.$queryRaw<PlayerRow[]>`
      SELECT
        u.id,
        u.email,
        u.name,
        CASE
          WHEN fr.status = 'ACCEPTED' THEN 'FRIEND'
          WHEN fr.status = 'PENDING' AND fr.fromUserId = ${me} THEN 'OUTGOING_PENDING'
          WHEN fr.status = 'PENDING' AND fr.toUserId = ${me} THEN 'INCOMING_PENDING'
          ELSE 'NONE'
        END as relationStatus,
        fr.id as relationRequestId
      FROM "User" u
      LEFT JOIN "FriendRequest" fr
        ON (
          (fr.fromUserId = ${me} AND fr.toUserId = u.id)
          OR
          (fr.toUserId = ${me} AND fr.fromUserId = u.id)
        )
      WHERE u.id <> ${me}
      ORDER BY u.email ASC
    `;

    return NextResponse.json({ players: rows });
  } catch {
    return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });
  }
}

