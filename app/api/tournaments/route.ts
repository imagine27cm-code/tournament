import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/guards";
import { readdirSync } from "fs";
import { join } from "path";

const CreateTournamentSchema = z.object({
  name: z.string().min(2).max(80),
  startDate: z.string().datetime(),
  endDate: z.string().datetime(),
  teamLimit: z.number().int().min(2).max(128).optional(),
  maps: z.array(z.string().min(1).max(40)).length(15).optional(),
});

function getDefaultMapNames(): string[] {
  try {
    const mapsDir = join(process.cwd(), "public", "maps");
    const files = readdirSync(mapsDir).filter(f => /\.(png|jpg|jpeg|webp)$/i.test(f));
    // Используем имя файла без расширения как имя карты
    return files.map(f => f.replace(/\.(png|jpg|jpeg|webp)$/i, ''));
  } catch {
    // Если папка не найдена или ошибка чтения, используем стандартные имена
    return Array.from({ length: 15 }, (_, i) => `Map ${i + 1}`);
  }
}

const DEFAULT_MAPS = getDefaultMapNames();

export async function GET() {
  const tournaments = await prisma.tournament.findMany({
    orderBy: { createdAt: "desc" },
    select: { id: true, name: true, status: true, startDate: true, endDate: true, teamLimit: true },
  });
  return NextResponse.json({ tournaments });
}

export async function POST(req: Request) {
  try {
    const session = await requireAdmin();
    const body = await req.json().catch(() => null);
    const parsed = CreateTournamentSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "INVALID_INPUT", details: parsed.error.flatten() },
        { status: 400 },
      );
    }

    const mapNames = parsed.data.maps ?? DEFAULT_MAPS;
    const tournament = await prisma.tournament.create({
      data: {
        name: parsed.data.name.trim(),
        startDate: new Date(parsed.data.startDate),
        endDate: new Date(parsed.data.endDate),
        teamLimit: parsed.data.teamLimit ?? 8,
        status: "REGISTRATION",
        createdById: session.user!.id,
        maps: {
          create: mapNames.map((name, idx) => ({
            name,
            sortOrder: idx + 1,
          })),
        },
      },
      include: { maps: true },
    });
    return NextResponse.json({ tournament });
  } catch (e: unknown) {
    const err = e as { message?: string } | null;
    if (err?.message === "FORBIDDEN") return NextResponse.json({ error: "FORBIDDEN" }, { status: 403 });
    if (err?.message === "UNAUTHORIZED") return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });
    return NextResponse.json({ error: "SERVER_ERROR" }, { status: 500 });
  }
}

