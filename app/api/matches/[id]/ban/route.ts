import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/guards";
import { nextPhase, phaseOwnerTeamId, randomMap } from "@/lib/banFlow";

const BanSchema = z.object({ mapId: z.string().min(1) });

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const session = await requireSession();
    const userId = session.user!.id;
    const { id: matchId } = await params;

    const body = await req.json().catch(() => null);
    const parsed = BanSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "INVALID_INPUT", details: parsed.error.flatten() },
        { status: 400 },
      );
    }

    const result = await prisma.$transaction(async (tx) => {
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
      if (match.status !== "BANNING") return { error: "NOT_BANNING" as const, status: 409 };
      if (match.banPhase === "DONE") return { error: "BAN_DONE" as const, status: 409 };

      const isHomeCaptain = match.homeTeam.captainId === userId;
      const isAwayCaptain = match.awayTeam.captainId === userId;
      if (!isHomeCaptain && !isAwayCaptain) return { error: "ONLY_CAPTAIN" as const, status: 403 };

      const actingTeamId = isHomeCaptain ? match.homeTeamId : match.awayTeamId;
      const expectedTeamId = phaseOwnerTeamId(match, match.banPhase);
      if (!expectedTeamId || expectedTeamId !== actingTeamId) {
        return { error: "NOT_YOUR_TURN" as const, status: 409 };
      }

      const bannedSet = new Set(match.bans.map((b) => b.mapId));
      if (bannedSet.has(parsed.data.mapId)) {
        return { error: "MAP_ALREADY_BANNED" as const, status: 409 };
      }

      const banOrder = match.bans.length + 1;
      await tx.matchBan.create({
        data: { matchId, teamId: actingTeamId, mapId: parsed.data.mapId, banOrder },
      });

      const newPhase = nextPhase(match.banPhase);
      if (newPhase === "DONE") {
        // pick first map randomly from remaining 11
        bannedSet.add(parsed.data.mapId);
        const map = randomMap(match.tournament.maps, bannedSet);
        if (!map) return { error: "NO_MAPS_LEFT" as const, status: 500 };

        await tx.matchGame.create({
          data: {
            matchId,
            gameNumber: 1,
            mapId: map.id,
          },
        });

        await tx.match.update({
          where: { id: matchId },
          data: {
            banPhase: "DONE",
            banTurnTeamId: null,
            banTurnEndsAt: null,
            status: "IN_PROGRESS",
            startedAt: new Date(),
          },
        });

        return { ok: true as const };
      }

      const nextTurnTeamId = phaseOwnerTeamId(match, newPhase);
      await tx.match.update({
        where: { id: matchId },
        data: {
          banPhase: newPhase,
          banTurnTeamId: nextTurnTeamId ?? null,
          banTurnEndsAt: new Date(Date.now() + 60_000),
        },
      });

      return { ok: true as const };
    });

    if ("error" in result) {
      return NextResponse.json({ error: result.error }, { status: result.status });
    }
    return NextResponse.json(result);
  } catch {
    return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });
  }
}

