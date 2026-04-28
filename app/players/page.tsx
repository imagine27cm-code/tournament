import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { PlayersClient } from "@/components/PlayersClient";

export default async function PlayersPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/signin?callbackUrl=/players");
  const me = session.user.id;

  // ✅ НИКОГДА НЕ ДЕЛАЙ FETCH НА СЕБЯ ИЗ СЕРВЕРНОГО КОМПОНЕНТА!
  // ✅ ЗАПРАШИВАЕМ ДАННЫЕ ПРЯМО В СЕРВЕРНОМ КОМПОНЕНТЕ И ПЕРЕДАЁМ В КЛИЕНТ!
  const { prisma } = await import("@/lib/prisma");
  
  // Загружаем все данные прямо здесь на сервере
  const [players, teams, incoming] = await Promise.all([
    prisma.user.findMany({
      where: { NOT: { id: me } },
      select: { id: true, email: true, name: true }
    }),
    prisma.team.findMany({
      where: { captainId: me },
      select: { id: true, name: true }
    }),
    prisma.friendRequest.findMany({
      where: { toUserId: me, status: "PENDING" },
      select: { id: true, fromUser: { select: { id: true, email: true, name: true } } }
    })
  ]);

  // Загружаем статусы дружбы для корректного отображения
  const friendRequests = await prisma.friendRequest.findMany({
    where: {
      OR: [
        { fromUserId: me },
        { toUserId: me }
      ]
    },
    select: { id: true, fromUserId: true, toUserId: true, status: true }
  });

  // Нормализуем данные с реальными статусами дружбы
  const playersWithStatus = players.map(p => {
    const fr = friendRequests.find(
      r => (r.fromUserId === me && r.toUserId === p.id) ||
           (r.toUserId === me && r.fromUserId === p.id)
    );
    let relationStatus: "NONE" | "OUTGOING_PENDING" | "INCOMING_PENDING" | "FRIEND" = "NONE";
    let relationRequestId: string | null = null;
    if (fr) {
      relationRequestId = fr.id;
      if (fr.status === "ACCEPTED") relationStatus = "FRIEND";
      else if (fr.status === "PENDING" && fr.fromUserId === me) relationStatus = "OUTGOING_PENDING";
      else if (fr.status === "PENDING" && fr.toUserId === me) relationStatus = "INCOMING_PENDING";
    }
    return {
      ...p,
      relationStatus,
      relationRequestId
    };
  });

  const teamsWithCaptain = teams.map(t => ({
    ...t,
    captainId: me
  }));

  const incomingRequests = incoming.map(r => ({
    id: r.id,
    fromUserId: r.fromUser.id,
    email: r.fromUser.email,
    name: r.fromUser.name
  }));

  return (
    <div className="mx-auto max-w-6xl px-6 py-10">
      <h1 className="text-4xl font-bold tracking-wide flex items-center gap-3" style={{fontFamily: "'Orbitron', sans-serif", color: '#ffffff'}}>
        <span style={{ color: '#A6FF00' }}>▌</span> ИГРОКИ
      </h1>
      <p className="mt-2 text-sm" style={{color: '#8888aa'}}>
        Все зарегистрированные игроки: добавить в друзья или пригласить в команду
      </p>
      <div className="mt-2 mb-4" style={{ color: '#7a40ff', fontSize: '0.8rem' }}>
        👉 <a href={`/profile/${me}`} style={{ color: '#00f0ff' }}>Перейти в мой личный кабинет с RP рейтингом</a>
      </div>
      <div className="mt-8">
        {/* ✅ Передаём все данные из серверной части напрямую в клиент! */}
        <PlayersClient 
          myUserId={me} 
          initialPlayers={playersWithStatus}
          initialTeams={teamsWithCaptain}
          initialIncoming={incomingRequests}
        />
      </div>
    </div>
  );
}
