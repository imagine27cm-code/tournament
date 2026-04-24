import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const players = await prisma.user.findMany({
      where: { role: "PLAYER" },
      orderBy: { rp: "desc" },
      take: 50,
      select: {
        id: true,
        name: true,
        email: true,
        rp: true,
        xp: true,
        level: true,
        wins: true,
        losses: true,
        bestWinStreak: true,
      },
    });

    return NextResponse.json({ players });
  } catch {
    return NextResponse.json({ error: "INTERNAL_ERROR" }, { status: 500 });
  }
}
