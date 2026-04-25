import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { SHOP_ITEMS } from "@/lib/shop";

export async function POST(req: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });

    const body = await req.json();
    const itemId = body.itemId;

    const item = SHOP_ITEMS[itemId];
    if (!item) return NextResponse.json({ error: "ITEM_NOT_FOUND" }, { status: 404 });

    const existing = await prisma.inventoryItem.findUnique({
      where: {
        userId_itemId: {
          userId: user.id,
          itemId,
        },
      },
    });

    if (existing) return NextResponse.json({ error: "ALREADY_OWNED" }, { status: 400 });

    const userData = await prisma.user.findUnique({
      where: { id: user.id },
      select: { coins: true },
    });

    if (!userData || userData.coins < item.price) {
      return NextResponse.json({ error: "NOT_ENOUGH_COINS" }, { status: 400 });
    }

    await prisma.$transaction(async (tx) => {
      await tx.user.update({
        where: { id: user.id },
        data: { coins: { decrement: item.price } },
      });

      await tx.inventoryItem.create({
        data: {
          userId: user.id,
          itemId,
        },
      });
    });

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "INTERNAL_ERROR" }, { status: 500 });
  }
}