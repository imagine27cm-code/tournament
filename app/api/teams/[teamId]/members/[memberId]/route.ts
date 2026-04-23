import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function DELETE(req: Request, { params }: { params: Promise<{ teamId: string; memberId: string }> }) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });

  const { teamId, memberId } = await params;

  // Проверяем что это капитан
  const team = await prisma.team.findUnique({
    where: { id: teamId },
    select: { id: true, captainId: true, members: { select: { id: true } } }
  });

  if (!team) return NextResponse.json({ error: "NOT_FOUND" }, { status: 404 });

  // ✅ ТОЛЬКО КАПИТАН МОЖЕТ КИКАТЬ ИГРОКОВ!
  if (team.captainId !== session.user.id) {
    return NextResponse.json({ error: "FORBIDDEN" }, { status: 403 });
  }

  // Нельзя кикнуть самого себя
  if (memberId === session.user.id) {
    return NextResponse.json({ error: "CANNOT_KICK_YOURSELF" }, { status: 400 });
  }

  // Кикаем игрока (используем deleteMany для явной join-таблицы)
  await prisma.teamMember.deleteMany({
    where: { teamId, userId: memberId }
  });

  return NextResponse.json({ ok: true });
}