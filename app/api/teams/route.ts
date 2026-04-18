import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/guards";

const CreateTeamSchema = z.object({
  name: z.string().min(2).max(40),
  logoUrl: z.string().url().optional(),
});

export async function GET() {
  try {
    const session = await requireSession();
    const userId = session.user!.id;

    const teams = await prisma.team.findMany({
      where: { members: { some: { userId } } },
      include: { members: { include: { user: { select: { id: true, email: true, name: true } } } } },
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json({ teams });
  } catch {
    return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });
  }
}

export async function POST(req: Request) {
  try {
    const session = await requireSession();
    const userId = session.user!.id;

    const body = await req.json().catch(() => null);
    const parsed = CreateTeamSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "INVALID_INPUT", details: parsed.error.flatten() },
        { status: 400 },
      );
    }

    const team = await prisma.team.create({
      data: {
        name: parsed.data.name.trim(),
        logoUrl: parsed.data.logoUrl ?? null,
        captainId: userId,
        members: { create: { userId, isCaptain: true } },
      },
      include: { members: true },
    });

    return NextResponse.json({ team });
  } catch (e: unknown) {
    const err = e as { code?: string } | null;
    if (err?.code === "P2002") {
      return NextResponse.json({ error: "TEAM_NAME_TAKEN" }, { status: 409 });
    }
    return NextResponse.json({ error: "SERVER_ERROR" }, { status: 500 });
  }
}

