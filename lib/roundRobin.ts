export type RoundRobinPair = { homeTeamId: string; awayTeamId: string };
export type RoundRobinRound = { roundNumber: number; matches: RoundRobinPair[] };

// Circle method (Berger tables) - each team plays each other exactly once.
export function generateRoundRobin(teamIds: string[]): RoundRobinRound[] {
  const teams = [...teamIds];
  if (teams.length < 2) return [];

  const hasBye = teams.length % 2 === 1;
  if (hasBye) teams.push("__BYE__");

  const n = teams.length;
  const rounds: RoundRobinRound[] = [];

  // Fix first team, rotate the rest.
  const fixed = teams[0]!;
  let rot = teams.slice(1);

  for (let r = 0; r < n - 1; r++) {
    const left = [fixed, ...rot.slice(0, (n / 2) - 1)];
    const right = rot.slice((n / 2) - 1).reverse();

    const pairs: RoundRobinPair[] = [];
    for (let i = 0; i < left.length; i++) {
      const a = left[i]!;
      const b = right[i]!;
      if (a === "__BYE__" || b === "__BYE__") continue;

      // Alternate home/away to reduce repeats
      const swap = r % 2 === 1;
      pairs.push(
        swap
          ? { homeTeamId: b, awayTeamId: a }
          : { homeTeamId: a, awayTeamId: b },
      );
    }

    rounds.push({ roundNumber: r + 1, matches: pairs });

    // rotate
    rot = [rot[rot.length - 1]!, ...rot.slice(0, rot.length - 1)];
  }

  return rounds;
}

