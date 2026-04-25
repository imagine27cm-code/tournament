import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ coins: 0, inventory: [] });

    const [userData, inventory] = await Promise.all([
      prisma.user.findUnique({
        where: { id: user.id },
        select: { coins: true },
      }),
      prisma.inventoryItem.findMany({
        where: { userId: user.id },
        select: { itemId: true },
      }),
    ]);

    return NextResponse.json({
      coins: userData?.coins ?? 0,
      inventory: inventory.map((i) => i.itemId),
    });
  } catch {
    return NextResponse.json({ coins: 0, inventory: [] });
  }
}