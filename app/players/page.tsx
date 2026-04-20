import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { PlayersClient } from "@/components/PlayersClient";

export default async function PlayersPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/signin?callbackUrl=/players");

  // ✅ НИКОГДА НЕ ДЕЛАЙ FETCH НА СЕБЯ ИЗ СЕРВЕРНОГО КОМПОНЕНТА!
  // ✅ ЗАПРАШИВАЕМ ДАННЫЕ ПРЯМО В СЕРВЕРНОМ КОМПОНЕНТЕ И ПЕРЕДАЁМ В КЛИЕНТ!
  const { prisma } = await import("@/lib/prisma");
  
  // Загружаем все данные прямо здесь на сервере
  const [players, teams, incoming] = await Promise.all([
    prisma.user.findMany({
      where: { id: { not: session.user.id } },
      select: { id: true, email: true, name: true }
    }),
    prisma.team.findMany({
      where: { captainId: session.user.id },
      select: { id: true, name: true }
    }),
    prisma.friendRequest.findMany({
      where: { toUserId: session.user.id, status: "PENDING" },
      select: { id: true, fromUser: { select: { id: true, email: true, name: true } } }
    })
  ]);

  // Нормализуем данные
  const playersWithStatus = players.map(p => ({
    ...p,
    relationStatus: "NONE" as const,
    relationRequestId: null
  }));

  const teamsWithCaptain = teams.map(t => ({
    ...t,
    captainId: session.user!.id
  }));

  const incomingRequests = incoming.map(r => ({
    id: r.id,
    fromUserId: r.fromUser.id,
    email: r.fromUser.email,
    name: r.fromUser.name
  }));

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <h1 className="text-3xl font-semibold tracking-tight gradient-text" style={{fontFamily: "'Orbitron', sans-serif", textShadow: '0 0 20px #00f0ff40'}}>ИГРОКИ</h1>
      <p className="mt-2 text-sm" style={{color: '#8888aa'}}>
        Все зарегистрированные игроки: добавить в друзья или пригласить в команду
      </p>
      <div className="mt-8">
        {/* ✅ Передаём все данные из серверной части напрямую в клиент! */}
        <PlayersClient 
          myUserId={session.user!.id} 
          initialPlayers={playersWithStatus}
          initialTeams={teamsWithCaptain}
          initialIncoming={incomingRequests}
        />
      </div>
    </div>
  );
}
