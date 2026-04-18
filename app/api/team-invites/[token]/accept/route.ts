import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/guards";

export async function POST(
  _req: Request,
  { params }: { params: Promise<{ token: string }> },
) {
  try {
    const session = await requireSession();
    const userId = session.user!.id;
    const { token } = await params;

    const invite = await prisma.teamInvite.findUnique({
      where: { token },
      include: { team: true },
    });

    if (!invite) return NextResponse.json({ error: "NOT_FOUND" }, { status: 404 });
    if (invite.status !== "PENDING") {
      return NextResponse.json({ error: "INVITE_NOT_ACTIVE" }, { status: 409 });
    }
    if (invite.expiresAt.getTime() < Date.now()) {
      await prisma.teamInvite.update({
        where: { id: invite.id },
        data: { status: "EXPIRED" },
      });
      return NextResponse.json({ error: "INVITE_EXPIRED" }, { status: 410 });
    }
    if (invite.email && invite.email.toLowerCase() !== session.user?.email?.toLowerCase()) {
      return NextResponse.json({ error: "INVITE_EMAIL_MISMATCH" }, { status: 403 });
    }

    await prisma.$transaction(async (tx) => {
      await tx.teamMember.upsert({
        where: { teamId_userId: { teamId: invite.teamId, userId } },
        update: {},
        create: { teamId: invite.teamId, userId, isCaptain: false },
      });
      await tx.teamInvite.update({
        where: { id: invite.id },
        data: { status: "ACCEPTED", acceptedById: userId },
      });
    });

    return NextResponse.json({ ok: true, teamId: invite.teamId });
  } catch {
    return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });
  }
}

