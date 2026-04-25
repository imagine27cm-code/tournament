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
    const action = body.action ?? "equip";

    const item = SHOP_ITEMS[itemId];
    if (!item) return NextResponse.json({ error: "ITEM_NOT_FOUND" }, { status: 404 });

    const owned = await prisma.inventoryItem.findUnique({
      where: {
        userId_itemId: {
          userId: user.id,
          itemId,
        },
      },
    });

    if (!owned) return NextResponse.json({ error: "NOT_OWNED" }, { status: 403 });

    const updateField: Record<string, string | null> = {};

    if (item.type === "NAMETAG_COLOR") {
      updateField.activeNameColor = action === "unequip" ? null : itemId;
    } else if (item.type === "PROFILE_BANNER") {
      updateField.activeBanner = action === "unequip" ? null : itemId;
    } else if (item.type === "AVATAR_FRAME") {
      updateField.activeAvatarFrame = action === "unequip" ? null : itemId;
    } else if (item.type === "TITLE") {
      updateField.activeTitle = action === "unequip" ? null : itemId;
    }

    await prisma.user.update({
      where: { id: user.id },
      data: updateField,
    });

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "INTERNAL_ERROR" }, { status: 500 });
  }
}