"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from 'next/navigation';
import { motion } from "framer-motion";

// Демо данные
const tournaments = [
  { id: "1", name: "OPEN CUP 5X5", format: "5X5", mode: "подрыв", level: 30, date: "СЕГОДНЯ", time: "20:00", participants: 32, maxParticipants: 32, prize: "15 000 ₽", image: "https://images.unsplash.com/photo-1542751371-adc38448a05e?auto=format&fit=crop&q=80&w=200&h=120" },
  { id: "2", name: "SNIPER CUP 2X2", format: "2X2", mode: "мясорубка", level: 20, date: "ЗАВТРА", time: "18:00", participants: 16, maxParticipants: 16, prize: "7 500 ₽", image: "https://images.unsplash.com/photo-1538481199705-c710c4e965fc?auto=format&fit=crop&q=80&w=200&h=120" },
  { id: "3", name: "CLAN BATTLE LEAGUE", format: "5X5", mode: "подрыв", level: 30, date: "25 МАР", time: "19:00", participants: 24, maxParticipants: 24, prize: "50 000 ₽", image: "https://images.unsplash.com/photo-1552820728-8b83bb6b2b0f?auto=format&fit=crop&q=80&w=200&h=120" }
];

const topPlayers = [
  { rank: 1, nickname: "ShadowKill", points: 15780 },
  { rank: 2, nickname: "SniperPro", points: 12450 },
  { rank: 3, nickname: "GhostAim", points: 11230 },
  { rank: 4, nickname: "-КиберДемон-", points: 9860 },
  { rank: 5, nickname: "_Разор_", points: 8910 }
];

const topClans = [
  { rank: 1, name: "RAGE", points: 125340 },
  { rank: 2, name: "TITAN", points: 113290 },
  { rank: 3, name: "LEGION", points: 98760 },
  { rank: 4, name: "WARHEAD", points: 87410 },
  { rank: 5, name: "BLACKWOOD", points: 76230 }
];

const news = [
  { id: "1", title: "НОВЫЙ СЕЗОН ТУРНИРОВ УЖЕ СКОРО!", tag: "НОВЫЙ СЕЗОН", date: "18 МАР 2024", image: "https://images.unsplash.com/photo-1511512578047-d03b55e193e3?auto=format&fit=crop&q=80&w=400&h=200" },
  { id: "2", title: "ИЗМЕНЕНИЯ В ПРАВИЛАХ ТУРНИРОВ", tag: "ОБНОВЛЕНИЕ", date: "18 МАР 2024", image: "https://images.unsplash.com/photo-1550745165-9bc0b252726f?auto=format&fit=crop&q=80&w=400&h=200" },
  { id: "3", title: "РЕГИСТРАЦИЯ НА OPEN CUP ОТКРЫТА!", tag: "ТУРНИР", date: "17 МАР 2024", image: "https://images.unsplash.com/photo-1535223289827-42f1e9919769?auto=format&fit=crop&q=80&w=400&h=200" },
  { id: "4", title: "ИТОГИ ПРОШЛОГО КЛАНОВОГО СЕЗОНА", tag: "КИБЕРСПОРТ", date: "16 МАР 2024", image: "https://images.unsplash.com/photo-1542751110-97427bbecf20?auto=format&fit=crop&q=80&w=400&h=200" }
];

