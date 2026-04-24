import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/guards";
import { computeStandings } from "@/lib/standings";
import { processMatchResult } from "@/lib/rpSystem";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const session = await requireSession(req);
    if (session.user!.role !== "ADMIN") {
      return NextResponse.json({ error: "FORBIDDEN" }, { status: 403 });
    }

    const { id: tournamentId } = await params;

    const tournament = await prisma.tournament.findUnique({
      where: { id: tournamentId },
      include: {
        registrations: { where: { status: "APPROVED" }, include: { team: { include: { members: { include: { user: true } } } } } },
        matches: { include: { games: true } },
      },
    });

    if (!tournament) return NextResponse.json({ error: "NOT_FOUND" }, { status: 404 });
    if (tournament.status !== "ONGOING") {
      return NextResponse.json({ error: "BAD_STATUS" }, { status: 409 });
    }

    const allFinished = tournament.matches.every((m) => m.status === "FINISHED");
    if (!allFinished) {
      return NextResponse.json({ error: "MATCHES_NOT_FINISHED" }, { status: 409 });
    }

    const teams = tournament.registrations.map((r) => r.team);
    const standings = computeStandings(teams, tournament.matches);

    // Обновляем RP и статистику для всех участников команд
    await prisma.$transaction(async (tx) => {
      for (const match of tournament.matches) {
        if (!match.winnerTeamId) continue;

        const winnerTeam = teams.find((t) => t.id === match.winnerTeamId);
        const loserTeamId = match.homeTeamId === match.winnerTeamId ? match.awayTeamId : match.homeTeamId;
        const loserTeam = teams.find((t) => t.id === loserTeamId);

        if (!winnerTeam || !loserTeam) continue;

        // Получаем всех участников обеих команд
        const winnerMembers = winnerTeam.members;
        const loserMembers = loserTeam.members;

        for (const wm of winnerMembers) {
          const w = wm.user;
          // Находим первого проигравшего для расчёта RP
          const lm = loserMembers[0];
          if (!lm) continue;
          const l = lm.user;

          const result = processMatchResult(
            { rp: w.rp, xp: w.xp, wins: w.wins, winStreak: w.winStreak, bestWinStreak: w.bestWinStreak },
            { rp: l.rp, xp: l.xp, losses: l.losses, winStreak: l.winStreak },
          );

          await tx.user.update({
            where: { id: w.id },
            data: {
              rp: result.winner.rp,
              xp: result.winner.xp,
              level: result.winner.level,
              wins: result.winner.wins,
              winStreak: result.winner.winStreak,
              bestWinStreak: result.winner.bestWinStreak,
            },
          });
        }

        for (const lm of loserMembers) {
          const l = lm.user;
          // Находим первого победителя для расчёта RP (уже вычислено выше)
          const wm = winnerMembers[0];
          if (!wm) continue;
          const w = wm.user;

          const result = processMatchResult(
            { rp: w.rp, xp: w.xp, wins: w.wins, winStreak: w.winStreak, bestWinStreak: w.bestWinStreak },
            { rp: l.rp, xp: l.xp, losses: l.losses, winStreak: l.winStreak },
          );

          await tx.user.update({
            where: { id: l.id },
            data: {
              rp: result.loser.rp,
              xp: result.loser.xp,
              level: result.loser.level,
              losses: result.loser.losses,
              winStreak: result.loser.winStreak,
            },
          });
        }
      }

      await tx.tournament.update({
        where: { id: tournamentId },
        data: { status: "COMPLETED" },
      });
    });

    return NextResponse.json({ ok: true, standings });
  } catch (e: unknown) {
    const err = e as { message?: string } | null;
    if (err?.message === "FORBIDDEN") return NextResponse.json({ error: "FORBIDDEN" }, { status: 403 });
    if (err?.message === "UNAUTHORIZED") return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });
    return NextResponse.json({ error: "INTERNAL_ERROR" }, { status: 500 });
  }
}
