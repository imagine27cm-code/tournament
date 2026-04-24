import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/guards";

const SendFriendRequestSchema = z.object({
  toUserId: z.string().min(1),
});

export async function GET(req: Request) {
  try {
    const session = await requireSession(req);
    const me = session.user!.id;

    const incoming = await prisma.$queryRaw<
      Array<{ id: string; fromUserId: string; email: string; name: string | null }>
    >`
      SELECT fr.id, fr.fromUserId, u.email, u.name
      FROM "FriendRequest" fr
      JOIN "User" u ON u.id = fr.fromUserId
      WHERE fr.toUserId = ${me} AND fr.status = 'PENDING'
      ORDER BY fr.createdAt DESC
    `;

    return NextResponse.json({ incoming });
  } catch {
    return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });
  }
}

export async function POST(req: Request) {
  try {
    const session = await requireSession(req);
    const me = session.user!.id;
    const body = await req.json().catch(() => null);
    const parsed = SendFriendRequestSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "INVALID_INPUT", details: parsed.error.flatten() },
        { status: 400 },
      );
    }

    const toUserId = parsed.data.toUserId;
    if (toUserId === me) return NextResponse.json({ error: "SELF_NOT_ALLOWED" }, { status: 400 });

    // Generate UUID in JS for PostgreSQL compatibility
    const id = crypto.randomUUID();
    await prisma.$executeRaw`
      INSERT INTO "FriendRequest" (id, "fromUserId", "toUserId", status, "createdAt", "updatedAt")
      VALUES (${id}, ${me}, ${toUserId}, 'PENDING', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
      ON CONFLICT("fromUserId", "toUserId") DO UPDATE SET status='PENDING', "updatedAt"=CURRENT_TIMESTAMP
    `;

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });
  }
}

