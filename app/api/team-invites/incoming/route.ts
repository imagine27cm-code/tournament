import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/guards";

export async function GET(req: Request) {
  try {
    const session = await requireSession(req);
    const email = session.user!.email;

    const invites = await prisma.teamInvite.findMany({
      where: {
        email: { equals: email, mode: "insensitive" },
        status: "PENDING",
        expiresAt: { gt: new Date() },
      },
      include: { team: { select: { id: true, name: true } } },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ invites });
  } catch {
    return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });
  }
}
