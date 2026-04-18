import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/guards";

export async function POST(
  _req: Request,
  { params }: { params: Promise<{ id: string; regId: string }> },
) {
  try {
    await requireAdmin();
    const { id: tournamentId, regId } = await params;

    const tournament = await prisma.tournament.findUnique({ where: { id: tournamentId } });
    if (!tournament) return NextResponse.json({ error: "NOT_FOUND" }, { status: 404 });

    const approvedCount = await prisma.tournamentRegistration.count({
      where: { tournamentId, status: "APPROVED" },
    });
    if (approvedCount >= tournament.teamLimit) {
      return NextResponse.json({ error: "TOURNAMENT_FULL" }, { status: 409 });
    }

    const reg = await prisma.tournamentRegistration.update({
      where: { id: regId },
      data: { status: "APPROVED" },
      include: { team: true },
    });

    return NextResponse.json({ registration: reg });
  } catch (e: unknown) {
    const err = e as { message?: string } | null;
    if (err?.message === "FORBIDDEN") return NextResponse.json({ error: "FORBIDDEN" }, { status: 403 });
    return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });
  }
}

