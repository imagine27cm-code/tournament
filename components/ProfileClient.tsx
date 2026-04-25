"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { toast } from "sonner";

const SHOP_ITEMS: Record<string, {
  id: string;
  name: string;
  type: string;
  price: number;
  value: string;
  description: string;
  icon: string;
}> = {
  NAME_RED: { id: "NAME_RED", name: "Красный ник", type: "NAMETAG_COLOR", price: 500, value: "#ff0044", description: "", icon: "🔴" },
  NAME_GREEN: { id: "NAME_GREEN", name: "Зеленый ник", type: "NAMETAG_COLOR", price: 500, value: "#00ff88", description: "", icon: "🟢" },
  NAME_CYAN: { id: "NAME_CYAN", name: "Циановый ник", type: "NAMETAG_COLOR", price: 750, value: "#00f0ff", description: "", icon: "🔵" },
  NAME_PURPLE: { id: "NAME_PURPLE", name: "Фиолетовый ник", type: "NAMETAG_COLOR", price: 750, value: "#7a40ff", description: "", icon: "🟣" },
  NAME_GOLD: { id: "NAME_GOLD", name: "Золотой ник", type: "NAMETAG_COLOR", price: 2000, value: "#ffc800", description: "", icon: "🥇" },
  NAME_RAINBOW: { id: "NAME_RAINBOW", name: "Радужный ник", type: "NAMETAG_COLOR", price: 5000, value: "rainbow", description: "", icon: "🌈" },
  BANNER_BLUE: { id: "BANNER_BLUE", name: "Синий баннер", type: "PROFILE_BANNER", price: 300, value: "linear-gradient(135deg, #00f0ff 0%, #0066ff 100%)", description: "", icon: "🌊" },
  BANNER_PURPLE: { id: "BANNER_PURPLE", name: "Фиолетовый баннер", type: "PROFILE_BANNER", price: 300, value: "linear-gradient(135deg, #7a40ff 0%, #ff00ff 100%)", description: "", icon: "🌌" },
  FRAME_GOLD: { id: "FRAME_GOLD", name: "Золотая рамка", type: "AVATAR_FRAME", price: 1000, value: "#ffc800", description: "", icon: "✨" },
  FRAME_DIAMOND: { id: "FRAME_DIAMOND", name: "Алмазная рамка", type: "AVATAR_FRAME", price: 2500, value: "#00f0ff", description: "", icon: "💎" },
  TITLE_WARRIOR: { id: "TITLE_WARRIOR", name: "Титул Воин", type: "TITLE", price: 1500, value: "⚔️ Воин", description: "", icon: "⚔️" },
};

type InventoryItem = {
  id: string;
  itemId: string;
  purchasedAt: Date;
}

type UserProfile = {
  id: string;
  name: string | null;
  email: string | null;
  rp: number;
  wins: number;
  losses: number;
  createdAt: Date;
  team?: {
    id: string;
    name: string;
    captainId: string;
    members?: { id: string; name: string | null }[];
  } | null;
  _count?: any;
  activeNameColor: string | null;
  activeBanner: string | null;
  activeAvatarFrame: string | null;
  activeTitle: string | null;
  inventory: InventoryItem[];
  coins: number;
};

