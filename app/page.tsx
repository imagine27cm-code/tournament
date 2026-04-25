"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

type TournamentSummary = {
  id: string;
  name: string;
  status: string;
  startDate: string;
  endDate: string;
  teamLimit: number;
};

type News = {
  id: string;
  title: string;
  content: string;
  tag: string;
  createdAt: string;
};

export default function Home() {
  const [tournaments, setTournaments] = useState<TournamentSummary[]>([]);
  const [news, setNews] = useState<News[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("ALL");

  const filteredTournaments = activeTab === "ALL"
    ? tournaments
    : tournaments.filter((t) => t.status === activeTab);

  useEffect(() => {
    async function load() {
      try {
        const [tRes, nRes] = await Promise.all([
          fetch("/api/tournaments", { cache: "no-store", credentials: "include" }),
          fetch("/api/news", { cache: "no-store", credentials: "include" }),
        ]);
        const tData = await tRes.json();
        const nData = await nRes.json();
        setTournaments(tData.tournaments ?? []);
        setNews(nData.news ?? []);
      } catch {
        setTournaments([]);
        setNews([]);
      } finally {
        setLoading(false);
      }
    }

    load();
  }, []);

  return (
    <div className="px-10 py-10">

      <div style={{ color: '#7a40ff', fontSize: '0.7rem', opacity: 0.6, marginBottom: '1rem', fontFamily: "'Orbitron', sans-serif" }}>BUILD v1.0.2</div>
      <h1 className="text-4xl font-bold mb-12 tracking-wide" style={{fontFamily: "'Rajdhani', sans-serif", color: '#ffffff', fontWeight: 700}}>Список ебанных турниров</h1>
      
      <div className="max-w-4xl">
        {/* Tabs */}
        <div className="flex gap-4 mb-6">
          {[
            { key: "ALL", label: "Все" },
            { key: "REGISTRATION", label: "Предстоящие" },
            { key: "ONGOING", label: "Активные" },
            { key: "COMPLETED", label: "Завершенные" },
          ].map((tab) => (
            <button
              key={tab.key}
              className="px-4 py-2 rounded text-sm font-medium"
              style={{
                background: activeTab === tab.key ? 'rgba(122, 64, 255, 0.2)' : 'transparent',
                color: activeTab === tab.key ? '#7a40ff' : '#8888aa',
                border: activeTab === tab.key ? '1px solid rgba(122, 64, 255, 0.4)' : '1px solid transparent',
                boxShadow: activeTab === tab.key ? '0 0 10px rgba(122, 64, 255, 0.15)' : 'none',
              }}
              onClick={() => setActiveTab(tab.key)}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Table Header */}
        <div className="grid grid-cols-4 gap-4 px-5 py-4" style={{color: '#7a88bb', fontFamily: "'Rajdhani', sans-serif", fontSize: '1.05rem', fontWeight: 50}}>
        </div>

        {/* Tournaments List */}
        <div>
          {loading ? (
            <div className="py-12 text-center" style={{color: '#666688', fontFamily: "'Rajdhani', sans-serif"}}>
              <p>Загрузка турниров...</p>
            </div>
          ) : filteredTournaments.length === 0 ? (
            <div className="py-12 text-center" style={{color: '#666688', fontFamily: "'Rajdhani', sans-serif"}}>
              <p>Пока нет турниров в этой категории</p>
            </div>
          ) : (
            filteredTournaments.map((t, index) => (
              <Link
                key={t.id}
                href={`/tournaments/${t.id}`}
                className="grid grid-cols-4 gap-4 px-5 py-4 transition-all hover:bg-opacity-50 block glow-border"
                style={{
                  background: index % 2 === 0 ? 'rgba(25, 25, 40, 0.6)' : 'rgba(30, 30, 48, 0.4)',
                  borderTop: '1px solid rgba(122, 64, 255, 0.1)',
                  fontFamily: "'Rajdhani', sans-serif",
                  fontSize: '1.1rem',
                  color: '#e8e8ff',
                  borderRadius: '8px',
                  marginBottom: '4px',
                  animation: `fadeInUp 0.5s cubic-bezier(0.4, 0, 0.2, 1) ${index * 0.08}s both`
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = 'rgba(55, 45, 75, 0.7)';
                  e.currentTarget.style.transform = 'scale(1.005) translateX(4px)';
                  e.currentTarget.style.boxShadow = '0 4px 20px rgba(122, 64, 255, 0.2)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = index % 2 === 0 ? 'rgba(25, 25, 40, 0.6)' : 'rgba(30, 30, 48, 0.4)';
                  e.currentTarget.style.transform = 'scale(1) translateX(0)';
                  e.currentTarget.style.boxShadow = 'none';
                }}
              >
                <div className="font-medium flex items-center gap-3">
                  <span style={{width: '16px', height: '16px', borderRadius: '3px', background: 'rgba(255, 192, 64, 0.3)'}}></span>
                  {t.name}
                </div>
                <div style={{color: '#aaaacc'}}>
                  {t.status}
                </div>
                <div style={{color: '#aaaacc'}}>
                  {t.teamLimit} слотов
                </div>
                <div className="font-medium" style={{color: '#7a40ff'}}>
                  ? / {t.teamLimit}
                </div>
              </Link>
            ))
          )}
        </div>
      </div>

      {/* === НОВОСТИ === */}
      <div className="mt-16 max-w-4xl">
        <h2 className="text-2xl font-bold mb-6 tracking-wide" style={{fontFamily: "'Rajdhani', sans-serif", color: '#ff00ff', fontWeight: 700, textShadow: '0 0 12px #ff00ff40'}}>ПОСЛЕДНИЕ НОВОСТИ</h2>

        <div className="space-y-4">
          {news.map((n) => {
            const styles: Record<string, { bg: string; color: string; border: string; shadow: string }> = {
              NEW: { bg: '#ff00ff30', color: '#ff00ff', border: '1px solid #ff00ff50', shadow: '0 0 15px rgba(255, 0, 255, 0.15)' },
              UPDATE: { bg: '#00f0ff30', color: '#00f0ff', border: '1px solid #00f0ff50', shadow: '0 0 12px rgba(0, 240, 255, 0.1)' },
              INFO: { bg: '#7a40ff30', color: '#7a40ff', border: '1px solid #7a40ff50', shadow: '0 0 10px rgba(122, 64, 255, 0.1)' },
            };
            const labels: Record<string, string> = {
              NEW: "🔥 НОВОЕ",
              UPDATE: "✅ ОБНОВЛЕНИЕ",
              INFO: "ℹ️ ИНФО",
            };
            const style = styles[n.tag] || styles.INFO;
            const label = labels[n.tag] || labels.INFO;

            return (
              <div key={n.id} className="cyber-card rounded-lg p-5" style={{border: style.border, boxShadow: style.shadow}}>
                <div className="flex items-center gap-3 mb-2">
                  <div className="text-[10px] px-2 py-0.5 rounded" style={{background: style.bg, color: style.color, border: style.border}}>{label}</div>
                  <div className="text-[11px]" style={{color: '#8888aa'}}>{new Date(n.createdAt).toLocaleDateString()}</div>
                </div>
                <h3 className="text-lg font-semibold mb-1" style={{color: '#e0e0ff'}}>{n.title}</h3>
                <p className="text-sm" style={{color: '#aaaacc'}}>{n.content}</p>
              </div>
            );
          })}
        </div>
      </div>
      
    </div>
  );
}
