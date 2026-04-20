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
  try {
    // НЕ ДЕЛАЙ FETCH НА САМОГО СЕБЯ С СЕРВЕРА!
    // ВЫЗЫВАЙ ПРЯМО КОД ИЗ API МАРШРУТА!
    const { prisma } = await import("@/lib/prisma");
    
    const tournaments = await prisma.tournament.findMany({
      orderBy: { createdAt: "desc" },
      select: { id: true, name: true, status: true, startDate: true, endDate: true, teamLimit: true },
    });
    
    return { 
      tournaments: tournaments.map(t => ({
        ...t,
        startDate: t.startDate.toISOString(),
        endDate: t.endDate.toISOString()
      })) 
    };
  } catch {
    return { tournaments: [] as TournamentSummary[] };
  }
}

export default async function Home() {
  let tournaments: TournamentSummary[] = [];
  try {
    const data = await getTournaments();
    tournaments = data.tournaments ?? [];
  } catch {
    tournaments = [];
  }
  return (
    <div className="px-10 py-10">
      <h1 className="text-4xl font-bold mb-12 tracking-wide" style={{fontFamily: "'Rajdhani', sans-serif", color: '#ffffff', fontWeight: 700}}>Список ебанных турниров</h1>
      
      <div className="max-w-4xl">
        {/* Table Header */}
        <div className="grid grid-cols-4 gap-4 px-5 py-4" style={{color: '#7a88bb', fontFamily: "'Rajdhani', sans-serif", fontSize: '1.05rem', fontWeight: 500}}>
        </div>

        {/* Tournaments List */}
        <div>
          {tournaments.length === 0 ? (
            <div className="py-12 text-center" style={{color: '#666688', fontFamily: "'Rajdhani', sans-serif"}}>
              <p>Пока нет активных турниров</p>
            </div>
          ) : (
            tournaments.map((t, index) => (
              <Link
                key={t.id}
                href={`/tournaments/${t.id}`}
                className="grid grid-cols-4 gap-4 px-5 py-4 transition-all hover:bg-opacity-50 block glow-border"
                style={{
                  background: index % 2 === 0 ? 'rgba(25, 25, 40, 0.6)' : 'rgba(30, 30, 48, 0.4)',
                  borderTop: '1px solid rgba(122, 64, 255, 0.1)',
                  fontFamily: "'Rajdhani', sans-serif",
                  fontSize: '1.1rem',
                  color: '#e8e8ff',
                  borderRadius: '8px',
                  marginBottom: '4px',
                  animation: `fadeInUp 0.5s cubic-bezier(0.4, 0, 0.2, 1) ${index * 0.08}s both`
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = 'rgba(55, 45, 75, 0.7)';
                  e.currentTarget.style.transform = 'scale(1.005) translateX(4px)';
                  e.currentTarget.style.boxShadow = '0 4px 20px rgba(122, 64, 255, 0.2)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = index % 2 === 0 ? 'rgba(25, 25, 40, 0.6)' : 'rgba(30, 30, 48, 0.4)';
                  e.currentTarget.style.transform = 'scale(1) translateX(0)';
                  e.currentTarget.style.boxShadow = 'none';
                }}
              >
                <div className="font-medium flex items-center gap-3">
                  <span style={{width: '16px', height: '16px', borderRadius: '3px', background: 'rgba(255, 192, 64, 0.3)'}}></span>
                  {t.name}
                </div>
                <div style={{color: '#aaaacc'}}>
                  {t.status}
                </div>
                <div style={{color: '#aaaacc'}}>
                  {t.teamLimit} слотов
                </div>
                <div className="font-medium" style={{color: '#7a40ff'}}>
                  ? / {t.teamLimit}
                </div>
              </Link>
            ))
          )}
        </div>
      </div>
      
    </div>
  );
}
