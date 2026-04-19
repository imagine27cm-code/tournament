/**
 * RP Система с уровнями и опытом
 * Реализация идеи №2 - прогрессивная система с постоянным опытом
 */

export interface Rank {
  name: string
  minRp: number
  color: string
  icon: string
}

export const RANKS: Rank[] = [
  { name: 'Новичок', minRp: 0, color: '#9CA3AF', icon: '⚪' },
  { name: 'Бронза', minRp: 800, color: '#CD7F32', icon: '🟤' },
  { name: 'Серебро', minRp: 1000, color: '#C0C0C0', icon: '⚪' },
  { name: 'Золото', minRp: 1200, color: '#FFD700', icon: '🟡' },
  { name: 'Платинум', minRp: 1400, color: '#00CED1', icon: '🔵' },
  { name: 'Алмаз', minRp: 1700, color: '#B9F2FF', icon: '💎' },
  { name: 'Мастер', minRp: 2000, color: '#9932CC', icon: '🟣' },
  { name: 'Легенда', minRp: 2500, color: '#FF4500', icon: '👑' },
]

/**
 * Получить текущий ранг игрока по RP
 */
export function getRank(rp: number): Rank {
  for (let i = RANKS.length - 1; i >= 0; i--) {
    if (rp >= RANKS[i].minRp) {
      return RANKS[i]
    }
  }
  return RANKS[0]
}

/**
 * Рассчитать необходимый XP для следующего уровня
 * Формула: каждый следующий уровень требует на 10% больше опыта
 */
export function getXpForLevel(level: number): number {
  return Math.floor(100 * Math.pow(1.1, level - 1))
}

/**
 * Рассчитать текущий уровень по общему XP
 */
export function calculateLevel(totalXp: number): { level: number; currentXp: number; neededXp: number } {
  let level = 1
  let remainingXp = totalXp

  while (true) {
    const needed = getXpForLevel(level)
    if (remainingXp < needed) {
      return {
        level,
        currentXp: remainingXp,
        neededXp: needed
      }
    }
    remainingXp -= needed
    level++
  }
}

/**
 * Рассчитать изменение RP после матча
 * @param winnerRp RP победителя
 * @param loserRp RP проигравшего
 */
export function calculateRpChange(winnerRp: number, loserRp: number): { winnerGain: number; loserLoss: number } {
  const k = 32 // Стандартный коэффициент ELO

  const expectedWinner = 1 / (1 + Math.pow(10, (loserRp - winnerRp) / 400))
  const expectedLoser = 1 / (1 + Math.pow(10, (winnerRp - loserRp) / 400))

  const winnerGain = Math.round(k * (1 - expectedWinner))
  const loserLoss = Math.round(k * (0 - expectedLoser))

  return {
    winnerGain: Math.max(winnerGain, 5), // Минимум 5 RP за победу
    loserLoss: Math.max(loserLoss, -25) // Максимум теряешь 25 RP за поражение
  }
}

/**
 * Рассчитать получаемый XP за матч
 */
export function calculateXpGain(isWinner: boolean, winStreak: number, opponentRp: number, ownRp: number): number {
  let baseXp = isWinner ? 50 : 15

  // Бонус за стрик побед
  if (isWinner && winStreak >= 3) {
    const streakBonus = Math.min(winStreak * 5, 50)
    baseXp += streakBonus
  }

  // Бонус за победу над сильным противником
  if (isWinner && opponentRp > ownRp) {
    const diffBonus = Math.floor((opponentRp - ownRp) / 10)
    baseXp += Math.min(diffBonus, 100)
  }

  return baseXp
}

/**
 * Полное обновление статистики игроков после матча
 */
export function processMatchResult(
  winner: { rp: number; xp: number; wins: number; winStreak: number; bestWinStreak: number },
  loser: { rp: number; xp: number; losses: number; winStreak: number }
) {
  const rpChange = calculateRpChange(winner.rp, loser.rp)

  const winnerXpGain = calculateXpGain(true, winner.winStreak + 1, loser.rp, winner.rp)
  const loserXpGain = calculateXpGain(false, 0, winner.rp, loser.rp)

  const newWinnerWinStreak = winner.winStreak + 1
  const newWinnerBestStreak = Math.max(winner.bestWinStreak, newWinnerWinStreak)

  const winnerLevel = calculateLevel(winner.xp + winnerXpGain)
  const loserLevel = calculateLevel(loser.xp + loserXpGain)

  return {
    winner: {
      rp: winner.rp + rpChange.winnerGain,
      xp: winner.xp + winnerXpGain,
      level: winnerLevel.level,
      wins: winner.wins + 1,
      winStreak: newWinnerWinStreak,
      bestWinStreak: newWinnerBestStreak,
      rpGain: rpChange.winnerGain,
      xpGain: winnerXpGain
    },
    loser: {
      rp: Math.max(loser.rp + rpChange.loserLoss, 100), // RP не падает ниже 100
      xp: loser.xp + loserXpGain,
      level: loserLevel.level,
      losses: loser.losses + 1,
      winStreak: 0,
      rpLoss: rpChange.loserLoss,
      xpGain: loserXpGain
    }
  }
}