export default function Home() {
  const router = useRouter();
  const [tournaments, setTournaments] = useState<any[]>([]);
  const [topPlayers, setTopPlayers] = useState<any[]>([]);
  const [news, setNews] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [creatingParty, setCreatingParty] = useState(false);

  useEffect(() => {
    async function loadData() {
      try {
        const [tRes, pRes, nRes] = await Promise.all([
          fetch("/api/tournaments", { cache: "no-store" }),
          fetch("/api/players/top", { cache: "no-store" }),
          fetch("/api/news", { cache: "no-store" })
        ]);

        const tData = await tRes.json();
        const pData = await pRes.json();
        const nData = await nRes.json();

        setTournaments(tData.tournaments ?? []);
        setTopPlayers((pData.players ?? []).slice(0, 5));
        setNews((nData.news ?? []).slice(0, 4));
      } catch {
        setTournaments([]);
        setTopPlayers([]);
        setNews([]);
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, []);

  return (
    <div className="min-h-screen" style={{ background: '#050505' }}>
      {/* HERO SECTION */}
      <section className="relative overflow-hidden border-b border-[#1E2A25]">
        <div className="absolute inset-0 bg-gradient-to-r from-[#050505] via-transparent to-[#050505] opacity-90 z-10" />
        <div className="absolute inset-0" style={{ background: 'radial-gradient(circle at 70% 50%, rgba(166, 255, 0, 0.12) 0%, transparent 55%)' }} />
        
        <div className="container mx-auto px-6 py-16 relative z-20">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            <div className="lg:col-span-7">
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
                <h2 className="text-white text-3xl font-bold mb-1 tracking-wider" style={{ fontFamily: "'Orbitron', sans-serif" }}>WARFACE</h2>
                <h1 className="text-7xl font-black mb-6 tracking-tight" style={{ fontFamily: "'Russo One', sans-serif", color: '#A6FF00', textShadow: '0 0 60px rgba(166, 255, 0, 0.3)' }}>ТУРНИРЫ</h1>
                <p className="text-white text-2xl font-semibold mb-3" style={{ fontFamily: "'Exo 2', sans-serif" }}>Сражайся. Побеждай. Становись легендой.</p>
                <p className="text-[#8E9A94] text-lg mb-8 max-w-xl">Участвуй в официальных турнирах, собирай команду, поднимай рейтинг и выигрывай призовые!</p>

                <div className="flex gap-4 flex-wrap">
                  <motion.button
                    whileHover={{ scale: 1.03, boxShadow: '0 0 30px rgba(166, 255, 0, 0.4)' }}
                    whileTap={{ scale: 0.98 }}
                    className="px-8 py-4 font-bold text-lg tracking-wide"
                    style={{ background: '#A6FF00', color: '#050505', border: 'none', borderRadius: '2px' }}
                    disabled={creatingParty}
                    onClick={async () => {
                      setCreatingParty(true);
                      try {
                        const res = await fetch('/api/party/create', { method: 'POST' });
                        if (res.ok) {
                          const data = await res.json();
                          router.push(`/party/${data.partyId}`);
                        }
                      } catch (error) {
                        console.error('Create party error:', error);
                      } finally {
                        setCreatingParty(false);
                      }
                    }}
                  >
                    {creatingParty ? 'СОЗДАНИЕ...' : 'ИГРАТЬ →'}
                  </motion.button>
                  <motion.button whileHover={{ scale: 1.03, borderColor: '#A6FF00' }} whileTap={{ scale: 0.98 }} className="px-8 py-4 font-bold text-lg tracking-wide bg-transparent text-white" style={{ border: '1px solid #1E2A25', borderRadius: '2px' }}>
                    НАЙТИ ИГРУ
                  </motion.button>
                </div>
              </motion.div>
            </div>

            <div className="lg:col-span-5">
              <motion.div initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.6, delay: 0.2 }} className="p-6 rounded-md" style={{ background: '#101414', border: '1px solid #1E2A25' }}>
                <div className="flex items-center gap-2 mb-5">
                  <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                  <span className="text-white font-bold uppercase text-sm tracking-widest">Live матч</span>
                </div>

                <div className="grid grid-cols-3 gap-4 items-center">
                  <div className="text-center">
                    <div className="text-6xl mb-3">☠️</div>
                    <div className="text-white font-bold text-xl">RAGE</div>
                  </div>
                  <div className="text-center">
                    <div className="text-white text-5xl font-black">1 : 1</div>
                    <div className="text-[#8E9A94] text-sm mt-1">КАРТА: АНГАР 2.0</div>
                  </div>
                  <div className="text-center">
                    <div className="text-6xl mb-3">⚡</div>
                    <div className="text-white font-bold text-xl">TITAN</div>
                  </div>
                </div>

                <motion.button whileHover={{ background: '#1E2A25' }} className="w-full mt-6 py-3 text-white font-medium tracking-wide" style={{ border: '1px solid #1E2A25', borderRadius: '2px' }}>СМОТРЕТЬ</motion.button>
              </motion.div>
            </div>
          </div>
        </div>
      </section>

      {/* MAIN CONTENT */}
      <div className="container mx-auto px-6 py-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* LEFT COLUMN */}
          <div className="lg:col-span-8">
            {/* TOURNAMENTS LIST */}
            <section className="mb-12">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-white text-xl font-bold flex items-center gap-2"><span style={{ color: '#A6FF00' }}>▌</span> СПИСОК ТУРНИРОВ</h3>
                <Link href="/tournaments" className="text-sm font-medium" style={{ color: '#A6FF00' }}>ВСЕ ТУРНИРЫ →</Link>
              </div>

            <div className="space-y-3">
                {tournaments.map((tournament, index) => (
                  <Link key={tournament.id} href={`/tournaments/${tournament.id}`} style={{ display: 'block' }}>
                    <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.1 * index }} whileHover={{ scale: 1.008, boxShadow: '0 0 25px rgba(166, 255, 0, 0.1)', borderColor: '#A6FF00' }} className="p-4 rounded-md flex items-center gap-5" style={{ background: '#101414', border: '1px solid #1E2A25' }}>
                      <div className="flex-grow">
                        <div className="text-white font-bold text-lg mb-1">{tournament.name}</div>
                        <div className="text-[#8E9A94] text-sm">СТАТУС: {tournament.status}</div>
                      </div>
                      <div className="text-center min-w-[120px]">
                        <div className="text-white font-medium">{new Date(tournament.startDate).toLocaleDateString('ru-RU')}</div>
                        <div className="text-[#8E9A94] text-sm">{new Date(tournament.startDate).toLocaleTimeString('ru-RU', {hour: '2-digit', minute:'2-digit'})}</div>
                      </div>
                      <div className="text-center min-w-[100px]">
                        <div className="text-white font-medium">{tournament.teamLimit}</div>
                        <div className="text-[#8E9A94] text-sm">КОМАНД</div>
                      </div>
                      <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} className="px-5 py-2 font-bold text-sm" style={{ background: 'rgba(166, 255, 0, 0.1)', color: '#A6FF00', border: '1px solid #A6FF00', borderRadius: '2px' }}>ОТКРЫТЬ</motion.button>
                    </motion.div>
                  </Link>
                ))}
              </div>
            </section>

            {/* NEWS */}
            <section>
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-white text-xl font-bold flex items-center gap-2"><span style={{ color: '#A6FF00' }}>▌</span> ПОСЛЕДНИЕ НОВОСТИ</h3>
                <Link href="#" className="text-sm font-medium" style={{ color: '#A6FF00' }}>ВСЕ НОВОСТИ →</Link>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {news.map((item, index) => (
                  <motion.div key={item.id} initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.15 * index }} whileHover={{ y: -4, boxShadow: '0 10px 30px rgba(166, 255, 0, 0.08)', borderColor: '#A6FF00' }} className="rounded-md overflow-hidden" style={{ background: '#101414', border: '1px solid #1E2A25' }}>
                    <div className="h-28 relative overflow-hidden"><img src={item.image} alt="" className="w-full h-full object-cover" /></div>
                    <div className="p-4">
                      <div className="text-xs font-bold uppercase mb-2" style={{ color: '#A6FF00' }}>{item.tag}</div>
                      <div className="text-white font-medium mb-1">{item.title}</div>
                      <div className="text-[#8E9A94] text-xs">{item.date}</div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </section>
          </div>

          {/* RIGHT COLUMN */}
          <div className="lg:col-span-4 space-y-8">
            {/* TOP PLAYERS */}
            <section>
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-white text-xl font-bold flex items-center gap-2"><span style={{ color: '#A6FF00' }}>▌</span> ТОП ИГРОКОВ</h3>
                <Link href="/players" className="text-sm font-medium" style={{ color: '#A6FF00' }}>ВСЕ ИГРОКИ →</Link>
              </div>

            <div className="rounded-md overflow-hidden" style={{ background: '#101414', border: '1px solid #1E2A25' }}>
                {topPlayers.map((player, index) => (
                  <Link key={player.id} href={`/profile/${player.id}`} style={{ display: 'block' }}>
                    <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.4, delay: 0.1 * index }} whileHover={{ background: '#1A2020' }} className="px-4 py-3 flex items-center gap-4 border-b border-[#1E2A25] last:border-b-0">
                      <div className="w-6 text-center font-bold" style={{ color: index <= 2 ? '#A6FF00' : '#8E9A94' }}>{index + 1}</div>
                      <div className="w-8 h-8 rounded-full bg-[#1E2A25]" />
                      <div className="flex-grow text-white font-medium">{player.name}</div>
                      <div className="font-bold" style={{ color: '#A6FF00' }}>{player.rp.toLocaleString()}</div>
                    </motion.div>
                  </Link>
                ))}
              </div>
            </section>

            {/* TOP CLANS */}
            <section>
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-white text-xl font-bold flex items-center gap-2"><span style={{ color: '#A6FF00' }}>▌</span> ТОП КЛАНОВ</h3>
                <Link href="#" className="text-sm font-medium" style={{ color: '#A6FF00' }}>ВСЕ КЛАНЫ →</Link>
              </div>

              <div className="rounded-md overflow-hidden" style={{ background: '#101414', border: '1px solid #1E2A25' }}>
                {topClans.map((clan, index) => (
                  <motion.div key={clan.rank} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.4, delay: 0.1 * index }} whileHover={{ background: '#1A2020' }} className="px-4 py-3 flex items-center gap-4 border-b border-[#1E2A25] last:border-b-0">
                    <div className="w-6 text-center font-bold" style={{ color: clan.rank <= 3 ? '#A6FF00' : '#8E9A94' }}>{clan.rank}</div>
                    <div className="w-8 h-8 rounded bg-[#1E2A25]" />
                    <div className="flex-grow text-white font-medium">{clan.name}</div>
                    <div className="font-bold" style={{ color: '#A6FF00' }}>{clan.points.toLocaleString()}</div>
                  </motion.div>
                ))}
              </div>
            </section>

            {/* COMMUNITY */}
            <section>
              <h3 className="text-white text-xl font-bold flex items-center gap-2 mb-6"><span style={{ color: '#A6FF00' }}>▌</span> ПРИСОЕДИНЯЙСЯ К СООБЩЕСТВУ</h3>
              
              <div className="grid grid-cols-2 gap-3">
                {['DISCORD', 'TELEGRAM', 'VKONTAKTE', 'YOUTUBE'].map((social, index) => (
                  <motion.button key={social} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3, delay: 0.2 + index * 0.05 }} whileHover={{ borderColor: '#A6FF00', background: '#1A2020' }} className="py-3 text-white text-sm font-medium" style={{ background: '#101414', border: '1px solid #1E2A25', borderRadius: '2px' }}>
                    {social}
                  </motion.button>
                ))}
              </div>
            </section>
          </div>
        </div>
      </div>

      {/* FOOTER */}
      <footer className="border-t border-[#1E2A25] py-8 mt-12">
        <div className="container mx-auto px-6 text-center">
          <div className="text-[#8E9A94] text-sm">© 2024 WARFACE TOURNAMENTS. Все права защищены.</div>
        </div>
      </footer>
    </div>
  );
}