import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/guards";

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    await requireAdmin();
    const { id: tournamentId } = await params;

    const tournament = await prisma.tournament.findUnique({
      where: { id: tournamentId },
    });

    if (!tournament) {
      return NextResponse.json({ error: "NOT_FOUND" }, { status: 404 });
    }

    await prisma.tournament.delete({
      where: { id: tournamentId },
    });

    return NextResponse.json({ ok: true });
  } catch (e: unknown) {
    const err = e as { message?: string } | null;
    if (err?.message === "FORBIDDEN") return NextResponse.json({ error: "FORBIDDEN" }, { status: 403 });
    return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });
  }
}