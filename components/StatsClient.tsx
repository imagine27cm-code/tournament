"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

type Player = {
  id: string;
  name: string | null;
  email: string;
  rp: number;
  xp: number;
  level: number;
  wins: number;
  losses: number;
  bestWinStreak: number;
};

function getRankColor(index: number): { bg: string; border: string; glow: string; label: string; icon: string } {
  switch (index) {
    case 0:
      return { bg: "rgba(0, 240, 255, 0.12)", border: "rgba(0, 240, 255, 0.5)", glow: "0 0 20px rgba(0, 240, 255, 0.3)", label: "АЛМАЗ", icon: "💎" };
    case 1:
      return { bg: "rgba(255, 215, 0, 0.12)", border: "rgba(255, 215, 0, 0.5)", glow: "0 0 15px rgba(255, 215, 0, 0.25)", label: "ЗОЛОТО", icon: "🥇" };
    case 2:
      return { bg: "rgba(192, 192, 192, 0.12)", border: "rgba(192, 192, 192, 0.5)", glow: "0 0 12px rgba(192, 192, 192, 0.2)", label: "СЕРЕБРО", icon: "🥈" };
    default:
      return { bg: "rgba(205, 127, 50, 0.08)", border: "rgba(205, 127, 50, 0.3)", glow: "none", label: "", icon: "" };
  }
}

function WinRate({ w, l }: { w: number; l: number }) {
  const total = w + l;
  if (total === 0) return <span style={{ color: "#8888aa" }}>—</span>;
  const pct = Math.round((w / total) * 100);
  return <span style={{ color: pct >= 60 ? "#00ff88" : pct >= 40 ? "#ffff00" : "#ff0044" }}>{pct}%</span>;
}

export function StatsClient() {
  const [players, setPlayers] = useState<Player[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/players/top", { cache: "no-store" })
      .then((r) => r.json())
      .then((d) => {
        setPlayers(d.players ?? []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  if (loading) {
    return <div className="text-center text-sm" style={{ color: "#8888aa" }}>Загрузка статистики...</div>;
  }

  return (
    <div className="mx-auto max-w-3xl">
      <h1
        className="mb-6 text-center text-lg font-semibold uppercase tracking-wider"
        style={{ color: "#00f0ff", fontFamily: "'Orbitron', sans-serif", textShadow: "0 0 12px #00f0ff40" }}
      >
        Топ игроков по RP
      </h1>

      <div className="space-y-3">
        {players.map((p, i) => {
          const rank = getRankColor(i);
          const isTop3 = i < 3;

          return (
            <div
              key={p.id}
              className="flex items-center gap-3 rounded-lg p-3"
              style={{
                background: isTop3 ? rank.bg : "rgba(26, 26, 46, 0.5)",
                border: `1px solid ${isTop3 ? rank.border : "rgba(122, 64, 255, 0.1)"}`,
                boxShadow: isTop3 ? rank.glow : "none",
                transform: isTop3 ? "scale(1.02)" : "scale(1)",
              }}
            >
              {/* Место / Ленточка */}
              <div
                className="flex shrink-0 flex-col items-center justify-center rounded-md px-2 py-1 text-center"
                style={{
                  minWidth: "3rem",
                  background: isTop3 ? rank.border : "transparent",
                  border: isTop3 ? "none" : `1px solid rgba(122, 64, 255, 0.2)`,
                }}
              >
                <div className="text-lg">{isTop3 ? rank.icon : i + 1}</div>
                {isTop3 && (
                  <div className="text-[8px] font-bold uppercase tracking-wider" style={{ color: "#fff" }}>
                    {rank.label}
                  </div>
                )}
              </div>

              {/* Инфо игрока */}
              <div className="min-w-0 flex-1">
                <Link
                  href={`/profile/${p.id}`}
                  className="block truncate text-sm font-medium hover:underline"
                  style={{ color: isTop3 ? "#fff" : "#e0e0ff" }}
                >
                  {p.name ?? "Без имени"}
                </Link>
                <div className="mt-0.5 flex flex-wrap gap-x-3 text-[10px]" style={{ color: "#8888aa" }}>
                  <span>RP: <strong style={{ color: "#00f0ff" }}>{p.rp}</strong></span>
                  <span>LVL: <strong style={{ color: "#ffff00" }}>{p.level}</strong></span>
                  <span>W: <strong style={{ color: "#00ff88" }}>{p.wins}</strong></span>
                  <span>L: <strong style={{ color: "#ff0044" }}>{p.losses}</strong></span>
                  <span>WR: <WinRate w={p.wins} l={p.losses} /></span>
                  {p.bestWinStreak > 2 && (
                    <span style={{ color: "#ff00ff" }}>🔥 {p.bestWinStreak}</span>
                  )}
                </div>
              </div>

              {/* RP справа */}
              <div className="shrink-0 text-right">
                <div className="text-sm font-bold" style={{ color: isTop3 ? "#00f0ff" : "#e0e0ff" }}>
                  {p.rp}
                </div>
                <div className="text-[9px]" style={{ color: "#8888aa" }}>RP</div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
