"use client";

/* eslint-disable react-hooks/set-state-in-effect */

import { useEffect, useMemo, useState } from "react";
import { useSession } from "next-auth/react";
import { getSocket } from "@/lib/socketClient";

type TeamDto = { id: string; name: string; captainId: string };
type MapDto = { id: string; name: string };
type BanDto = { mapId: string; teamId: string; banOrder: number };
type GameDto = {
  id: string;
  gameNumber: number;
  mapId: string;
  winnerTeamId: string | null;
  completedAt: string | null;
  map?: MapDto;
};
type MatchDto = {
  id: string;
  status: "SCHEDULED" | "BANNING" | "READY" | "IN_PROGRESS" | "FINISHED";
  tournamentId: string;
  homeTeamId: string;
  awayTeamId: string;
  homeReady: boolean;
  awayReady: boolean;
  winnerTeamId: string | null;
  banTurnTeamId: string | null;
  banTurnEndsAt: string | null;
  homeTeam: TeamDto;
  awayTeam: TeamDto;
  bans: BanDto[];
  games: GameDto[];
  tournament: { maps: MapDto[] };
};

function getMatchStatusText(status: string): string {
  const map: Record<string, string> = {
    SCHEDULED: "Запланирован",
    BANNING: "Баны карт",
    READY: "Готов к началу",
    IN_PROGRESS: "Идет",
    FINISHED: "Завершен",
  };
  return map[status] ?? status;
}

function getReadyText(ready: boolean): string {
  return ready ? "✅ Готов" : "⏳ Не готов";
}

