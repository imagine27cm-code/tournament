"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import Link from "next/link";

type TeamDto = {
  id: string;
  name: string;
  members?: Array<{ id: string }>;
};

export function TournamentActions({
  tournamentId,
  tournamentStatus,
}: {
  tournamentId: string;
  tournamentStatus: string;
}) {
  const { data } = useSession();
  const role = data?.user?.role;

  const [teams, setTeams] = useState<TeamDto[]>([]);
  const [teamId, setTeamId] = useState<string>("");
  const [msg, setMsg] = useState<string | null>(null);

  useEffect(() => {
    if (!data?.user?.id) return;
    fetch("/api/teams", { cache: "no-store" })
      .then((r) => r.json())
      .then((d: { teams?: TeamDto[] }) => {
        setTeams(d.teams ?? []);
        setTeamId(d.teams?.[0]?.id ?? "");
      })
      .catch(() => {});
  }, [data?.user?.id]);

  return (
    <div className="mt-3 space-y-3">
      {!data?.user?.id ? (
        <div className="text-sm text-zinc-600 dark:text-zinc-300">
          Чтобы зарегистрировать команду, нужно{" "}
          <Link className="underline" href="/signin">
            войти
          </Link>
          .
        </div>
      ) : (
        <div className="rounded-md border p-3">
          <div className="text-sm font-semibold">Регистрация команды</div>
          <div className="mt-2 text-xs text-zinc-500">
            Только капитан может подать заявку. Минимум 2 игрока в команде.
          </div>
          <div className="mt-2 flex gap-2">
            <select
              className="flex-1 rounded-md border bg-transparent px-2 py-2 text-sm"
              value={teamId}
              onChange={(e) => setTeamId(e.target.value)}
            >
              {teams.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name} ({t.members?.length ?? 0})
                </option>
              ))}
            </select>
            <button
              disabled={!teamId || tournamentStatus !== "REGISTRATION"}
              className="rounded-md bg-black px-3 py-2 text-sm text-white disabled:opacity-60 dark:bg-white dark:text-black"
              onClick={async () => {
                setMsg(null);
                const res = await fetch(`/api/tournaments/${tournamentId}/registrations`, {
                  method: "POST",
                  headers: { "content-type": "application/json" },
                  body: JSON.stringify({ teamId }),
                });
                const d = await res.json().catch(() => ({}));
                if (!res.ok) {
                  setMsg(d?.error ?? "Ошибка");
                  return;
                }
                setMsg("Заявка отправлена (ожидает утверждения админом).");
              }}
            >
              Подать
            </button>
          </div>
          {msg ? <div className="mt-2 text-xs text-zinc-600 dark:text-zinc-300">{msg}</div> : null}
          {tournamentStatus !== "REGISTRATION" ? (
            <div className="mt-2 text-xs text-zinc-500">Регистрация закрыта.</div>
          ) : null}
        </div>
      )}

      {role === "ADMIN" ? (
        <Link
          href="/admin"
          className="inline-flex rounded-md border px-3 py-2 text-sm hover:bg-zinc-50 dark:hover:bg-zinc-900"
        >
          Перейти в админ‑панель
        </Link>
      ) : null}
    </div>
  );
}

