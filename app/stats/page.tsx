import { StatsClient } from "@/components/StatsClient";

export default function StatsPage() {
  return (
    <div className="mx-auto max-w-6xl px-6 py-10">
      <h1
        className="text-4xl font-bold tracking-wide flex items-center gap-3"
        style={{ color: "#ffffff", fontFamily: "'Orbitron', sans-serif" }}
      >
        <span style={{ color: '#A6FF00' }}>▌</span> СТАТИСТИКА
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
