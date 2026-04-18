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

export function AdminClient() {
  const [tournaments, setTournaments] = useState<TournamentSummary[]>([]);
  const [name, setName] = useState("Тестовый турнир");
  const [teamLimit, setTeamLimit] = useState(8);
  const [startDate, setStartDate] = useState(() => new Date().toISOString().slice(0, 16));
  const [endDate, setEndDate] = useState(() => new Date(Date.now() + 7 * 86400000).toISOString().slice(0, 16));
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function load() {
    const res = await fetch("/api/tournaments", { cache: "no-store" });
    const data = (await res.json().catch(() => ({}))) as { tournaments?: TournamentSummary[] };
    setTournaments(data.tournaments ?? []);
  }

  useEffect(() => {
    load();
  }, []);

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
      <section className="rounded-lg border bg-white p-4 dark:bg-black">
        <h2 className="font-semibold">Создать турнир</h2>
        <form
          className="mt-3 space-y-3"
          onSubmit={async (e) => {
            e.preventDefault();
            setBusy(true);
            setError(null);
            const res = await fetch("/api/tournaments", {
              method: "POST",
              headers: { "content-type": "application/json" },
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
            <div className="mb-1 text-zinc-600 dark:text-zinc-300">Название</div>
            <input className="w-full rounded-md border px-3 py-2 bg-transparent" value={name} onChange={(e) => setName(e.target.value)} />
          </label>
          <label className="block text-sm">
            <div className="mb-1 text-zinc-600 dark:text-zinc-300">Лимит команд</div>
            <input className="w-full rounded-md border px-3 py-2 bg-transparent" type="number" min={2} max={128} value={teamLimit} onChange={(e) => setTeamLimit(parseInt(e.target.value || "8", 10))} />
          </label>
          <div className="grid grid-cols-2 gap-2">
            <label className="block text-sm">
              <div className="mb-1 text-zinc-600 dark:text-zinc-300">Start</div>
              <input className="w-full rounded-md border px-3 py-2 bg-transparent" type="datetime-local" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
            </label>
            <label className="block text-sm">
              <div className="mb-1 text-zinc-600 dark:text-zinc-300">End</div>
              <input className="w-full rounded-md border px-3 py-2 bg-transparent" type="datetime-local" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
            </label>
          </div>

          {error ? <div className="text-sm text-red-600">{error}</div> : null}
          <button disabled={busy} className="rounded-md bg-black px-3 py-2 text-sm text-white disabled:opacity-60 dark:bg-white dark:text-black">
            {busy ? "..." : "Создать"}
          </button>
        </form>
        <div className="mt-3 text-xs text-zinc-500">
          Карты: по умолчанию создаётся пул из 15 карт `Map 1..15` (можно расширить API под реальные названия).
        </div>
      </section>

      <section className="rounded-lg border bg-white p-4 dark:bg-black">
        <div className="flex items-center justify-between">
          <h2 className="font-semibold">Турниры</h2>
          <button className="text-sm text-zinc-600 hover:underline dark:text-zinc-300" onClick={load}>
            Обновить
          </button>
        </div>

        <div className="mt-3 space-y-2">
          {tournaments.map((t) => (
            <div key={t.id} className="rounded-md border p-3">
              <div className="flex items-center justify-between gap-3">
                <Link href={`/tournaments/${t.id}`} className="font-medium hover:underline">
                  {t.name}
                </Link>
                <div className="text-xs text-zinc-500">{getStatusText(t.status)}</div>
              </div>
              <div className="mt-2 flex gap-2">
                <button
                  className="rounded-md border px-3 py-1.5 text-xs hover:bg-zinc-50 dark:hover:bg-zinc-900"
                  onClick={async () => {
                    const res = await fetch(`/api/tournaments/${t.id}/start`, { method: "POST" });
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
    </div>
  );
}

