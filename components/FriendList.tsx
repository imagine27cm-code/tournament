"use client";

import { useEffect, useState, useCallback, memo } from "react";
import { useSession } from "next-auth/react";
import Link from "next/link";

type Friend = {
  id: string;
  email: string;
  name: string | null;
  online: boolean;
};

type TeamMember = {
  id: string;
  userId: string;
  isCaptain: boolean;
  user: { id: string; email: string; name: string | null };
};

type Team = {
  id: string;
  name: string;
  captainId: string;
  members: TeamMember[];
};

type TeamInvite = {
  id: string;
  token: string;
  team: { id: string; name: string };
};

function FriendListInner() {
  const { data: session, status } = useSession();
  const [friends, setFriends] = useState<Friend[]>([]);
  const [teams, setTeams] = useState<Team[]>([]);
  const [invites, setInvites] = useState<TeamInvite[]>([]);
  const [loading, setLoading] = useState(true);

  const loadAll = useCallback(async () => {
    if (status !== "authenticated" || !session?.user?.id) {
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const [fRes, tRes, iRes] = await Promise.all([
        fetch("/api/friends", { cache: "no-store", credentials: "include" }),
        fetch("/api/teams", { cache: "no-store", credentials: "include" }),
        fetch("/api/team-invites/incoming", { cache: "no-store", credentials: "include" }),
      ]);
      const fData = (await fRes.json().catch(() => ({}))) as { friends?: Friend[] };
      const tData = (await tRes.json().catch(() => ({}))) as { teams?: Team[] };
      const iData = (await iRes.json().catch(() => ({}))) as { invites?: TeamInvite[] };
      setFriends(fData.friends ?? []);
      setTeams(tData.teams ?? []);
      setInvites(iData.invites ?? []);
    } catch {
      setFriends([]);
      setTeams([]);
      setInvites([]);
    } finally {
      setLoading(false);
    }
  }, [status, session?.user?.id]);

  useEffect(() => {
    loadAll();
  }, [loadAll]);

  async function handleLeaveTeam(teamId: string) {
    if (!confirm("Покинуть команду?")) return;
    const res = await fetch(`/api/teams/${teamId}/leave`, {
      method: "POST",
      credentials: "include",
    });
    if (res.ok) {
      setTeams((prev) => prev.filter((t) => t.id !== teamId));
    }
  }

  async function handleAcceptInvite(token: string) {
    const res = await fetch(`/api/team-invites/${token}/accept`, {
      method: "POST",
      credentials: "include",
    });
    if (res.ok) await loadAll();
  }

  async function handleDeclineInvite(token: string) {
    const res = await fetch(`/api/team-invites/${token}/decline`, {
      method: "POST",
      credentials: "include",
    });
    if (res.ok) {
      setInvites((prev) => prev.filter((i) => i.token !== token));
    }
  }

  if (status !== "authenticated" || !session?.user?.id) {
    return null;
  }

  const myTeam = teams[0];

  return (
    <aside
      className="fixed right-0 top-16 z-40 overflow-y-auto border-l"
      style={{
        height: "calc(100vh - 4rem)",
        width: "16rem",
        borderColor: "rgba(0, 240, 255, 0.2)",
        background: "rgba(18, 18, 31, 0.95)",
        backdropFilter: "blur(10px)",
      }}
    >
      <div className="p-4">
        {/* === ДРУЗЬЯ === */}
        <div className="mb-3 flex items-center justify-between">
          <h2
            className="text-xs font-semibold uppercase tracking-wider"
            style={{
              color: "#00f0ff",
              fontFamily: "'Orbitron', sans-serif",
              textShadow: "0 0 8px #00f0ff40",
            }}
          >
            Друзья онлайн
          </h2>
          <button onClick={loadAll} className="text-[10px]" style={{ color: "#8888aa" }}>
            ↻
          </button>
        </div>

        {loading ? (
          <div className="mb-4 text-xs" style={{ color: "#8888aa" }}>Загрузка...</div>
        ) : friends.length === 0 ? (
          <div className="mb-4 text-xs" style={{ color: "#8888aa" }}>
            Нет друзей. <Link href="/players" className="cyber-link">Добавить</Link>
          </div>
        ) : (
          <ul className="mb-4 space-y-2">
            {friends.map((friend) => (
              <li
                key={friend.id}
                className="flex items-center gap-2 rounded-md p-2 text-sm"
                style={{
                  border: "1px solid rgba(0, 240, 255, 0.15)",
                  background: "rgba(26, 26, 46, 0.8)",
                }}
              >
                <div
                  className="h-2 w-2 shrink-0 rounded-full"
                  style={{
                    background: friend.online ? "#00ff88" : "#ff0044",
                    boxShadow: friend.online ? "0 0 8px #00ff88" : "0 0 6px #ff004460",
                    animation: friend.online ? "pulse-green 1.2s infinite" : "pulse-red 1.2s infinite",
                  }}
                  title={friend.online ? "Онлайн" : "Оффлайн"}
                />
                <Link href={`/profile/${friend.id}`} className="flex-1 truncate">
                  <div className="text-xs font-medium" style={{ color: "#e0e0ff" }}>
                    {friend.name ?? "Без имени"}
                  </div>
                  <div className="text-[10px] truncate" style={{ color: "#8888aa" }}>
                    {friend.email}
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        )}

        {/* === ПРИГЛАШЕНИЯ В КОМАНДУ === */}
        {invites.length > 0 && (
          <>
            <div
              className="mb-2 mt-4 text-xs font-semibold uppercase tracking-wider"
              style={{ color: "#ff00ff", fontFamily: "'Orbitron', sans-serif" }}
            >
              Приглашения в команду
            </div>
            <ul className="mb-4 space-y-2">
              {invites.map((inv) => (
                <li
                  key={inv.id}
                  className="rounded-md p-2"
                  style={{
                    border: "1px solid rgba(255, 0, 255, 0.25)",
                    background: "rgba(46, 26, 46, 0.6)",
                  }}
                >
                  <div className="text-xs" style={{ color: "#e0e0ff" }}>
                    {inv.team.name}
                  </div>
                  <div className="mt-1 flex gap-1">
                    <button
                      className="rounded px-2 py-1 text-[10px]"
                      style={{ background: "#00ff8830", color: "#00ff88", border: "1px solid #00ff8850" }}
                      onClick={() => handleAcceptInvite(inv.token)}
                    >
                      Принять
                    </button>
                    <button
                      className="rounded px-2 py-1 text-[10px]"
                      style={{ background: "#ff004430", color: "#ff0044", border: "1px solid #ff004450" }}
                      onClick={() => handleDeclineInvite(inv.token)}
                    >
                      Отклонить
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          </>
        )}

        {/* === МОЯ КОМАНДА === */}
        {myTeam && (
          <>
            <div
              className="mb-2 mt-4 text-xs font-semibold uppercase tracking-wider"
              style={{ color: "#00f0ff", fontFamily: "'Orbitron', sans-serif" }}
            >
              Моя команда
            </div>
            <div
              className="mb-2 rounded-md p-2 text-sm font-medium"
              style={{
                border: "1px solid rgba(0, 240, 255, 0.2)",
                background: "rgba(26, 26, 46, 0.8)",
                color: "#e0e0ff",
              }}
            >
              {myTeam.name}
            </div>
            <ul className="mb-3 space-y-1">
              {myTeam.members.map((m) => (
                <li key={m.id} className="flex items-center gap-2 px-1 text-xs">
                  <div
                    className="h-1.5 w-1.5 rounded-full"
                    style={{
                      background: m.isCaptain ? "#ffff00" : "#8888aa",
                      boxShadow: m.isCaptain ? "0 0 4px #ffff00" : "none",
                    }}
                  />
                  <span style={{ color: m.isCaptain ? "#ffff00" : "#e0e0ff" }}>
                    {m.user.name ?? m.user.email}
                  </span>
                  {m.isCaptain && (
                    <span className="text-[9px]" style={{ color: "#8888aa" }}>
                      (капитан)
                    </span>
                  )}
                </li>
              ))}
            </ul>
            <button
              className="w-full rounded-md py-1.5 text-[10px] uppercase tracking-wider"
              style={{
                background: "rgba(255, 0, 68, 0.15)",
                color: "#ff0044",
                border: "1px solid rgba(255, 0, 68, 0.3)",
              }}
              onClick={() => handleLeaveTeam(myTeam.id)}
            >
              Покинуть команду
            </button>
          </>
        )}
      </div>
    </aside>
  );
}

export const FriendList = memo(FriendListInner);
