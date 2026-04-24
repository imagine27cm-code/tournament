import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/guards";

const UpdateSchema = z.object({
  status: z.enum(["APPROVED", "REJECTED"]),
});

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string; registrationId: string }> },
) {
  try {
    const session = await requireSession(req);
    if (session.user!.role !== "ADMIN") {
      return NextResponse.json({ error: "FORBIDDEN" }, { status: 403 });
    }

    const { id: tournamentId, registrationId } = await params;
    const body = await req.json().catch(() => null);
    const parsed = UpdateSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "INVALID_INPUT", details: parsed.error.flatten() },
        { status: 400 },
      );
    }

    const tournament = await prisma.tournament.findUnique({
      where: { id: tournamentId },
    });
    if (!tournament) return NextResponse.json({ error: "NOT_FOUND" }, { status: 404 });

    if (parsed.data.status === "APPROVED") {
      const approvedCount = await prisma.tournamentRegistration.count({
        where: { tournamentId, status: "APPROVED" },
      });
      if (approvedCount >= tournament.teamLimit) {
        return NextResponse.json({ error: "TOURNAMENT_FULL" }, { status: 409 });
      }
    }

    const updated = await prisma.tournamentRegistration.update({
      where: { id: registrationId, tournamentId },
      data: { status: parsed.data.status },
      include: { team: true },
    });

    return NextResponse.json({ registration: updated });
  } catch {
    return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });
  }
}
