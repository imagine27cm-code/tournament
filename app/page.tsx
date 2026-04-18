import Link from "next/link";

type TournamentSummary = {
  id: string;
  name: string;
  status: string;
  startDate: string;
  endDate: string;
  teamLimit: number;
};

async function getTournaments() {
  const res = await fetch(`${process.env.NEXTAUTH_URL ?? "http://localhost:3000"}/api/tournaments`, {
    cache: "no-store",
  });
  if (!res.ok) return { tournaments: [] as TournamentSummary[] };
  return (await res.json()) as { tournaments: TournamentSummary[] };
}

export default async function Home() {
  const { tournaments } = await getTournaments();
  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <div className="flex items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight gradient-text" style={{fontFamily: "'Orbitron', sans-serif", textShadow: '0 0 20px #00f0ff40'}}>ТУРНИРЫ</h1>
          <p className="mt-2 text-sm" style={{color: '#8888aa'}}>
            Round Robin (каждый с каждым) + BO3 + баны карт
          </p>
        </div>
        <Link
          href="/dashboard"
          className="neon-button"
        >
          Мой кабинет
        </Link>
      </div>

      <div className="mt-8 grid grid-cols-1 gap-4">
        {tournaments.length === 0 ? (
          <div className="cyber-card rounded-lg p-6 text-sm" style={{color: '#8888aa', padding: '2rem'}}>
            <p style={{color: '#8888aa', textAlign: 'center'}}>Пока нет турниров. Зайдите под администратором и создайте новый.</p>
          </div>
        ) : (
          tournaments.map((t) => (
            <Link
              key={t.id}
              href={`/tournaments/${t.id}`}
              className="cyber-card rounded-lg p-4 transition-all hover:scale-[1.01]"
              style={{display: 'block'}}
            >
              <div className="flex items-center justify-between gap-3">
                <div className="font-medium" style={{color: '#e0e0ff', fontFamily: "'Rajdhani', sans-serif", fontSize: '1.25rem', fontWeight: 600}}>{t.name}</div>
                <div className="cyber-badge">{t.status}</div>
              </div>
              <div className="mt-2 text-xs" style={{color: '#8888aa'}}>
                Команд лимит: {t.teamLimit} • {new Date(t.startDate).toLocaleDateString()} —{" "}
                {new Date(t.endDate).toLocaleDateString()}
              </div>
            </Link>
          ))
        )}
      </div>
    </div>
  );
}