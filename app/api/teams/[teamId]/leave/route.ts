import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request, { params }: { params: Promise<{ teamId: string }> }) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });

  // ✅ Гарантированно достаём userId после проверки
  const userId = session.user.id;

  const { teamId } = await params;

  // Находим команду
  const team = await prisma.team.findUnique({
    where: { id: teamId },
    select: { id: true, captainId: true, members: { select: { id: true } } }
  });

  if (!team) return NextResponse.json({ error: "NOT_FOUND" }, { status: 404 });

  // Удаляем игрока из команды (используем deleteMany для явной join-таблицы)
  await prisma.teamMember.deleteMany({
    where: { teamId, userId }
  });

  // Если капитан вышел и в команде никого не осталось — удаляем команду
  const remainingMembers = await prisma.teamMember.count({ where: { teamId } });
  if (remainingMembers === 0) {
    await prisma.team.delete({ where: { id: teamId } });
  }

  return NextResponse.json({ ok: true });
}