export function ProfileClient({
  user,
  currentUserId,
  showEmail
}: {
  user: UserProfile;
  currentUserId: string | null;
  showEmail: boolean;
}) {
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  const isOwner = currentUserId === user.id;
  const isTeamCaptain = user.team?.captainId === currentUserId;
  const isInSameTeam = user.team && user.team.id === user.team.id;

  async function kickFromTeam() {
    if (!user.team) return;
    setLoading(true);
    setMsg(null);

    try {
      const res = await fetch(`/api/teams/${user.team.id}/members/${user.id}`, {
        method: "DELETE",
        credentials: "include"
      });

      if (!res.ok) throw new Error();

      setMsg("✅ Игрок кикнут из команды");
    } catch {
      setMsg("❌ Ошибка кика");
    } finally {
      setLoading(false);
    }
  }

  async function leaveTeam() {
    if (!user.team) return;
    setLoading(true);
    setMsg(null);

    try {
      const res = await fetch(`/api/teams/${user.team.id}/leave`, {
        method: "POST",
        credentials: "include"
      });

      if (!res.ok) throw new Error();

      setMsg("✅ Вы покинули команду");
    } catch {
      setMsg("❌ Ошибка выхода");
    } finally {
      setLoading(false);
    }
  }

  const winrate = user.wins + user.losses > 0
    ? Math.round((user.wins / (user.wins + user.losses)) * 100)
    : 0;

  return (
    <div className="space-y-6">
      {/* Карточка профиля */}
      <div className="cyber-card rounded-xl p-6" style={{
        background: user.activeBanner && SHOP_ITEMS[user.activeBanner] 
          ? SHOP_ITEMS[user.activeBanner].value 
          : undefined
      }}>
        <div className="flex flex-wrap gap-6 items-start">
          <div
            className="w-24 h-24 rounded-xl flex items-center justify-center text-3xl font-bold"
            style={{ 
              background: user.activeAvatarFrame && SHOP_ITEMS[user.activeAvatarFrame]
                ? SHOP_ITEMS[user.activeAvatarFrame].value
                : 'linear-gradient(135deg, #7a40ff 0%, #00f0ff 100%)', 
              color: '#fff',
              boxShadow: user.activeAvatarFrame ? `0 0 12px ${SHOP_ITEMS[user.activeAvatarFrame].value}` : undefined,
              border: user.activeAvatarFrame ? '2px solid' : undefined,
              borderColor: user.activeAvatarFrame && SHOP_ITEMS[user.activeAvatarFrame] ? SHOP_ITEMS[user.activeAvatarFrame].value : undefined
            }}
          >
            {(user.name ?? "A")[0].toUpperCase()}
          </div>

          <div className="flex-1 min-w-0">
            <h1
              className="text-2xl font-bold"
              style={{ 
                fontFamily: "'Rajdhani', sans-serif",
                color: user.activeNameColor && SHOP_ITEMS[user.activeNameColor]
                  ? SHOP_ITEMS[user.activeNameColor].value
                  : '#ffffff',
                textShadow: user.activeNameColor === 'NAME_RAINBOW' 
                  ? '0 0 10px rgba(255,255,255,0.5)' 
                  : user.activeNameColor 
                    ? `0 0 8px ${SHOP_ITEMS[user.activeNameColor].value}` 
                    : undefined
              }}
            >
              {user.activeTitle && SHOP_ITEMS[user.activeTitle] 
                ? `${SHOP_ITEMS[user.activeTitle].value} ` 
                : ''
              }
              {user.name ?? "Без имени"}
            </h1>

            {showEmail && user.email && (
              <p className="text-sm mt-1" style={{ color: '#8888aa' }}>
                {user.email}
              </p>
            )}

            <div className="mt-4 flex flex-wrap gap-4">
              <div>
                <div className="text-xs" style={{ color: '#7a40ff' }}>RP РЕЙТИНГ</div>
                <div className="text-2xl font-bold" style={{ color: '#7a40ff', fontFamily: "'Orbitron', sans-serif" }}>
                  {user.rp}
                </div>
              </div>

              <div>
                <div className="text-xs" style={{ color: '#8888aa' }}>ПОБЕД</div>
                <div className="text-xl font-bold" style={{ color: '#00ff88' }}>{user.wins}</div>
              </div>

              <div>
                <div className="text-xs" style={{ color: '#8888aa' }}>ПОРАЖЕНИЙ</div>
                <div className="text-xl font-bold" style={{ color: '#ff4444' }}>{user.losses}</div>
              </div>


              <div>
                <div className="text-xs" style={{ color: '#8888aa' }}>WINRATE</div>
                <div className="text-xl font-bold" style={{ color: '#00f0ff' }}>{winrate}%</div>
              </div>
            </div>
          </div>
        </div>

        {/* Команда */}
        {user.team && (
          <div className="mt-6 pt-4" style={{ borderTop: '1px solid rgba(122, 64, 255, 0.2)' }}>
            <div className="text-xs mb-2" style={{ color: '#8888aa' }}>КОМАНДА</div>
            <div className="flex items-center justify-between flex-wrap gap-3">
              <Link
                href={`/teams/${user.team.id}`}
                className="text-xl font-semibold neon-link"
                style={{ color: '#00f0ff' }}
              >
                {user.team.name}
              </Link>

              <div className="flex flex-wrap gap-2">
                {isTeamCaptain && !isOwner && (
                  <button
                    className="neon-button-red text-xs"
                    style={{ padding: '0.4rem 0.8rem', borderRadius: '4px' }}
                    onClick={kickFromTeam}
                    disabled={loading}
                  >
                    Кикнуть из команды
                  </button>
                )}

                {isOwner && (
                  <button
                    className="neon-button text-xs"
                    style={{ padding: '0.4rem 0.8rem', borderRadius: '4px' }}
                    onClick={leaveTeam}
                    disabled={loading}
                  >
                    Выйти из команды
                  </button>
                )}
              </div>
            </div>

            <div className="mt-2 text-sm" style={{ color: '#aaaacc' }}>
              Участников: {user.team.members?.length ?? '?'}
            </div>
          </div>
        )}

        {msg && (
          <div className="mt-4 text-sm" style={{ color: msg.includes('✅') ? '#00ff88' : '#ff4444' }}>
            {msg}
          </div>
        )}
      </div>

      {/* Инвентарь */}
      {isOwner && user.inventory.length > 0 && (
        <div className="cyber-card rounded-xl p-6">
          <div className="text-xs mb-4" style={{ color: '#8888aa' }}>ИНВЕНТАРЬ</div>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {user.inventory.map((item) => {
              const config = SHOP_ITEMS[item.itemId];
              if (!config) return null;

              const isActive = 
                config.type === 'NAMETAG_COLOR' && user.activeNameColor === item.itemId ||
                config.type === 'PROFILE_BANNER' && user.activeBanner === item.itemId ||
                config.type === 'AVATAR_FRAME' && user.activeAvatarFrame === item.itemId ||
                config.type === 'TITLE' && user.activeTitle === item.itemId;

              async function equip() {
                try {
                  setLoading(true);
                  const res = await fetch('/api/shop/equip', {
                    method: 'POST',
                    headers: { 'content-type': 'application/json' },
                    credentials: 'include',
                    body: JSON.stringify({ 
                      itemId: item.itemId,
                      action: isActive ? 'unequip' : 'equip'
                    })
                  });

                  if (res.ok) {
                    toast.success(isActive ? 'Предмет снят' : 'Предмет надет');
                    window.location.reload();
                  }
                } catch {
                  toast.error('Ошибка');
                } finally {
                  setLoading(false);
                }
              }

              return (
                <div 
                  key={item.id} 
                  className="p-4 rounded-lg" 
                  style={{ 
                    background: isActive ? 'rgba(0, 255, 136, 0.1)' : 'rgba(122, 64, 255, 0.05)',
                    border: isActive ? '1px solid #00ff88' : '1px solid rgba(122, 64, 255, 0.2)'
                  }}
                >
                  <div className="mb-2">
                    <span className="text-2xl">{config.icon}</span>
                  </div>
                  <div className="font-semibold" style={{ color: config.type === 'NAMETAG_COLOR' ? config.value : '#e0e0ff' }}>
                    {config.name}
                  </div>
                  <button
                    className="mt-3 text-xs neon-button w-full"
                    style={{ padding: '0.3rem 0.6rem' }}
                    onClick={equip}
                    disabled={loading}
                  >
                    {isActive ? 'Снять' : 'Надеть'}
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}

    </div>
  );
}