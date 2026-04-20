import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request, { params }: { params: Promise<{ teamId: string }> }) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });

  const { teamId } = await params;

  // Находим команду
  const team = await prisma.team.findUnique({
    where: { id: teamId },
    select: { id: true, captainId: true, members: { select: { id: true } } }
  });

  if (!team) return NextResponse.json({ error: "NOT_FOUND" }, { status: 404 });

  // Удаляем игрока из команды
  await prisma.team.update({
    where: { id: teamId },
    data: {
      members: {
        disconnect: { id: session.user.id }
      }
    }
  });

  // ✅ Если после выхода в команде не осталось никого - удаляем команду полностью
  const remainingMembers = team.members.filter(m => m.id !== session.user!.id);

  if (remainingMembers.length === 0) {
    await prisma.team.delete({
      where: { id: teamId }
    });

    return NextResponse.json({ ok: true, deleted: true });
  }

  // ✅ Если вышел капитан - передаём капитанство первому оставшемуся члену
  if (team.captainId === session.user.id && remainingMembers.length > 0) {
    await prisma.team.update({
      where: { id: teamId },
      data: { captainId: remainingMembers[0].id }
    });
  }

  return NextResponse.json({ ok: true });
}