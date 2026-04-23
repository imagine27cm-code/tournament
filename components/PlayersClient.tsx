"use client";

/* eslint-disable react-hooks/set-state-in-effect */

import { useEffect, useMemo, useState } from "react";

type PlayerDto = {
  id: string;
  email: string;
  name: string | null;
  relationStatus: "NONE" | "OUTGOING_PENDING" | "INCOMING_PENDING" | "FRIEND";
  relationRequestId: string | null;
};

type TeamDto = {
  id: string;
  name: string;
  captainId: string;
};

type IncomingDto = {
  id: string;
  fromUserId: string;
  email: string;
  name: string | null;
};

export function PlayersClient({
  myUserId,
  initialPlayers,
  initialTeams,
  initialIncoming
}: {
  myUserId: string;
  initialPlayers: PlayerDto[];
  initialTeams: TeamDto[];
  initialIncoming: IncomingDto[];
}) {
  const [players, setPlayers] = useState<PlayerDto[]>(initialPlayers);
  const [teams, setTeams] = useState<TeamDto[]>(initialTeams);
  const [incoming, setIncoming] = useState<IncomingDto[]>(initialIncoming);
  const [selectedTeamByPlayer, setSelectedTeamByPlayer] = useState<Record<string, string>>({});
  const [msg, setMsg] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function load() {
    try {
      setLoading(true);
      setMsg(null);
      const res = await fetch("/api/players", { cache: "no-store", credentials: "include" });
      if (!res.ok) throw new Error("Failed to load players");
      const data = (await res.json().catch(() => ({}))) as { players?: PlayerDto[] };
      setPlayers(data.players ?? []);
    } catch {
      setMsg("Ошибка обновления списка игроков");
    } finally {
      setLoading(false);
    }
  }

  const defaultTeamId = useMemo(() => teams[0]?.id ?? "", [teams]);

  return (
    <div className="space-y-6">
      {loading ? (
        <div className="cyber-card rounded-lg p-8 text-center">
          <div className="text-sm" style={{color: '#8888aa'}}>Загрузка игроков...</div>
        </div>
      ) : (
        <>
      <section className="cyber-card rounded-lg p-4">
        <div className="flex items-center justify-between">
          <h2 className="font-semibold" style={{color: '#00f0ff', fontFamily: "'Orbitron', sans-serif", fontSize: '0.9rem', textTransform: 'uppercase', letterSpacing: '1px'}}>Входящие заявки в друзья</h2>
          <button className="text-sm cyber-link" onClick={load}>
            Обновить
          </button>
        </div>
        <div className="mt-3 space-y-2">
          {incoming.length === 0 ? (
            <div className="text-sm" style={{color: '#8888aa'}}>Нет входящих заявок.</div>
          ) : (
            incoming.map((r) => (
              <div key={r.id} className="flex items-center justify-between rounded-md" style={{border: '1px solid rgba(0, 240, 255, 0.3)', padding: '0.75rem'}}>
                <div className="text-sm">
                  <span style={{color: '#e0e0ff'}}>{r.name ?? "Без имени"}</span>
                  <span className="ml-2" style={{color: '#8888aa'}}>({r.email})</span>
                </div>
                <button
                  className="neon-button"
                  style={{borderRadius: '4px', padding: '0.4rem 0.8rem', fontSize: '0.7rem'}}
                  onClick={async () => {
                     await fetch(`/api/friends/requests/${r.id}/accept`, { method: "POST", credentials: "include" });
                    await load();
                  }}
                >
                  Принять
                </button>
              </div>
            ))
          )}
        </div>
      </section>

      <section className="cyber-card rounded-lg p-4">
        <h2 className="font-semibold" style={{color: '#00f0ff', fontFamily: "'Orbitron', sans-serif", fontSize: '0.9rem', textTransform: 'uppercase', letterSpacing: '1px'}}>Все игроки</h2>
        <div className="mt-3 space-y-3">
          {players.map((p) => (
            <div key={p.id} className="rounded-md" style={{border: '1px solid rgba(0, 240, 255, 0.2)', padding: '1rem'}}>
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="text-sm">
                  <span className="font-medium" style={{color: '#e0e0ff'}}>{p.name ?? "Без имени"}</span>
                  <span className="ml-2" style={{color: '#8888aa'}}>({p.email})</span>
                </div>
                <div className="text-xs" style={{color: p.relationStatus === "FRIEND" ? '#00ff88' : p.relationStatus === "OUTGOING_PENDING" ? '#ffff00' : p.relationStatus === "INCOMING_PENDING" ? '#ff00ff' : '#8888aa'}}>
                  {p.relationStatus === "FRIEND"
                    ? "Друг"
                    : p.relationStatus === "OUTGOING_PENDING"
                      ? "Заявка отправлена"
                      : p.relationStatus === "INCOMING_PENDING"
                        ? "Входящая заявка"
                        : "Не в друзьях"}
                </div>
              </div>

              <div className="mt-3 flex flex-wrap gap-2">
                <button
                  disabled={p.relationStatus !== "NONE"}
                  className="neon-button"
                  style={{borderRadius: '4px', padding: '0.4rem 0.8rem', fontSize: '0.7rem', opacity: p.relationStatus !== "NONE" ? 0.5 : 1}}
                  onClick={async () => {
                     const res = await fetch("/api/friends/requests", {
                       method: "POST",
                       headers: { "content-type": "application/json" },
                       body: JSON.stringify({ toUserId: p.id }),
                       credentials: "include"
                     });
                    if (!res.ok) {
                      const d = await res.json().catch(() => ({}));
                      setMsg(`Ошибка друзей: ${d?.error ?? "UNKNOWN"}`);
                    } else {
                      setMsg(`Заявка в друзья отправлена: ${p.email}`);
                      await load();
                    }
                  }}
                >
                  Добавить в друзья
                </button>

                <select
                  className="cyber-input rounded-md text-xs"
                  style={{borderRadius: '4px', padding: '0.4rem 0.6rem'}}
                  value={selectedTeamByPlayer[p.id] ?? defaultTeamId}
                  onChange={(e) =>
                    setSelectedTeamByPlayer((prev) => ({ ...prev, [p.id]: e.target.value }))
                  }
                >
                  {teams.length === 0 ? (
                    <option value="">Нет моих команд (где вы капитан)</option>
                  ) : (
                    teams.map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.name}
                      </option>
                    ))
                  )}
                </select>

                <button
                  disabled={teams.length === 0}
                  className="neon-button-magenta"
                  style={{borderRadius: '4px', padding: '0.4rem 0.8rem', fontSize: '0.7rem', opacity: teams.length === 0 ? 0.5 : 1}}
                  onClick={async () => {
                    const teamId = selectedTeamByPlayer[p.id] ?? defaultTeamId;
                    if (!teamId) return;
                     const res = await fetch(`/api/teams/${teamId}/invites`, {
                       method: "POST",
                       headers: { "content-type": "application/json" },
                       body: JSON.stringify({ email: p.email }),
                       credentials: "include"
                     });
                    if (!res.ok) {
                      const d = await res.json().catch(() => ({}));
                      setMsg(`Ошибка инвайта: ${d?.error ?? "UNKNOWN"}`);
                      return;
                    }
                    const d = (await res.json().catch(() => ({}))) as { joinUrl?: string };
                    setMsg(`Инвайт отправлен игроку ${p.email}. Ссылка: ${d.joinUrl ?? "-"}`);
                  }}
                >
                  Пригласить в команду
                </button>
              </div>
            </div>
          ))}
        </div>
        {msg ? <div className="mt-3 text-xs" style={{color: '#00ff88'}}>{msg}</div> : null}
      </section>
        </>
      )}
    </div>
  );
}