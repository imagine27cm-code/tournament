import { prisma } from "./prisma";

type AchievementType =
  | "FIRST_WIN"
  | "FIRST_TOURNAMENT"
  | "WIN_STREAK_5"
  | "WIN_STREAK_10"
  | "LEVEL_10"
  | "LEVEL_25"
  | "LEVEL_50"
  | "FIRST_FRIEND"
  | "FIRST_TEAM"
  | "MEMBER_10_MATCHES"
  | "PERFECT_TOURNAMENT"
  | "TOP_100_RATING"
  | "TOP_10_RATING"
  | "TOP_1_RATING";

export const ACHIEVEMENTS: Record<AchievementType, { name: string; description: string; icon: string; xp: number }> = {
  FIRST_WIN: {
    name: "Первый победитель",
    description: "Выиграй свой первый матч",
    icon: "🏆",
    xp: 100,
  },
  FIRST_TOURNAMENT: {
    name: "Начало пути",
    description: "Заверши свой первый турнир",
    icon: "🎮",
    xp: 150,
  },
  WIN_STREAK_5: {
    name: "Жаркий старт",
    description: "Победи 5 матчей подряд",
    icon: "🔥",
    xp: 200,
  },
  WIN_STREAK_10: {
    name: "Несокрушимый",
    description: "Победи 10 матчей подряд",
    icon: "⚡",
    xp: 500,
  },
  LEVEL_10: {
    name: "Опытный игрок",
    description: "Достигни 10 уровня",
    icon: "⭐",
    xp: 250,
  },
  LEVEL_25: {
    name: "Ветеран",
    description: "Достигни 25 уровня",
    icon: "🌟",
    xp: 400,
  },
  LEVEL_50: {
    name: "Легенда",
    description: "Достигни 50 уровня",
    icon: "💫",
    xp: 1000,
  },
  FIRST_FRIEND: {
    name: "Первый товарищ",
    description: "Добавь первого друга",
    icon: "👥",
    xp: 50,
  },
  FIRST_TEAM: {
    name: "Команда собрана",
    description: "Создай свою первую команду",
    icon: "👨‍👩‍👧‍👦",
    xp: 75,
  },
  MEMBER_10_MATCHES: {
    name: "Боец",
    description: "Сыграй в 10 матчей",
    icon: "⚔️",
    xp: 150,
  },
  PERFECT_TOURNAMENT: {
    name: "Идеальный турнир",
    description: "Выиграй турнир без единого поражения",
    icon: "💎",
    xp: 750,
  },
  TOP_100_RATING: {
    name: "Сотка лучших",
    description: "Попасть в топ 100 по рейтингу",
    icon: "🎖️",
    xp: 300,
  },
  TOP_10_RATING: {
    name: "Элита",
    description: "Попасть в топ 10 по рейтингу",
    icon: "🥇",
    xp: 600,
  },
  TOP_1_RATING: {
    name: "Король горы",
    description: "Стань 1-м в рейтинге",
    icon: "👑",
    xp: 2000,
  },
};

export async function grantAchievement(userId: string, type: AchievementType) {
  try {
    const existing = await prisma.achievement.findUnique({
      where: {
        userId_achievementType: {
          userId,
          achievementType: type,
        },
      },
    });

    if (existing) return false;

    const achievement = await prisma.achievement.create({
      data: {
        userId,
        achievementType: type,
      },
    });

    const config = ACHIEVEMENTS[type];
    if (config) {
      await prisma.user.update({
        where: { id: userId },
        data: {
          xp: {
            increment: config.xp,
          },
        },
      });
    }

    return achievement;
  } catch {
    return false;
  }
}

export async function getUserAchievements(userId: string) {
  const achievements = await prisma.achievement.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
  });

  return achievements.map((a) => ({
    ...a,
    config: ACHIEVEMENTS[a.achievementType as AchievementType],
  }));
}