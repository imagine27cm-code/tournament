import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/guards";
import { phaseOwnerTeamId } from "@/lib/banFlow";

const ReadySchema = z.object({ ready: z.boolean() });

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const session = await requireSession();
    const userId = session.user!.id;
    const { id: matchId } = await params;

    const body = await req.json().catch(() => null);
    const parsed = ReadySchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "INVALID_INPUT", details: parsed.error.flatten() },
        { status: 400 },
      );
    }

    const match = await prisma.match.findUnique({
      where: { id: matchId },
      include: { homeTeam: true, awayTeam: true },
    });
    if (!match) return NextResponse.json({ error: "NOT_FOUND" }, { status: 404 });

    const isHomeCaptain = match.homeTeam.captainId === userId;
    const isAwayCaptain = match.awayTeam.captainId === userId;
    if (!isHomeCaptain && !isAwayCaptain) {
      return NextResponse.json({ error: "ONLY_CAPTAIN" }, { status: 403 });
    }

    const updated = await prisma.match.update({
      where: { id: matchId },
      data: isHomeCaptain ? { homeReady: parsed.data.ready } : { awayReady: parsed.data.ready },
    });

    // Start bans automatically once both teams ready.
    if (
      updated.status === "SCHEDULED" &&
      ((isHomeCaptain ? parsed.data.ready : updated.homeReady) && (isAwayCaptain ? parsed.data.ready : updated.awayReady))
    ) {
      const turnTeamId = phaseOwnerTeamId(updated, "T1_BAN_1");
      await prisma.match.update({
        where: { id: matchId },
        data: {
          status: "BANNING",
          banPhase: "T1_BAN_1",
          banTurnTeamId: turnTeamId ?? undefined,
          banTurnEndsAt: new Date(Date.now() + 60_000),
        },
      });
    }

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });
  }
}

