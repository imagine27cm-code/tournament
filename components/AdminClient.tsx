"use client";

/* eslint-disable react-hooks/set-state-in-effect */

import { useEffect, useState } from "react";
import Link from "next/link";
import { toast } from "sonner";

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

type News = {
  id: string;
  title: string;
  content: string;
  tag: string;
  createdAt: string;
};

export function AdminClient() {
  const [tournaments, setTournaments] = useState<TournamentSummary[]>([]);
  const [name, setName] = useState("Тестовый турнир");
  const [teamLimit, setTeamLimit] = useState(8);
  const [prizePool, setPrizePool] = useState(0);
  const [startDate, setStartDate] = useState(() => new Date().toISOString().slice(0, 16));
  const [endDate, setEndDate] = useState(() => new Date(Date.now() + 7 * 86400000).toISOString().slice(0, 16));
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [selectedTournamentId, setSelectedTournamentId] = useState<string | null>(null);
  const [registrations, setRegistrations] = useState<Registration[]>([]);

  // Новости
  const [newsList, setNewsList] = useState<News[]>([]);
  const [newNewsTitle, setNewNewsTitle] = useState("");
  const [newNewsContent, setNewNewsContent] = useState("");
  const [newNewsTag, setNewNewsTag] = useState("NEW");

  async function loadNews() {
    const res = await fetch("/api/news", { cache: "no-store", credentials: "include" });
    const data = (await res.json().catch(() => ({}))) as { news?: News[] };
    setNewsList(data.news ?? []);
  }

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
    loadNews();
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
           <label className="block text-sm">
             <div className="mb-1 text-xs" style={{color: '#8888aa'}}>Призовой фонд</div>
             <input className="cyber-input w-full rounded-md" style={{borderRadius: '4px'}} type="number" min={0} value={prizePool} onChange={(e) => setPrizePool(parseInt(e.target.value || "0", 10))} />
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
                {t.status === "REGISTRATION" && (
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
                )}
                {t.status === "ONGOING" && (
                  <button
                    className="neon-button-magenta"
                    style={{borderRadius: '4px', padding: '0.3rem 0.7rem', fontSize: '0.65rem'}}
                    onClick={async () => {
                      if (!confirm("Завершить турнир? Будет произведён подсчёт RP и статистики.")) return;
                      const res = await fetch(`/api/tournaments/${t.id}/complete`, { method: "POST", credentials: "include" });
                      if (!res.ok) {
                        const d = await res.json().catch(() => ({}));
                        alert(d?.error ?? "Ошибка завершения");
                        return;
                      }
                      const data = await res.json();
                      alert(`Турнир завершён!\n\nТоп-3:\n` + data.standings.slice(0, 3).map((s: any, i: number) => `${i + 1}. ${s.teamName} — ${s.points} очков`).join("\n"));
                      await load();
                    }}
                  >
                    Завершить турнир
                  </button>
                )}
                <button
                  className="rounded px-2 py-1 text-[10px]"
                  style={{background: '#ff004430', color: '#ff0044', border: '1px solid #ff004450', marginLeft: 'auto'}}
                  onClick={async () => {
                    if (!confirm("Удалить турнир? Это действие необратимо!")) return;
                    const res = await fetch(`/api/tournaments/${t.id}`, { method: "DELETE", credentials: "include" });
                    if (!res.ok) {
                      const d = await res.json().catch(() => ({}));
                      alert(d?.error ?? "Ошибка удаления");
                      return;
                    }
                    await load();
                  }}
                >
                  Удалить
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

      {/* Управление новостями */}
      <section className="cyber-card rounded-lg p-4 lg:col-span-2">
        <h2 className="font-semibold" style={{color: '#ff00ff', fontFamily: "'Orbitron', sans-serif", fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '1px'}}>УПРАВЛЕНИЕ НОВОСТЯМИ</h2>

        <div className="mt-4 grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Форма добавить / редактировать */}
          <div className="space-y-3">
            <input
              className="cyber-input w-full rounded-md"
              placeholder="Заголовок новости"
              value={newNewsTitle}
              onChange={(e) => setNewNewsTitle(e.target.value)}
            />
            <textarea
              className="cyber-input w-full rounded-md min-h-[120px]"
              placeholder="Текст новости"
              value={newNewsContent}
              onChange={(e) => setNewNewsContent(e.target.value)}
            />
            <select
              className="cyber-input w-full rounded-md"
              value={newNewsTag}
              onChange={(e) => setNewNewsTag(e.target.value)}
            >
              <option value="NEW">🔥 НОВОЕ</option>
              <option value="UPDATE">✅ ОБНОВЛЕНИЕ</option>
              <option value="INFO">ℹ️ ИНФО</option>
            </select>
            <button
              className="neon-button-magenta w-full rounded-md"
              style={{borderRadius: '4px', padding: '0.5rem'}}
              onClick={async () => {
                if (!newNewsTitle.trim() || !newNewsContent.trim()) return;
                const res = await fetch("/api/news", {
                  method: "POST",
                  headers: { "content-type": "application/json" },
                  credentials: "include",
                  body: JSON.stringify({
                    title: newNewsTitle,
                    content: newNewsContent,
                    tag: newNewsTag,
                  }),
                });
                if (res.ok) {
                  toast.success("Новость добавлена!");
                  setNewNewsTitle("");
                  setNewNewsContent("");
                  setNewNewsTag("NEW");
                  await loadNews();
                } else {
                  toast.error("Ошибка добавления новости");
                }
              }}
            >
              Добавить новость
            </button>
          </div>

          {/* Список новостей */}
          <div className="space-y-2 max-h-[300px] overflow-y-auto">
            {newsList.map((n) => (
              <div key={n.id} className="rounded-md p-3" style={{border: '1px solid rgba(255, 0, 255, 0.15)', background: 'rgba(30, 30, 48, 0.6)'}}>
                <div className="flex justify-between items-start">
                  <div>
                    <div className="text-sm font-medium" style={{color: '#e0e0ff'}}>{n.title}</div>
                    <div className="text-[10px] mt-1" style={{color: '#8888aa'}}>{n.tag} — {new Date(n.createdAt).toLocaleDateString()}</div>
                  </div>
                  <button
                    className="text-[10px] px-2 py-0.5 rounded"
                    style={{background: '#ff004430', color: '#ff0044', border: '1px solid #ff004450'}}
                    onClick={async () => {
                      if (!confirm("Удалить новость?")) return;
                      await fetch(`/api/news/${n.id}`, {
                        method: "DELETE",
                        credentials: "include",
                      });
                      await loadNews();
                    }}
                  >
                    Удалить
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
