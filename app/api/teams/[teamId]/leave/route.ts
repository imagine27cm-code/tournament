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

  // Удаляем игрока из команды
  await prisma.team.update({
    where: { id: teamId },
    data: {
      members: {
        disconnect: { id: userId }
      }
    }
  });

  return NextResponse.json({ ok: true });
}