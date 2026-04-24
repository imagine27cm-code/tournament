import { StatsClient } from "@/components/StatsClient";

export default function StatsPage() {
  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <h1
        className="text-2xl font-semibold tracking-tight"
        style={{ color: "#e0e0ff", fontFamily: "'Orbitron', sans-serif" }}
      >
        Статистика
      </h1>
      <p className="mt-1 text-sm" style={{ color: "#8888aa" }}>
        Топ игроков по рейтинговым очкам (RP), уровню и победам.
      </p>
      <div className="mt-6">
        <StatsClient />
      </div>
    </div>
  );
}
