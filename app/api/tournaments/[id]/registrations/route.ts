import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/guards";

const RegisterSchema = z.object({
  teamId: z.string().min(1),
});

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const session = await requireSession(req);
    if (session.user!.role !== "ADMIN") {
      return NextResponse.json({ error: "FORBIDDEN" }, { status: 403 });
    }
    const { id: tournamentId } = await params;

    const registrations = await prisma.tournamentRegistration.findMany({
      where: { tournamentId },
      include: { team: { select: { id: true, name: true, captainId: true } } },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ registrations });
  } catch {
    return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });
  }
}

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const session = await requireSession(req);
    const userId = session.user!.id;
    const { id: tournamentId } = await params;

    const body = await req.json().catch(() => null);
    const parsed = RegisterSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "INVALID_INPUT", details: parsed.error.flatten() },
        { status: 400 },
      );
    }

    const team = await prisma.team.findUnique({
      where: { id: parsed.data.teamId },
      include: { members: true },
    });
    if (!team) return NextResponse.json({ error: "TEAM_NOT_FOUND" }, { status: 404 });
    if (team.captainId !== userId) {
      return NextResponse.json({ error: "ONLY_CAPTAIN" }, { status: 403 });
    }
    if (team.members.length < 2) {
      return NextResponse.json({ error: "TEAM_TOO_SMALL" }, { status: 400 });
    }

    const tournament = await prisma.tournament.findUnique({ where: { id: tournamentId } });
    if (!tournament) return NextResponse.json({ error: "TOURNAMENT_NOT_FOUND" }, { status: 404 });
    if (tournament.status !== "REGISTRATION") {
      return NextResponse.json({ error: "REGISTRATION_CLOSED" }, { status: 409 });
    }

    const approvedCount = await prisma.tournamentRegistration.count({
      where: { tournamentId, status: "APPROVED" },
    });
    if (approvedCount >= tournament.teamLimit) {
      return NextResponse.json({ error: "TOURNAMENT_FULL" }, { status: 409 });
    }

    const reg = await prisma.tournamentRegistration.upsert({
      where: { tournamentId_teamId: { tournamentId, teamId: team.id } },
      update: { status: "PENDING" },
      create: { tournamentId, teamId: team.id, status: "PENDING" },
      include: { team: true },
    });

    return NextResponse.json({ registration: reg });
  } catch {
    return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });
  }
}

