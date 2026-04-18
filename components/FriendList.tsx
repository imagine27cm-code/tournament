"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";

type Friend = {
  id: string;
  email: string;
  name: string | null;
};

export function FriendList() {
  const { data: session } = useSession();
  const [friends, setFriends] = useState<Friend[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!session?.user?.id) {
      setLoading(false);
      return;
    }

    async function loadFriends() {
      try {
        const res = await fetch("/api/players", { cache: "no-store" });
        const data = (await res.json().catch(() => ({}))) as { players?: Friend[] };
        const allPlayers = data.players ?? [];
        // Фильтруем только друзей (relationStatus === "FRIEND")
        // Но в текущем API players возвращает всех игроков с relationStatus
        // Нам нужно отфильтровать только друзей
        const friendsList = allPlayers.filter((p: Friend & { relationStatus?: string }) => p.relationStatus === "FRIEND");
        setFriends(friendsList);
      } catch {
        setFriends([]);
      } finally {
        setLoading(false);
      }
    }

    loadFriends();
  }, [session?.user?.id]);

  if (!session?.user?.id) {
    return null;
  }

  return (
    <aside 
      className="fixed right-0 top-16 h-[calc(100vh-4rem)] w-64 border-l bg-background-secondary p-4 overflow-y-auto"
      style={{ 
        borderColor: 'rgba(0, 240, 255, 0.2)',
        background: 'rgba(18, 18, 31, 0.95)',
        backdropFilter: 'blur(10px)'
      }}
    >
      <div className="mb-4">
        <h2 
          className="text-sm font-semibold uppercase tracking-wider"
          style={{ 
            color: '#00f0ff', 
            fontFamily: "'Orbitron', sans-serif",
            fontSize: '0.75rem',
            textShadow: '0 0 8px #00f0ff40'
          }}
        >
          Друзья
        </h2>
      </div>

      {loading ? (
        <div className="text-xs" style={{ color: '#8888aa' }}>Загрузка...</div>
      ) : friends.length === 0 ? (
        <div className="text-xs" style={{ color: '#8888aa' }}>
          Нет друзей. <a href="/players" className="cyber-link">Добавить</a>
        </div>
      ) : (
        <ul className="space-y-2">
          {friends.map((friend) => (
            <li 
              key={friend.id}
              className="flex items-center gap-2 rounded-md p-2 text-sm"
              style={{ 
                border: '1px solid rgba(0, 240, 255, 0.15)',
                background: 'rgba(26, 26, 46, 0.8)'
              }}
            >
              <div 
                className="h-2 w-2 rounded-full"
                style={{ background: '#00ff88', boxShadow: '0 0 6px #00ff88' }}
                title="Онлайн"
              />
              <div className="flex-1 truncate">
                <div className="text-xs font-medium" style={{ color: '#e0e0ff' }}>
                  {friend.name ?? 'Без имени'}
                </div>
                <div className="text-[10px] truncate" style={{ color: '#8888aa' }}>
                  {friend.email}
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
    </aside>
  );
}