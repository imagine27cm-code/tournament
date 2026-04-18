import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { PlayersClient } from "@/components/PlayersClient";

export default async function PlayersPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) redirect("/signin?callbackUrl=/players");

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <h1 className="text-3xl font-semibold tracking-tight gradient-text" style={{fontFamily: "'Orbitron', sans-serif", textShadow: '0 0 20px #00f0ff40'}}>ИГРОКИ</h1>
      <p className="mt-2 text-sm" style={{color: '#8888aa'}}>
        Все зарегистрированные игроки: добавить в друзья или пригласить в команду
      </p>
      <div className="mt-8">
        <PlayersClient myUserId={session.user.id} />
      </div>
    </div>
  );
}