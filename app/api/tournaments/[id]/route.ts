import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { computeStandings } from "@/lib/standings";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;

  const tournament = await prisma.tournament.findUnique({
    where: { id },
    include: {
      maps: { orderBy: { sortOrder: "asc" } },
      registrations: {
        include: { team: true },
        orderBy: { createdAt: "asc" },
      },
      rounds: {
        orderBy: { number: "asc" },
        include: { matches: { include: { homeTeam: true, awayTeam: true }, orderBy: { id: "asc" } } },
      },
      matches: {
        include: { homeTeam: true, awayTeam: true },
      },
    },
  });

  if (!tournament) return NextResponse.json({ error: "NOT_FOUND" }, { status: 404 });

  const approvedTeams = tournament.registrations
    .filter((r) => r.status === "APPROVED")
    .map((r) => r.team);

  const standings = computeStandings(approvedTeams, tournament.matches);

  return NextResponse.json({
    tournament: {
      id: tournament.id,
      name: tournament.name,
      startDate: tournament.startDate,
      endDate: tournament.endDate,
      status: tournament.status,
      teamLimit: tournament.teamLimit,
      maps: tournament.maps,
    },
    registrations: tournament.registrations,
    rounds: tournament.rounds,
    matches: tournament.matches,
    standings,
  });
}