export function MatchClient({ matchId }: { matchId: string }) {
  const { data } = useSession();
  const [match, setMatch] = useState<MatchDto | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [nowMs, setNowMs] = useState<number>(() => Date.now());

  async function load() {
    const res = await fetch(`/api/matches/${matchId}`, { cache: "no-store" });
    if (!res.ok) {
      setErr("Не удалось загрузить матч.");
      return;
    }
    const d = (await res.json()) as { match: MatchDto };
    setMatch(d.match ?? null);
    setErr(null);
  }

  useEffect(() => {
    load();
    const socket = getSocket();
    socket.emit("joinMatch", matchId);
    const onUpdate = (payload: unknown) => {
      const p = payload as { matchId?: string } | null;
      if (p?.matchId === matchId) load();
    };
    socket.on("match:update", onUpdate);

    // Fallback polling (if WS blocked) at low rate.
    const t = setInterval(load, 4000);
    return () => {
      clearInterval(t);
      socket.off("match:update", onUpdate);
      socket.emit("leaveMatch", matchId);
    };
  }, [matchId]);

  useEffect(() => {
    const t = setInterval(() => setNowMs(Date.now()), 500);
    return () => clearInterval(t);
  }, []);

  const userId = data?.user?.id;

  const isHomeCaptain = match && userId && match.homeTeam?.captainId === userId;
  const isAwayCaptain = match && userId && match.awayTeam?.captainId === userId;
  const myTeamId = isHomeCaptain ? match?.homeTeamId : isAwayCaptain ? match?.awayTeamId : null;

  const games = match?.games ?? [];
  const bans = match?.bans ?? [];
  const maps = match?.tournament?.maps ?? [];

  const seriesScore = useMemo(() => {
    const homeWins = games.filter((g) => g.winnerTeamId === match?.homeTeamId).length;
    const awayWins = games.filter((g) => g.winnerTeamId === match?.awayTeamId).length;
    return { homeWins, awayWins };
  }, [games, match?.homeTeamId, match?.awayTeamId]);

  const currentGame = useMemo(() => games.find((g) => !g.completedAt) ?? null, [games]);
  const bannedIds = useMemo(() => new Set(bans.map((b) => b.mapId)), [bans]);
  const usedMapIds = useMemo(() => new Set(games.map((g) => g.mapId)), [games]);

  const remainingForPick = useMemo(() => {
    const exclude = new Set<string>([...bannedIds, ...usedMapIds]);
    return maps.filter((m) => !exclude.has(m.id));
  }, [maps, bannedIds, usedMapIds]);

  const [nextMapId, setNextMapId] = useState<string>("");

  useEffect(() => {
    setNextMapId(remainingForPick[0]?.id ?? "");
  }, [remainingForPick.length]);

  if (err) {
    return <div className="rounded-lg border bg-white p-4 text-sm dark:bg-black">{err}</div>;
  }
  if (!match) {
    return <div className="rounded-lg border bg-white p-4 text-sm dark:bg-black">Загрузка...</div>;
  }

  const canReady = !!(isHomeCaptain || isAwayCaptain) && match.status === "SCHEDULED";
  const canBan = !!myTeamId && match.status === "BANNING" && match.banTurnTeamId === myTeamId;
  const banMsLeft = match.banTurnEndsAt
    ? Math.max(0, new Date(match.banTurnEndsAt).getTime() - nowMs)
    : 0;
  const banSecLeft = Math.ceil(banMsLeft / 1000);

  return (
    <div className="space-y-6">
      <section className="rounded-lg border p-4" style={{ background: 'rgba(26, 26, 46, 0.95)', borderColor: 'rgba(0, 240, 255, 0.2)' }}>
        <div className="grid grid-cols-3 items-center gap-2">
          <div className="text-left">
            <div className="text-sm text-zinc-500">Слева</div>
            <div className="text-lg font-semibold">{match.homeTeam.name}</div>
            <div className="mt-1 text-xs text-zinc-500">{getReadyText(match.homeReady)}</div>
          </div>
          <div className="text-center">
            <div className="text-xs text-zinc-500">Статус</div>
            <div className="text-sm font-semibold">{getMatchStatusText(match.status)}</div>
            <div className="mt-2 text-2xl font-semibold tabular-nums">
              {seriesScore.homeWins}:{seriesScore.awayWins}
            </div>
            <div className="mt-1 text-xs text-zinc-500">BO3 до 2 побед</div>
          </div>
          <div className="text-right">
            <div className="text-sm text-zinc-500">Справа</div>
            <div className="text-lg font-semibold">{match.awayTeam.name}</div>
            <div className="mt-1 text-xs text-zinc-500">{getReadyText(match.awayReady)}</div>
          </div>
        </div>

        <div className="mt-4 flex flex-wrap gap-2">
          {canReady ? (
            <button
              className="rounded-md bg-black px-3 py-2 text-sm text-white dark:bg-white dark:text-black"
              onClick={async () => {
                await fetch(`/api/matches/${matchId}/ready`, {
                  method: "POST",
                  headers: { "content-type": "application/json" },
                  body: JSON.stringify({ ready: true }),
                });
                await load();
              }}
            >
              Готов
            </button>
          ) : null}

          {(isHomeCaptain || isAwayCaptain) && match.status === "SCHEDULED" ? (
            <button
              className="rounded-md border px-3 py-2 text-sm hover:bg-zinc-50 dark:hover:bg-zinc-900"
              onClick={async () => {
                await fetch(`/api/matches/${matchId}/ready`, {
                  method: "POST",
                  headers: { "content-type": "application/json" },
                  body: JSON.stringify({ ready: false }),
                });
                await load();
              }}
            >
              Не готов
            </button>
          ) : null}

          {match.status === "FINISHED" ? (
            <div className="text-sm text-zinc-600 dark:text-zinc-300">
              Победитель:{" "}
              <span className="font-semibold">
                {match.winnerTeamId === match.homeTeamId ? match.homeTeam.name : match.awayTeam.name}
              </span>
            </div>
          ) : null}
        </div>
      </section>

      <section className="rounded-lg border p-4" style={{ background: 'rgba(26, 26, 46, 0.95)', borderColor: 'rgba(0, 240, 255, 0.2)' }}>
        <h2 className="font-semibold">Карты серии</h2>
        <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-3">
          {[1, 2, 3].map((n) => {
            const g = games.find((x) => x.gameNumber === n);
            const mapName = g?.map?.name;
            const mapImage = mapName ? `/maps/${mapName}.png` : null;
            // Проверяем возможные расширения
            const imageExtensions = ['.png', '.jpg', '.jpeg', '.webp'];
            const possibleImages = imageExtensions.map(ext => `/maps/${mapName}${ext}`);
            return (
              <div key={n} className="rounded-md border p-3">
                <div className="text-xs text-zinc-500">Игра {n}</div>
                <div className="mt-1 text-sm font-semibold">{mapName || "—"}</div>
                {mapName && (
                  <div className="mt-2 overflow-hidden rounded-md">
                    <img
                      src={`/maps/${mapName}.png`}
                      alt={mapName}
                      className="w-full object-cover"
                      style={{ height: '120px' }}
                      onError={(e) => {
                        // Пробуем другие расширения
                        const img = e.target as HTMLImageElement;
                        for (const ext of ['.jpg', '.jpeg', '.webp']) {
                          const testImg = new Image();
                          testImg.src = `/maps/${mapName}${ext}`;
                          if (testImg.complete) {
                            img.src = testImg.src;
                            return;
                          }
                        }
                        img.style.display = 'none';
                      }}
                    />
                  </div>
                )}
                <div className="mt-2 text-xs text-zinc-500">
                  {g?.winnerTeamId
                    ? `Победитель: ${g.winnerTeamId === match.homeTeamId ? match.homeTeam.name : match.awayTeam.name}`
                    : "Не сыграно"}
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {match.status === "BANNING" ? (
        <section className="rounded-lg border p-4" style={{ background: 'rgba(26, 26, 46, 0.95)', borderColor: 'rgba(0, 240, 255, 0.2)' }}>
          <div className="flex items-center justify-between gap-3">
            <h2 className="font-semibold">Баны перед BO3</h2>
            <div className="text-xs text-zinc-500">
              Ход: {match.banTurnTeamId === match.homeTeamId ? match.homeTeam.name : match.awayTeam.name} •{" "}
              {banSecLeft}s
            </div>
          </div>
          <div className="mt-2 text-sm text-zinc-600 dark:text-zinc-300">
            Очерёдность: Team1 бан 1 → Team2 бан 2 → Team1 бан 1 (всего 4).
          </div>
          <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-5">
            {maps.map((m) => {
              const isBanned = bannedIds.has(m.id);
              return (
                <button
                  key={m.id}
                  disabled={!canBan || isBanned}
                  onClick={async () => {
                    await fetch(`/api/matches/${matchId}/ban`, {
                      method: "POST",
                      headers: { "content-type": "application/json" },
                      body: JSON.stringify({ mapId: m.id }),
                    });
                    await load();
                  }}
                  className={[
                    "rounded-md border overflow-hidden transition-all",
                    isBanned ? "opacity-40 line-through" : "hover:scale-[1.02]",
                    !canBan ? "cursor-not-allowed" : "cursor-pointer",
                  ].join(" ")}
                  title={isBanned ? "Забанено" : canBan ? "Нажмите, чтобы забанить" : "Не ваш ход"}
                >
                  <img
                    src={`/maps/${m.name}.png`}
                    alt={m.name}
                    className="w-full object-cover"
                    style={{ height: '80px' }}
                    onError={(e) => {
                      for (const ext of ['.jpg', '.jpeg', '.webp']) {
                        const testImg = new Image();
                        testImg.src = `/maps/${m.name}${ext}`;
                        if (testImg.complete) {
                          (e.target as HTMLImageElement).src = testImg.src;
                          return;
                        }
                      }
                    }}
                  />
                  <div className="p-2 text-xs text-center" style={{ background: 'rgba(0, 0, 0, 0.8)', color: '#e0e0ff' }}>
                    {m.name}
                  </div>
                </button>
              );
            })}
          </div>
          <div className="mt-3 text-xs text-zinc-500">
            Сейчас забанено: {bans.length}/4
          </div>
        </section>
      ) : null}

      {match.status === "IN_PROGRESS" ? (
        <section className="rounded-lg border p-4" style={{ background: 'rgba(26, 26, 46, 0.95)', borderColor: 'rgba(0, 240, 255, 0.2)' }}>
          <div className="flex items-center justify-between gap-3">
            <h2 className="font-semibold">Текущая игра</h2>
            <div className="text-xs text-zinc-500">Game #{currentGame?.gameNumber ?? "—"}</div>
          </div>

          {currentGame ? (
            <>
              <div className="mt-2 text-sm">
                Карта: <span className="font-semibold">{currentGame.map?.name}</span>
              </div>

              {(isHomeCaptain || isAwayCaptain) ? (
                <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-3">
                  <button
                    className="rounded-md border px-3 py-2 text-sm hover:bg-zinc-50 dark:hover:bg-zinc-900"
                    onClick={async () => {
                      await fetch(`/api/matches/${matchId}/report-game`, {
                        method: "POST",
                        headers: { "content-type": "application/json" },
                        body: JSON.stringify({ gameNumber: currentGame.gameNumber, winnerTeamId: match.homeTeamId, nextMapId }),
                      });
                      await load();
                    }}
                  >
                    Победа: {match.homeTeam.name}
                  </button>
                  <button
                    className="rounded-md border px-3 py-2 text-sm hover:bg-zinc-50 dark:hover:bg-zinc-900"
                    onClick={async () => {
                      await fetch(`/api/matches/${matchId}/report-game`, {
                        method: "POST",
                        headers: { "content-type": "application/json" },
                        body: JSON.stringify({ gameNumber: currentGame.gameNumber, winnerTeamId: match.awayTeamId, nextMapId }),
                      });
                      await load();
                    }}
                  >
                    Победа: {match.awayTeam.name}
                  </button>

                  <div className="rounded-md border p-3">
                    <div className="text-xs text-zinc-500">Следующая карта (если нужна)</div>
                    <select
                      className="mt-2 w-full rounded-md border bg-transparent px-2 py-2 text-sm"
                      value={nextMapId}
                      onChange={(e) => setNextMapId(e.target.value)}
                    >
                      {remainingForPick.map((m) => (
                        <option key={m.id} value={m.id}>
                          {m.name}
                        </option>
                      ))}
                    </select>
                    <div className="mt-2 text-xs text-zinc-500">
                      По ТЗ выбирает проигравшая команда; в прототипе выбор можно указать при репорте.
                    </div>
                  </div>
                </div>
              ) : (
                <div className="mt-3 text-sm text-zinc-600 dark:text-zinc-300">
                  Репорт доступен капитанам.
                </div>
              )}
            </>
          ) : (
            <div className="mt-2 text-sm text-zinc-600 dark:text-zinc-300">Ожидаем следующую игру...</div>
          )}
        </section>
      ) : null}
    </div>
  );
}

