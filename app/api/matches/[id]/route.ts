import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const match = await prisma.match.findUnique({
    where: { id },
    include: {
      tournament: { include: { maps: { orderBy: { sortOrder: "asc" } } } },
      homeTeam: true,
      awayTeam: true,
      bans: { include: { map: true, team: true }, orderBy: { banOrder: "asc" } },
      games: { include: { map: true }, orderBy: { gameNumber: "asc" } },
    },
  });
  if (!match) return NextResponse.json({ error: "NOT_FOUND" }, { status: 404 });
  return NextResponse.json({ match });
}

