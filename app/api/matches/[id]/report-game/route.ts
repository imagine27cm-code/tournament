import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/guards";
import { randomMap } from "@/lib/banFlow";

const ReportSchema = z.object({
  gameNumber: z.number().int().min(1).max(3),
  winnerTeamId: z.string().min(1),
  nextMapId: z.string().min(1).optional(),
});

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const session = await requireSession();
    const userId = session.user!.id;
    const { id: matchId } = await params;

    const body = await req.json().catch(() => null);
    const parsed = ReportSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "INVALID_INPUT", details: parsed.error.flatten() },
        { status: 400 },
      );
    }

    const out = await prisma.$transaction(async (tx) => {
      const match = await tx.match.findUnique({
        where: { id: matchId },
        include: {
          tournament: { include: { maps: true } },
          homeTeam: true,
          awayTeam: true,
          bans: true,
          games: true,
        },
      });
      if (!match) return { error: "NOT_FOUND" as const, status: 404 };
      if (match.status !== "IN_PROGRESS") return { error: "BAD_STATUS" as const, status: 409 };

      const isHomeCaptain = match.homeTeam.captainId === userId;
      const isAwayCaptain = match.awayTeam.captainId === userId;
      if (!isHomeCaptain && !isAwayCaptain) return { error: "ONLY_CAPTAIN" as const, status: 403 };

      if (![match.homeTeamId, match.awayTeamId].includes(parsed.data.winnerTeamId)) {
        return { error: "BAD_WINNER" as const, status: 400 };
      }

      const game = match.games.find((g) => g.gameNumber === parsed.data.gameNumber);
      if (!game) return { error: "GAME_NOT_FOUND" as const, status: 404 };
      if (game.completedAt) return { error: "GAME_ALREADY_REPORTED" as const, status: 409 };

      await tx.matchGame.update({
        where: { id: game.id },
        data: {
          winnerTeamId: parsed.data.winnerTeamId,
          completedAt: new Date(),
        },
      });

      const gamesAfter = await tx.matchGame.findMany({
        where: { matchId },
        orderBy: { gameNumber: "asc" },
      });

      const homeWins = gamesAfter.filter((g) => g.winnerTeamId === match.homeTeamId).length;
      const awayWins = gamesAfter.filter((g) => g.winnerTeamId === match.awayTeamId).length;

      if (homeWins >= 2 || awayWins >= 2) {
        const winnerTeamId = homeWins > awayWins ? match.homeTeamId : match.awayTeamId;
        await tx.match.update({
          where: { id: matchId },
          data: {
            status: "FINISHED",
            winnerTeamId,
            finishedAt: new Date(),
          },
        });
        return { ok: true as const, finished: true as const, winnerTeamId };
      }

      const nextGameNumber = parsed.data.gameNumber + 1;
      const hasNext = gamesAfter.some((g) => g.gameNumber === nextGameNumber);
      if (!hasNext) {
        const loserTeamId =
          parsed.data.winnerTeamId === match.homeTeamId ? match.awayTeamId : match.homeTeamId;

        const banned = new Set(match.bans.map((b) => b.mapId));
        const used = new Set(gamesAfter.map((g) => g.mapId));
        const exclude = new Set<string>([...banned, ...used]);

        const nextMap =
          (parsed.data.nextMapId
            ? match.tournament.maps.find((m) => m.id === parsed.data.nextMapId && !exclude.has(m.id))
            : null) ?? randomMap(match.tournament.maps, exclude);

        if (!nextMap) return { error: "NO_MAPS_LEFT" as const, status: 500 };

        await tx.matchGame.create({
          data: {
            matchId,
            gameNumber: nextGameNumber,
            mapId: nextMap.id,
            pickedByTeamId: loserTeamId,
          },
        });
      }

      return { ok: true as const, finished: false as const, homeWins, awayWins };
    });

    if ("error" in out) return NextResponse.json({ error: out.error }, { status: out.status });
    return NextResponse.json(out);
  } catch {
    return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });
  }
}

