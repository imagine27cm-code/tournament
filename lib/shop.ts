import { prisma } from "./prisma";

type ShopItemType = "NAMETAG_COLOR" | "PROFILE_BANNER" | "AVATAR_FRAME" | "TITLE";

export const SHOP_ITEMS: Record<string, {
  id: string;
  name: string;
  type: ShopItemType;
  price: number;
  value: string;
  description: string;
  icon: string;
}> = {
  // Цвета ника
  NAME_RED: {
    id: "NAME_RED",
    name: "Красный ник",
    type: "NAMETAG_COLOR",
    price: 500,
    value: "#ff0044",
    description: "Красный цвет ника в чате и списках",
    icon: "🔴",
  },
  NAME_GREEN: {
    id: "NAME_GREEN",
    name: "Зеленый ник",
    type: "NAMETAG_COLOR",
    price: 500,
    value: "#00ff88",
    description: "Зеленый цвет ника",
    icon: "🟢",
  },
  NAME_CYAN: {
    id: "NAME_CYAN",
    name: "Циановый ник",
    type: "NAMETAG_COLOR",
    price: 750,
    value: "#00f0ff",
    description: "Яркий циановый цвет ника",
    icon: "🔵",
  },
  NAME_PURPLE: {
    id: "NAME_PURPLE",
    name: "Фиолетовый ник",
    type: "NAMETAG_COLOR",
    price: 750,
    value: "#7a40ff",
    description: "Фиолетовый цвет ника",
    icon: "🟣",
  },
  NAME_GOLD: {
    id: "NAME_GOLD",
    name: "Золотой ник",
    type: "NAMETAG_COLOR",
    price: 2000,
    value: "#ffc800",
    description: "Премиум золотой цвет ника с эффектом свечения",
    icon: "🥇",
  },
  NAME_RAINBOW: {
    id: "NAME_RAINBOW",
    name: "Радужный ник",
    type: "NAMETAG_COLOR",
    price: 5000,
    value: "rainbow",
    description: "Анимированный радужный ник",
    icon: "🌈",
  },

  // Баннеры профиля
  BANNER_BLUE: {
    id: "BANNER_BLUE",
    name: "Синий баннер",
    type: "PROFILE_BANNER",
    price: 300,
    value: "linear-gradient(135deg, #00f0ff 0%, #0066ff 100%)",
    description: "Голубой градиентный баннер профиля",
    icon: "🌊",
  },
  BANNER_PURPLE: {
    id: "BANNER_PURPLE",
    name: "Фиолетовый баннер",
    type: "PROFILE_BANNER",
    price: 300,
    value: "linear-gradient(135deg, #7a40ff 0%, #ff00ff 100%)",
    description: "Фиолетовый градиент",
    icon: "🌌",
  },

  // Рамки аватара
  FRAME_GOLD: {
    id: "FRAME_GOLD",
    name: "Золотая рамка",
    type: "AVATAR_FRAME",
    price: 1000,
    value: "#ffc800",
    description: "Золотая рамка вокруг аватара",
    icon: "✨",
  },
  FRAME_DIAMOND: {
    id: "FRAME_DIAMOND",
    name: "Алмазная рамка",
    type: "AVATAR_FRAME",
    price: 2500,
    value: "#00f0ff",
    description: "Блестящая алмазная рамка",
    icon: "💎",
  },

  // Титулы
  TITLE_WARRIOR: {
    id: "TITLE_WARRIOR",
    name: "Титул Воин",
    type: "TITLE",
    price: 1500,
    value: "⚔️ Воин",
    description: "Отображается перед именем",
    icon: "⚔️",
  },
};

// Награда за победу в турнире
export const TOURNAMENT_COIN_REWARDS = {
  1: 1000,  // 1 место
  2: 500,   // 2 место
  3: 250,   // 3 место
  participation: 50, // Участие
};

export async function purchaseItem(userId: string, itemId: string) {
  const item = SHOP_ITEMS[itemId];
  if (!item) return { success: false, error: "ITEM_NOT_FOUND" };

  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) return { success: false, error: "USER_NOT_FOUND" };

  if (user.coins < item.price) {
    return { success: false, error: "NOT_ENOUGH_COINS" };
  }

  await prisma.$transaction(async (tx) => {
    await tx.user.update({
      where: { id: userId },
      data: {
        coins: { decrement: item.price },
        inventory: {
          create: {
            itemId: item.id,
            purchasedAt: new Date(),
          },
        },
      },
    });
  });

  return { success: true };
}

export async function grantCoins(userId: string, amount: number) {
  await prisma.user.update({
    where: { id: userId },
    data: { coins: { increment: amount } },
  });
}

export async function getUserInventory(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      coins: true,
      inventory: true,
    },
  });

  if (!user) return { coins: 0, inventory: [] };

  return {
    coins: user.coins,
    inventory: user.inventory.map((i: any) => ({
      ...i,
      config: SHOP_ITEMS[i.itemId],
    })),
  };
}