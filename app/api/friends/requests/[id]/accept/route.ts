import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/guards";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const session = await requireSession(req);
    const me = session.user!.id;
    const { id } = await params;

    const changed = await prisma.$executeRaw`
      UPDATE "FriendRequest"
      SET status='ACCEPTED', "updatedAt"=CURRENT_TIMESTAMP
      WHERE id=${id} AND "toUserId"=${me} AND status='PENDING'
    `;

    if (changed === 0) {
      return NextResponse.json({ error: "NOT_FOUND_OR_ALREADY_HANDLED" }, { status: 404 });
    }
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });
  }
}

