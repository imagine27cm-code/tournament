import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/guards";

export async function GET() {
  try {
    const news = await prisma.news.findMany({
      orderBy: { createdAt: "desc" },
      take: 10,
    });

    return NextResponse.json({ news });
  } catch {
    return NextResponse.json({ news: [] });
  }
}

export async function POST(req: Request) {
  try {
    await requireAdmin();
    const body = await req.json();

    const news = await prisma.news.create({
      data: {
        title: body.title,
        content: body.content,
        tag: body.tag,
      },
    });

    return NextResponse.json({ news });
  } catch (e: unknown) {
    const err = e as { message?: string } | null;
    if (err?.message === "FORBIDDEN") return NextResponse.json({ error: "FORBIDDEN" }, { status: 403 });
    return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });
  }
}
