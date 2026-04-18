"use client";

import Link from "next/link";
/* eslint-disable react-hooks/set-state-in-effect */

import { useEffect, useState } from "react";

type Props = { role: "PLAYER" | "ADMIN"; userId: string };

type TeamDto = {
  id: string;
  name: string;
  captainId: string;
  members?: Array<{ id: string }>;
};

export function DashboardClient({ role, userId }: Props) {
  const [teams, setTeams] = useState<TeamDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [teamName, setTeamName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [inviteEmailByTeam, setInviteEmailByTeam] = useState<Record<string, string>>({});
  const [inviteLinkByTeam, setInviteLinkByTeam] = useState<Record<string, string>>({});
  const [adminTournamentName, setAdminTournamentName] = useState("New Tournament");
  const [adminTeamLimit, setAdminTeamLimit] = useState(8);
  const [adminStartDate, setAdminStartDate] = useState(() =>
    new Date().toISOString().slice(0, 16),
  );
  const [adminEndDate, setAdminEndDate] = useState(() =>
    new Date(Date.now() + 7 * 86400000).toISOString().slice(0, 16),
  );
  const [adminMsg, setAdminMsg] = useState<string | null>(null);

  const isAdmin = role === "ADMIN";

  async function load() {
    setLoading(true);
    setError(null);
    const res = await fetch("/api/teams", { cache: "no-store" });
    const data = (await res.json().catch(() => ({}))) as { teams?: TeamDto[] };
    setTeams(data.teams ?? []);
    setLoading(false);
  }

  useEffect(() => {
    load();
  }, []);

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
      <section className="cyber-card rounded-lg p-4">
        <div className="flex items-center justify-between">
          <h2 className="font-semibold" style={{color: '#00f0ff', fontFamily: "'Orbitron', sans-serif", fontSize: '0.9rem', textTransform: 'uppercase', letterSpacing: '1px'}}>Мои команды</h2>
          <button
            className="text-sm cyber-link"
            onClick={load}
          >
            Обновить
          </button>
        </div>

        <form
          className="mt-4 flex gap-2"
          onSubmit={async (e) => {
            e.preventDefault();
            setError(null);
            const res = await fetch("/api/teams", {
              method: "POST",
              headers: { "content-type": "application/json" },
              body: JSON.stringify({ name: teamName }),
            });
            if (!res.ok) {
              const d = await res.json().catch(() => ({}));
              setError(d?.error === "TEAM_NAME_TAKEN" ? "Имя команды занято." : "Ошибка создания команды.");
              return;
            }
            setTeamName("");
            await load();
          }}
        >
          <input
            className="cyber-input flex-1 rounded-md"
            style={{borderRadius: '4px'}}
            placeholder="Название команды"
            value={teamName}
            onChange={(e) => setTeamName(e.target.value)}
            required
          />
          <button className="neon-button" style={{borderRadius: '4px'}}>
            Создать
          </button>
        </form>

        {error ? <div className="mt-2 text-sm" style={{color: '#ff0044', textShadow: '0 0 8px #ff004480'}}>{error}</div> : null}

        <div className="mt-4 space-y-3">
          {loading ? (
            <div className="text-sm" style={{color: '#8888aa'}}>Загрузка...</div>
          ) : teams.length === 0 ? (
            <div className="text-sm" style={{color: '#8888aa'}}>
              У вас нет команд.
            </div>
          ) : (
            teams.map((t) => (
              <div key={t.id} className="rounded-md" style={{border: '1px solid rgba(0, 240, 255, 0.3)', padding: '1rem'}}>
                <div className="flex items-center justify-between gap-3">
                  <div className="font-medium" style={{color: '#e0e0ff'}}>{t.name}</div>
                  <div className="text-xs" style={{color: '#8888aa'}}>
                    участников: {t.members?.length ?? 0}
                  </div>
                </div>
                <div className="mt-2 text-xs" style={{color: '#8888aa'}}>
                  Капитан: {t.captainId}
                </div>
                {t.captainId === userId ? (
                  <div className="mt-3 rounded-md" style={{border: '1px solid rgba(0, 240, 255, 0.2)', padding: '0.75rem'}}>
                    <div className="text-xs font-semibold" style={{color: '#00f0ff'}}>Пригласить в команду</div>
                    <div className="mt-2 flex gap-2">
                      <input
                        className="cyber-input flex-1 rounded-md text-xs"
                        style={{borderRadius: '4px', padding: '0.5rem'}}
                        placeholder="email (необязательно)"
                        value={inviteEmailByTeam[t.id] ?? ""}
                        onChange={(e) =>
                          setInviteEmailByTeam((prev) => ({ ...prev, [t.id]: e.target.value }))
                        }
                      />
                      <button
                        className="neon-button"
                        style={{borderRadius: '4px', padding: '0.4rem 0.8rem', fontSize: '0.7rem'}}
                        onClick={async () => {
                          const email = (inviteEmailByTeam[t.id] ?? "").trim();
                          const payload = email ? { email } : {};
                          const res = await fetch(`/api/teams/${t.id}/invites`, {
                            method: "POST",
                            headers: { "content-type": "application/json" },
                            body: JSON.stringify(payload),
                          });
                          const d = await res.json().catch(() => ({}));
                          if (!res.ok) {
                            setError(d?.error ?? "Ошибка создания инвайта");
                            return;
                          }
                          const fullLink = `${window.location.origin}${d.joinUrl}`;
                          setInviteLinkByTeam((prev) => ({ ...prev, [t.id]: fullLink }));
                        }}
                      >
                        Создать
                      </button>
                    </div>
                    {inviteLinkByTeam[t.id] ? (
                      <div className="mt-2 flex items-center gap-2">
                        <input
                          className="cyber-input flex-1 rounded-md text-xs"
                          style={{borderRadius: '4px', padding: '0.5rem'}}
                          readOnly
                          value={inviteLinkByTeam[t.id]}
                        />
                        <button
                          className="neon-button"
                          style={{borderRadius: '4px', padding: '0.4rem 0.8rem', fontSize: '0.7rem'}}
                          onClick={async () => {
                            await navigator.clipboard.writeText(inviteLinkByTeam[t.id]!);
                          }}
                        >
                          Копировать
                        </button>
                      </div>
                    ) : null}
                  </div>
                ) : null}
              </div>
            ))
          )}
        </div>
      </section>

      <section className="cyber-card rounded-lg p-4">
        <h2 className="font-semibold" style={{color: '#00f0ff', fontFamily: "'Orbitron', sans-serif", fontSize: '0.9rem', textTransform: 'uppercase', letterSpacing: '1px'}}>Турниры</h2>
        <p className="mt-1 text-sm" style={{color: '#8888aa'}}>
          Регистрация команды на турнир делается со страницы турнира.
        </p>

        <div className="mt-4 flex flex-wrap gap-2">
          <Link
            href="/"
            className="neon-button"
            style={{borderRadius: '4px'}}
          >
            К списку турниров
          </Link>
          {isAdmin ? (
            <Link
              href="/admin"
              className="neon-button-magenta"
              style={{borderRadius: '4px'}}
            >
              Админ‑панель
            </Link>
          ) : null}
        </div>

        <div className="mt-4 text-xs" style={{color: '#8888aa'}}>
          Примечание: для прототипа роль ADMIN можно выставить вручную в БД (см. README).
        </div>
        {isAdmin ? (
          <div className="mt-4 rounded-lg" style={{border: '1px solid rgba(255, 0, 255, 0.3)', padding: '1rem'}}>
            <div className="font-semibold text-sm" style={{color: '#ff00ff', fontFamily: "'Orbitron', sans-serif"}}>Создать турнир (админ)</div>
            <div className="mt-3 space-y-2">
              <input
                className="cyber-input w-full rounded-md"
                style={{borderRadius: '4px'}}
                value={adminTournamentName}
                onChange={(e) => setAdminTournamentName(e.target.value)}
                placeholder="Название турнира"
              />
              <div className="grid grid-cols-3 gap-2">
                <input
                  className="cyber-input rounded-md"
                  style={{borderRadius: '4px'}}
                  type="number"
                  min={2}
                  max={128}
                  value={adminTeamLimit}
                  onChange={(e) => setAdminTeamLimit(parseInt(e.target.value || "8", 10))}
                />
                <input
                  className="cyber-input rounded-md"
                  style={{borderRadius: '4px'}}
                  type="datetime-local"
                  value={adminStartDate}
                  onChange={(e) => setAdminStartDate(e.target.value)}
                />
                <input
                  className="cyber-input rounded-md"
                  style={{borderRadius: '4px'}}
                  type="datetime-local"
                  value={adminEndDate}
                  onChange={(e) => setAdminEndDate(e.target.value)}
                />
              </div>
              <button
                className="neon-button-magenta w-full"
                style={{borderRadius: '4px', marginTop: '0.5rem'}}
                onClick={async () => {
                  setAdminMsg(null);
                  const res = await fetch("/api/tournaments", {
                    method: "POST",
                    headers: { "content-type": "application/json" },
                    body: JSON.stringify({
                      name: adminTournamentName,
                      teamLimit: adminTeamLimit,
                      startDate: new Date(adminStartDate).toISOString(),
                      endDate: new Date(adminEndDate).toISOString(),
                    }),
                  });
                  const d = await res.json().catch(() => ({}));
                  if (!res.ok) {
                    setAdminMsg(`Ошибка: ${d?.error ?? "UNKNOWN"}`);
                    return;
                  }
                  setAdminMsg(`Турнир создан: ${d?.tournament?.name ?? "OK"}`);
                }}
              >
                Создать турнир
              </button>
              {adminMsg ? <div className="text-xs" style={{color: '#00ff88'}}>{adminMsg}</div> : null}
            </div>
          </div>
        ) : null}
      </section>
    </div>
  );
}