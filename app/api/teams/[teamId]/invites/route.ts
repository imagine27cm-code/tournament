import { NextResponse } from "next/server";
import { z } from "zod";
import crypto from "crypto";
import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/guards";

const CreateInviteSchema = z.object({
  email: z.string().email().optional(),
  expiresInHours: z.number().int().min(1).max(168).optional(), // default 72h
});

export async function POST(
  req: Request,
  { params }: { params: Promise<{ teamId: string }> },
) {
  try {
    const session = await requireSession(req);
    const userId = session.user!.id;
    const { teamId } = await params;

    const team = await prisma.team.findUnique({ where: { id: teamId } });
    if (!team) return NextResponse.json({ error: "NOT_FOUND" }, { status: 404 });
    if (team.captainId !== userId) {
      return NextResponse.json({ error: "FORBIDDEN" }, { status: 403 });
    }

    const body = await req.json().catch(() => null);
    const parsed = CreateInviteSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "INVALID_INPUT", details: parsed.error.flatten() },
        { status: 400 },
      );
    }

    const token = crypto.randomBytes(24).toString("hex");
    const expiresInHours = parsed.data.expiresInHours ?? 72;
    const expiresAt = new Date(Date.now() + expiresInHours * 60 * 60 * 1000);

    const invite = await prisma.teamInvite.create({
      data: {
        teamId,
        email: parsed.data.email?.toLowerCase().trim() || null,
        token,
        invitedById: userId,
        expiresAt,
      },
      include: { team: { select: { id: true, name: true } } },
    });

    return NextResponse.json({
      invite,
      joinUrl: `/join/${invite.token}`,
    });
  } catch {
    return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });
  }
}

