import { NextResponse } from "next/server";
import crypto from "crypto";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/guards";
import { generateRoundRobin } from "@/lib/roundRobin";

export async function POST(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    await requireAdmin();
    const { id: tournamentId } = await params;

    const tournament = await prisma.tournament.findUnique({
      where: { id: tournamentId },
      include: { registrations: true, matches: true },
    });
    if (!tournament) return NextResponse.json({ error: "NOT_FOUND" }, { status: 404 });
    if (tournament.status !== "REGISTRATION") {
      return NextResponse.json({ error: "BAD_STATUS" }, { status: 409 });
    }
    if (tournament.matches.length > 0) {
      return NextResponse.json({ error: "ALREADY_STARTED" }, { status: 409 });
    }

    const teamIds = tournament.registrations
      .filter((r) => r.status === "APPROVED")
      .map((r) => r.teamId);

    if (teamIds.length < 2) {
      return NextResponse.json({ error: "NOT_ENOUGH_TEAMS" }, { status: 400 });
    }

    const rr = generateRoundRobin(teamIds);

    await prisma.$transaction(async (tx) => {
      await tx.tournament.update({
        where: { id: tournamentId },
        data: { status: "ONGOING" },
      });

      for (const round of rr) {
        const createdRound = await tx.round.create({
          data: { tournamentId, number: round.roundNumber },
        });

        for (const m of round.matches) {
          const seed = crypto.randomInt(0, 1000000);
          await tx.match.create({
            data: {
              tournamentId,
              roundId: createdRound.id,
              homeTeamId: m.homeTeamId,
              awayTeamId: m.awayTeamId,
              status: "SCHEDULED",
              banSeed: seed,
              banPhase: "T1_BAN_1",
            },
          });
        }
      }
    });

    return NextResponse.json({ ok: true, rounds: rr.length });
  } catch (e: unknown) {
    const err = e as { message?: string } | null;
    if (err?.message === "FORBIDDEN") return NextResponse.json({ error: "FORBIDDEN" }, { status: 403 });
    return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });
  }
}

