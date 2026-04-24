import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/guards";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ token: string }> },
) {
  try {
    const session = await requireSession(req);
    const { token } = await params;

    const invite = await prisma.teamInvite.findUnique({
      where: { token },
      include: { team: true },
    });

    if (!invite) return NextResponse.json({ error: "NOT_FOUND" }, { status: 404 });
    if (invite.status !== "PENDING") {
      return NextResponse.json({ error: "ALREADY_HANDLED" }, { status: 409 });
    }

    await prisma.teamInvite.update({
      where: { id: invite.id },
      data: { status: "DECLINED" },
    });

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });
  }
}
