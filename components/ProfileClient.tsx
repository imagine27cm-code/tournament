"use client";

import { useState } from "react";
import Link from "next/link";

type UserProfile = {
  id: string;
  name: string | null;
  email: string | null;
  rp: number;
  wins: number;
  losses: number;
  createdAt: Date;
  teamId: string | null;
  team?: {
    id: string;
    name: string;
    captainId: string;
    members: { id: string; name: string | null }[];
  } | null;
  _count?: any;
};

export function ProfileClient({
  user,
  currentUserId,
  showEmail
}: {
  user: UserProfile;
  currentUserId: string | null;
  showEmail: boolean;
}) {
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  const isOwner = currentUserId === user.id;
  const isTeamCaptain = user.team?.captainId === currentUserId;
  const isInSameTeam = user.team && user.teamId === user.teamId;

  async function kickFromTeam() {
    if (!user.teamId) return;
    setLoading(true);
    setMsg(null);

    try {
      const res = await fetch(`/api/teams/${user.teamId}/members/${user.id}`, {
        method: "DELETE",
        credentials: "include"
      });

      if (!res.ok) throw new Error();

      setMsg("✅ Игрок кикнут из команды");
    } catch {
      setMsg("❌ Ошибка кика");
    } finally {
      setLoading(false);
    }
  }

  async function leaveTeam() {
    if (!user.teamId) return;
    setLoading(true);
    setMsg(null);

    try {
      const res = await fetch(`/api/teams/${user.teamId}/leave`, {
        method: "POST",
        credentials: "include"
      });

      if (!res.ok) throw new Error();

      setMsg("✅ Вы покинули команду");
    } catch {
      setMsg("❌ Ошибка выхода");
    } finally {
      setLoading(false);
    }
  }

  const winrate = user.wins + user.losses > 0
    ? Math.round((user.wins / (user.wins + user.losses)) * 100)
    : 0;

  return (
    <div className="space-y-6">
      {/* Карточка профиля */}
      <div className="cyber-card rounded-xl p-6">
        <div className="flex flex-wrap gap-6 items-start">
          <div
            className="w-24 h-24 rounded-xl flex items-center justify-center text-3xl font-bold"
            style={{ background: 'linear-gradient(135deg, #7a40ff 0%, #00f0ff 100%)', color: '#fff' }}
          >
            {(user.name ?? "A")[0].toUpperCase()}
          </div>

          <div className="flex-1 min-w-0">
            <h1
              className="text-2xl font-bold"
              style={{ color: '#ffffff', fontFamily: "'Rajdhani', sans-serif" }}
            >
              {user.name ?? "Без имени"}
            </h1>

            {showEmail && user.email && (
              <p className="text-sm mt-1" style={{ color: '#8888aa' }}>
                {user.email}
              </p>
            )}

            <div className="mt-4 flex flex-wrap gap-4">
              <div>
                <div className="text-xs" style={{ color: '#7a40ff' }}>RP РЕЙТИНГ</div>
                <div className="text-2xl font-bold" style={{ color: '#7a40ff', fontFamily: "'Orbitron', sans-serif" }}>
                  {user.rp}
                </div>
              </div>

              <div>
                <div className="text-xs" style={{ color: '#8888aa' }}>ПОБЕД</div>
                <div className="text-xl font-bold" style={{ color: '#00ff88' }}>{user.wins}</div>
              </div>

              <div>
                <div className="text-xs" style={{ color: '#8888aa' }}>ПОРАЖЕНИЙ</div>
                <div className="text-xl font-bold" style={{ color: '#ff4444' }}>{user.losses}</div>
              </div>


              <div>
                <div className="text-xs" style={{ color: '#8888aa' }}>WINRATE</div>
                <div className="text-xl font-bold" style={{ color: '#00f0ff' }}>{winrate}%</div>
              </div>
            </div>
          </div>
        </div>

        {/* Команда */}
        {user.team && (
          <div className="mt-6 pt-4" style={{ borderTop: '1px solid rgba(122, 64, 255, 0.2)' }}>
            <div className="text-xs mb-2" style={{ color: '#8888aa' }}>КОМАНДА</div>
            <div className="flex items-center justify-between flex-wrap gap-3">
              <Link
                href={`/teams/${user.team.id}`}
                className="text-xl font-semibold neon-link"
                style={{ color: '#00f0ff' }}
              >
                {user.team.name}
              </Link>

              <div className="flex flex-wrap gap-2">
                {isTeamCaptain && !isOwner && (
                  <button
                    className="neon-button-red text-xs"
                    style={{ padding: '0.4rem 0.8rem', borderRadius: '4px' }}
                    onClick={kickFromTeam}
                    disabled={loading}
                  >
                    Кикнуть из команды
                  </button>
                )}

                {isOwner && (
                  <button
                    className="neon-button text-xs"
                    style={{ padding: '0.4rem 0.8rem', borderRadius: '4px' }}
                    onClick={leaveTeam}
                    disabled={loading}
                  >
                    Выйти из команды
                  </button>
                )}
              </div>
            </div>

            <div className="mt-2 text-sm" style={{ color: '#aaaacc' }}>
              Участников: {user.team.members.length}
            </div>
          </div>
        )}

        {msg && (
          <div className="mt-4 text-sm" style={{ color: msg.includes('✅') ? '#00ff88' : '#ff4444' }}>
            {msg}
          </div>
        )}
      </div>

      {/* Уведомление */}
      <div className="cyber-card rounded-lg p-4 text-sm" style={{ color: '#8888aa', opacity: 0.8 }}>
        💡 При выходе капитана из команды, если в команде не остаётся больше никого - она автоматически удаляется
      </div>
    </div>
  );
}