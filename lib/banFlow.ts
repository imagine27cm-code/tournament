import type { BanPhase, Match, TournamentMap } from "@prisma/client";

export function firstBanTeamId(match: Pick<Match, "banSeed" | "homeTeamId" | "awayTeamId">) {
  return match.banSeed % 2 === 0 ? match.homeTeamId : match.awayTeamId;
}

export function isTeam1(
  match: Pick<Match, "banSeed" | "homeTeamId" | "awayTeamId">,
  teamId: string,
) {
  return firstBanTeamId(match) === teamId;
}

export function nextPhase(phase: BanPhase): BanPhase {
  switch (phase) {
    case "T1_BAN_1":
      return "T2_BAN_1";
    case "T2_BAN_1":
      return "T2_BAN_2";
    case "T2_BAN_2":
      return "T1_BAN_2";
    case "T1_BAN_2":
      return "DONE";
    case "DONE":
      return "DONE";
  }
}

export function phaseOwnerTeamId(match: Pick<Match, "banSeed" | "homeTeamId" | "awayTeamId">, phase: BanPhase) {
  const t1 = firstBanTeamId(match);
  const t2 = t1 === match.homeTeamId ? match.awayTeamId : match.homeTeamId;
  switch (phase) {
    case "T1_BAN_1":
    case "T1_BAN_2":
      return t1;
    case "T2_BAN_1":
    case "T2_BAN_2":
      return t2;
    case "DONE":
      return null;
  }
}

export function randomMap(maps: TournamentMap[], excludeIds: Set<string>) {
  const remaining = maps.filter((m) => !excludeIds.has(m.id));
  if (remaining.length === 0) return null;
  return remaining[Math.floor(Math.random() * remaining.length)]!;
}

