import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { computeStandings } from "@/lib/standings";
import { TournamentActions } from "@/components/TournamentActions";

export default async function TournamentPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const tournament = await prisma.tournament.findUnique({
    where: { id },
    include: {
      maps: { orderBy: { sortOrder: "asc" } },
      registrations: { include: { team: true }, orderBy: { createdAt: "asc" } },
      rounds: {
        orderBy: { number: "asc" },
        include: { matches: { include: { homeTeam: true, awayTeam: true } } },
      },
       matches: { include: { games: true } },
    },
  });

  if (!tournament) {
  return (
    <div className="mx-auto max-w-6xl px-6 py-10">
        <div className="cyber-card rounded-lg p-6" style={{color: '#ff0044'}}>Турнир не найден.</div>
      </div>
    );
  }

  const approvedTeams = tournament.registrations.filter((r) => r.status === "APPROVED").map((r) => r.team);
  const standings = computeStandings(approvedTeams, tournament.matches);

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight gradient-text" style={{fontFamily: "'Orbitron', sans-serif", textShadow: '0 0 20px #00f0ff40'}}>{tournament.name}</h1>
          <div className="mt-2 text-sm" style={{color: '#8888aa'}}>
            {tournament.status} • лимит команд: {tournament.teamLimit}
          </div>
        </div>
        <Link className="neon-button" href="/">
          Назад
        </Link>
      </div>

      <div className="mt-8 grid grid-cols-1 gap-6 lg:grid-cols-3">
        <section className="cyber-card rounded-lg p-4 lg:col-span-2">
          <h2 className="font-semibold" style={{color: '#00f0ff', fontFamily: "'Orbitron', sans-serif", fontSize: '1rem', textTransform: 'uppercase', letterSpacing: '1px'}}>Турнирная таблица</h2>
          <div className="mt-4 overflow-x-auto">
            <table className="w-full text-sm cyber-table">
              <thead>
                <tr>
                  <th className="py-2 pr-3">Место</th>
                  <th className="py-2 pr-3">Команда</th>
                  <th className="py-2 pr-3">Матчи</th>
                  <th className="py-2 pr-3">Очки</th>
                </tr>
              </thead>
              <tbody>
                {standings.map((r) => (
                  <tr key={r.teamId}>
                    <td className="py-2 pr-3" style={{color: '#00f0ff', fontWeight: 600}}>{r.place}</td>
                    <td className="py-2 pr-3">{r.teamName}</td>
                    <td className="py-2 pr-3">
                      <span style={{color: '#00ff88'}}>{r.wins}</span>-<span style={{color: '#ff0044'}}>{r.losses}</span>
                    </td>
                    <td className="py-2 pr-3 font-medium" style={{color: '#ffff00', textShadow: '0 0 8px #ffff0080'}}>{r.points}</td>
                  </tr>
                ))}
                {standings.length === 0 ? (
                  <tr>
                    <td className="py-4" colSpan={4} style={{color: '#8888aa'}}>
                      Пока нет утверждённых команд.
                    </td>
                  </tr>
                ) : null}
              </tbody>
            </table>
          </div>
          <div className="mt-2 text-xs" style={{color: '#8888aa'}}>Тай‑брейк при равенстве очков: личные встречи.</div>
        </section>

        <section className="cyber-card rounded-lg p-4">
          <h2 className="font-semibold" style={{color: '#00f0ff', fontFamily: "'Orbitron', sans-serif", fontSize: '1rem', textTransform: 'uppercase', letterSpacing: '1px'}}>Действия</h2>
          <TournamentActions tournamentId={tournament.id} tournamentStatus={tournament.status} />

          <div className="mt-4">
            <div className="text-sm font-semibold" style={{color: '#e0e0ff'}}>Карты (15)</div>
            <div className="mt-2 flex flex-wrap gap-2">
              {tournament.maps.map((m) => (
                <span key={m.id} className="cyber-badge" style={{fontSize: '0.7rem'}}>
                  {m.name}
                </span>
              ))}
            </div>
          </div>
        </section>
      </div>

      <div className="mt-6 cyber-card rounded-lg p-4">
        <h2 className="font-semibold" style={{color: '#00f0ff', fontFamily: "'Orbitron', sans-serif", fontSize: '1rem', textTransform: 'uppercase', letterSpacing: '1px'}}>Матчи по турам</h2>
        {tournament.rounds.length === 0 ? (
          <div className="mt-2 text-sm" style={{color: '#8888aa'}}>
            Сетка ещё не сгенерирована (админ должен запустить турнир).
          </div>
        ) : (
          <div className="mt-4 space-y-4">
            {tournament.rounds.map((r) => (
              <div key={r.id} className="rounded-md" style={{border: '1px solid rgba(0, 240, 255, 0.2)', padding: '1rem'}}>
                <div className="text-sm font-semibold" style={{color: '#00f0ff'}}>Тур {r.number}</div>
                <div className="mt-3 space-y-2">
                  {r.matches.map((m) => (
                    <Link
                      key={m.id}
                      href={`/matches/${m.id}`}
                      className="flex items-center justify-between rounded-md px-3 py-2 transition-all hover:bg-[var(--background-hover)]"
                      style={{border: '1px solid rgba(0, 240, 255, 0.2)'}}
                    >
                      <div className="flex items-center gap-2">
                        <span style={{color: '#e0e0ff'}}>{m.homeTeam.name}</span>
                        <span style={{color: '#8888aa'}}>vs</span>
                        <span style={{color: '#e0e0ff'}}>{m.awayTeam.name}</span>
                      </div>
                      <div className="text-xs" style={{color: '#8888aa'}}>{m.status}</div>
                    </Link>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}