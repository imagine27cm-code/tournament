import type { Match, Team } from "@prisma/client";

export type StandingRow = {
  teamId: string;
  teamName: string;
  wins: number;
  losses: number;
  points: number;
  place?: number;
};

export function computeStandings(teams: Team[], matches: Match[]): StandingRow[] {
  const rows = new Map<string, StandingRow>();
  for (const t of teams) {
    rows.set(t.id, {
      teamId: t.id,
      teamName: t.name,
      wins: 0,
      losses: 0,
      points: 0,
    });
  }

  const finished = matches.filter((m) => m.status === "FINISHED" && m.winnerTeamId);
  for (const m of finished) {
    const home = rows.get(m.homeTeamId);
    const away = rows.get(m.awayTeamId);
    if (!home || !away) continue;

    // Считаем количество побед каждой команды в этом матче
    // @ts-ignore games будут загружены вместе с матчами
    const homeWins = (m.games ?? []).filter((g: any) => g.winnerTeamId === m.homeTeamId).length;
    // @ts-ignore
    const awayWins = (m.games ?? []).filter((g: any) => g.winnerTeamId === m.awayTeamId).length;

    // Логика подсчета очков:
    // ✅ Если счет 2:1 → победитель получает 2 очка, проигравший получает 1 очко
    // ✅ Если счет 2:0 → победитель получает 2 очка, проигравший получает 0 очков
    if (m.winnerTeamId === m.homeTeamId) {
      home.wins += 1;
      home.points += 2; // Победитель всегда получает 2 очка
      away.losses += 1;
      // Если проигравший выиграл хотя бы 1 игру (счет 2:1) → даем ему 1 очко
      if (awayWins >= 1) {
        away.points += 1;
      }
    } else if (m.winnerTeamId === m.awayTeamId) {
      away.wins += 1;
      away.points += 2; // Победитель всегда получает 2 очка
      home.losses += 1;
      // Если проигравший выиграл хотя бы 1 игру (счет 2:1) → даем ему 1 очко
      if (homeWins >= 1) {
        home.points += 1;
      }
    }
  }

  const baseSorted = [...rows.values()].sort((a, b) => {
    if (b.points !== a.points) return b.points - a.points;
    if (b.wins !== a.wins) return b.wins - a.wins;
    return a.teamName.localeCompare(b.teamName);
  });

  // Tie-break by head-to-head within same points group.
  const byPoints = new Map<number, StandingRow[]>();
  for (const r of baseSorted) {
    const group = byPoints.get(r.points) ?? [];
    group.push(r);
    byPoints.set(r.points, group);
  }

  const headToHeadWinner = (teamA: string, teamB: string): string | null => {
    const m = finished.find(
      (x) =>
        (x.homeTeamId === teamA && x.awayTeamId === teamB) ||
        (x.homeTeamId === teamB && x.awayTeamId === teamA),
    );
    return m?.winnerTeamId ?? null;
  };

  const final: StandingRow[] = [];
  for (const pts of [...byPoints.keys()].sort((a, b) => b - a)) {
    const group = byPoints.get(pts)!;
    if (group.length <= 1) {
      final.push(...group);
      continue;
    }

    const sortedGroup = [...group].sort((a, b) => {
      const w = headToHeadWinner(a.teamId, b.teamId);
      if (w === a.teamId) return -1;
      if (w === b.teamId) return 1;
      return a.teamName.localeCompare(b.teamName);
    });
    final.push(...sortedGroup);
  }

  final.forEach((r, idx) => (r.place = idx + 1));
  return final;
}

