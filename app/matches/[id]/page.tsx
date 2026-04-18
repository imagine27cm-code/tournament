import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { MatchClient } from "@/components/MatchClient";

export default async function MatchPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const match = await prisma.match.findUnique({
    where: { id },
    include: { tournament: true, homeTeam: true, awayTeam: true },
  });
  if (!match) {
    return (
      <div className="mx-auto max-w-6xl px-4 py-8">
        <div className="rounded-lg border p-6">Матч не найден.</div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Матч BO3</h1>
          <div className="mt-1 text-sm text-zinc-600 dark:text-zinc-300">
            <Link className="underline" href={`/tournaments/${match.tournamentId}`}>
              {match.tournament.name}
            </Link>
          </div>
        </div>
        <Link className="rounded-md border px-3 py-2 text-sm hover:bg-zinc-50 dark:hover:bg-zinc-900" href={`/tournaments/${match.tournamentId}`}>
          Назад к турниру
        </Link>
      </div>

      <div className="mt-6">
        <MatchClient matchId={match.id} />
      </div>
    </div>
  );
}

