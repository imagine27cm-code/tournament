"use client";

/* eslint-disable react-hooks/set-state-in-effect */

import { useEffect, useState } from "react";
import Link from "next/link";

type TournamentSummary = {
  id: string;
  name: string;
  status: string;
};

function getStatusText(status: string): string {
  const map: Record<string, string> = {
    DRAFT: "Черновик",
    REGISTRATION: "Регистрация",
    ONGOING: "Запущен",
    COMPLETED: "Завершен",
  };
  return map[status] ?? status;
}

type Registration = {
  id: string;
  status: string;
  team: { id: string; name: string };
};

export function AdminClient() {
  const [tournaments, setTournaments] = useState<TournamentSummary[]>([]);
  const [name, setName] = useState("Тестовый турнир");
  const [teamLimit, setTeamLimit] = useState(8);
  const [startDate, setStartDate] = useState(() => new Date().toISOString().slice(0, 16));
  const [endDate, setEndDate] = useState(() => new Date(Date.now() + 7 * 86400000).toISOString().slice(0, 16));
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [selectedTournamentId, setSelectedTournamentId] = useState<string | null>(null);
  const [registrations, setRegistrations] = useState<Registration[]>([]);

  async function load() {
    const res = await fetch("/api/tournaments", { cache: "no-store", credentials: "include" });
    const data = (await res.json().catch(() => ({}))) as { tournaments?: TournamentSummary[] };
    setTournaments(data.tournaments ?? []);
  }

  async function loadRegistrations(tournamentId: string) {
    const res = await fetch(`/api/tournaments/${tournamentId}/registrations`, { cache: "no-store", credentials: "include" });
    const data = (await res.json().catch(() => ({}))) as { registrations?: Registration[] };
    setRegistrations(data.registrations ?? []);
    setSelectedTournamentId(tournamentId);
  }

  async function updateRegistration(tournamentId: string, regId: string, status: "APPROVED" | "REJECTED") {
    const res = await fetch(`/api/tournaments/${tournamentId}/registrations/${regId}`, {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ status }),
    });
    if (res.ok) {
      await loadRegistrations(tournamentId);
      await load();
    } else {
      const d = await res.json().catch(() => ({}));
      alert(d?.error ?? "Ошибка");
    }
  }

  useEffect(() => {
    load();
  }, []);

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
      {/* Создать турнир */}
      <section className="cyber-card rounded-lg p-4">
        <h2 className="font-semibold" style={{color: '#00f0ff', fontFamily: "'Orbitron', sans-serif", fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '1px'}}>Создать турнир</h2>
        <form
          className="mt-3 space-y-3"
          onSubmit={async (e) => {
            e.preventDefault();
            setBusy(true);
            setError(null);
            const res = await fetch("/api/tournaments", {
              method: "POST",
              headers: { "content-type": "application/json" },
              credentials: "include",
              body: JSON.stringify({
                name,
                teamLimit,
                startDate: new Date(startDate).toISOString(),
                endDate: new Date(endDate).toISOString(),
              }),
            });
            setBusy(false);
            if (!res.ok) {
              const d = await res.json().catch(() => ({}));
              setError(d?.error ?? "Ошибка");
              return;
            }
            await load();
          }}
        >
          <label className="block text-sm">
            <div className="mb-1 text-xs" style={{color: '#8888aa'}}>Название</div>
            <input className="cyber-input w-full rounded-md" style={{borderRadius: '4px'}} value={name} onChange={(e) => setName(e.target.value)} />
          </label>
          <label className="block text-sm">
            <div className="mb-1 text-xs" style={{color: '#8888aa'}}>Лимит команд</div>
            <input className="cyber-input w-full rounded-md" style={{borderRadius: '4px'}} type="number" min={2} max={128} value={teamLimit} onChange={(e) => setTeamLimit(parseInt(e.target.value || "8", 10))} />
          </label>
          <div className="grid grid-cols-2 gap-2">
            <label className="block text-sm">
              <div className="mb-1 text-xs" style={{color: '#8888aa'}}>Start</div>
              <input className="cyber-input w-full rounded-md" style={{borderRadius: '4px'}} type="datetime-local" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
            </label>
            <label className="block text-sm">
              <div className="mb-1 text-xs" style={{color: '#8888aa'}}>End</div>
              <input className="cyber-input w-full rounded-md" style={{borderRadius: '4px'}} type="datetime-local" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
            </label>
          </div>

          {error ? <div className="text-xs" style={{color: '#ff0044'}}>{error}</div> : null}
          <button disabled={busy} className="neon-button" style={{borderRadius: '4px', fontSize: '0.75rem', padding: '0.5rem 1rem'}}>
            {busy ? "..." : "Создать"}
          </button>
        </form>
        <div className="mt-3 text-xs" style={{color: '#8888aa'}}>
          Карты: по умолчанию создаётся пул из 15 карт `Map 1..15` (можно расширить API под реальные названия).
        </div>
      </section>

      {/* Список турниров */}
      <section className="cyber-card rounded-lg p-4">
        <div className="flex items-center justify-between">
          <h2 className="font-semibold" style={{color: '#00f0ff', fontFamily: "'Orbitron', sans-serif", fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '1px'}}>Турниры</h2>
          <button className="text-sm cyber-link" onClick={load}>
            Обновить
          </button>
        </div>

        <div className="mt-3 space-y-2">
          {tournaments.map((t) => (
            <div key={t.id} className="rounded-md p-3" style={{border: '1px solid rgba(0, 240, 255, 0.15)', background: 'rgba(26, 26, 46, 0.6)'}}>
              <div className="flex items-center justify-between gap-3">
                <Link href={`/tournaments/${t.id}`} className="font-medium text-sm hover:underline" style={{color: '#e0e0ff'}}>
                  {t.name}
                </Link>
                <div className="text-xs" style={{color: '#8888aa'}}>{getStatusText(t.status)}</div>
              </div>
              <div className="mt-2 flex gap-2">
                <button
                  className="neon-button"
                  style={{borderRadius: '4px', padding: '0.3rem 0.7rem', fontSize: '0.65rem'}}
                  onClick={async () => {
                    const res = await fetch(`/api/tournaments/${t.id}/start`, { method: "POST", credentials: "include" });
                    if (!res.ok) {
                      const d = await res.json().catch(() => ({}));
                      alert(d?.error ?? "Ошибка запуска");
                      return;
                    }
                    await load();
                  }}
                >
                  Запустить (генерировать RR)
                </button>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Заявки на турниры */}
      <section className="cyber-card rounded-lg p-4 lg:col-span-2">
        <h2 className="font-semibold" style={{color: '#00f0ff', fontFamily: "'Orbitron', sans-serif", fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '1px'}}>Заявки на турниры</h2>
        <div className="mt-3">
          <select
            className="cyber-input rounded-md text-sm"
            style={{borderRadius: '4px', padding: '0.5rem'}}
            value={selectedTournamentId ?? ""}
            onChange={(e) => {
              const id = e.target.value;
              if (id) loadRegistrations(id);
              else { setSelectedTournamentId(null); setRegistrations([]); }
            }}
          >
            <option value="">Выберите турнир...</option>
            {tournaments.map((t) => (
              <option key={t.id} value={t.id}>{t.name} — {getStatusText(t.status)}</option>
            ))}
          </select>
        </div>

        {selectedTournamentId && (
          <div className="mt-3 space-y-2">
            {registrations.length === 0 ? (
              <div className="text-xs" style={{color: '#8888aa'}}>Нет заявок на этот турнир.</div>
            ) : (
              registrations.map((r) => (
                <div key={r.id} className="flex items-center justify-between rounded-md p-2" style={{border: '1px solid rgba(0, 240, 255, 0.1)', background: 'rgba(26, 26, 46, 0.5)'}}>
                  <div className="text-xs" style={{color: '#e0e0ff'}}>
                    {r.team.name}
                    <span className="ml-2 text-[10px]" style={{
                      color: r.status === 'APPROVED' ? '#00ff88' : r.status === 'REJECTED' ? '#ff0044' : '#ffff00'
                    }}>
                      ({r.status})
                    </span>
                  </div>
                  <div className="flex gap-1">
                    {r.status === 'PENDING' && (
                      <>
                        <button
                          className="rounded px-2 py-1 text-[10px]"
                          style={{background: '#00ff8830', color: '#00ff88', border: '1px solid #00ff8850'}}
                          onClick={() => updateRegistration(selectedTournamentId, r.id, 'APPROVED')}
                        >
                          Одобрить
                        </button>
                        <button
                          className="rounded px-2 py-1 text-[10px]"
                          style={{background: '#ff004430', color: '#ff0044', border: '1px solid #ff004450'}}
                          onClick={() => updateRegistration(selectedTournamentId, r.id, 'REJECTED')}
                        >
                          Отклонить
                        </button>
                      </>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </section>
    </div>
  );
}
