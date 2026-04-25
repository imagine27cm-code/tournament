"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";

type ShopItem = {
  id: string;
  name: string;
  type: string;
  price: number;
  value: string;
  description: string;
  icon: string;
};

const SHOP_ITEMS: Record<string, ShopItem> = {
  NAME_RED: {
    id: "NAME_RED",
    name: "Красный ник",
    type: "NAMETAG_COLOR",
    price: 500,
    value: "#ff0044",
    description: "Красный цвет ника в чате и списках",
    icon: "🔴",
  },
  NAME_GREEN: {
    id: "NAME_GREEN",
    name: "Зеленый ник",
    type: "NAMETAG_COLOR",
    price: 500,
    value: "#00ff88",
    description: "Зеленый цвет ника",
    icon: "🟢",
  },
  NAME_CYAN: {
    id: "NAME_CYAN",
    name: "Циановый ник",
    type: "NAMETAG_COLOR",
    price: 750,
    value: "#00f0ff",
    description: "Яркий циановый цвет ника",
    icon: "🔵",
  },
  NAME_PURPLE: {
    id: "NAME_PURPLE",
    name: "Фиолетовый ник",
    type: "NAMETAG_COLOR",
    price: 750,
    value: "#7a40ff",
    description: "Фиолетовый цвет ника",
    icon: "🟣",
  },
  NAME_GOLD: {
    id: "NAME_GOLD",
    name: "Золотой ник",
    type: "NAMETAG_COLOR",
    price: 2000,
    value: "#ffc800",
    description: "Премиум золотой цвет ника с эффектом свечения",
    icon: "🥇",
  },
  NAME_RAINBOW: {
    id: "NAME_RAINBOW",
    name: "Радужный ник",
    type: "NAMETAG_COLOR",
    price: 5000,
    value: "rainbow",
    description: "Анимированный радужный ник",
    icon: "🌈",
  },
  BANNER_BLUE: {
    id: "BANNER_BLUE",
    name: "Синий баннер",
    type: "PROFILE_BANNER",
    price: 300,
    value: "linear-gradient(135deg, #00f0ff 0%, #0066ff 100%)",
    description: "Голубой градиентный баннер профиля",
    icon: "🌊",
  },
  BANNER_PURPLE: {
    id: "BANNER_PURPLE",
    name: "Фиолетовый баннер",
    type: "PROFILE_BANNER",
    price: 300,
    value: "linear-gradient(135deg, #7a40ff 0%, #ff00ff 100%)",
    description: "Фиолетовый градиент",
    icon: "🌌",
  },
  FRAME_GOLD: {
    id: "FRAME_GOLD",
    name: "Золотая рамка",
    type: "AVATAR_FRAME",
    price: 1000,
    value: "#ffc800",
    description: "Золотая рамка вокруг аватара",
    icon: "✨",
  },
  FRAME_DIAMOND: {
    id: "FRAME_DIAMOND",
    name: "Алмазная рамка",
    type: "AVATAR_FRAME",
    price: 2500,
    value: "#00f0ff",
    description: "Блестящая алмазная рамка",
    icon: "💎",
  },
  TITLE_WARRIOR: {
    id: "TITLE_WARRIOR",
    name: "Титул Воин",
    type: "TITLE",
    price: 1500,
    value: "⚔️ Воин",
    description: "Отображается перед именем",
    icon: "⚔️",
  },
  CUSTOM_TAG: {
    id: "CUSTOM_TAG",
    name: "Кастомный тег",
    type: "CUSTOM_TAG",
    price: 10000,
    value: "custom",
    description: "Собственный тег рядом с ником, выбирайте любой текст и цвет",
    icon: "🏷️",
  },
};

export default function ShopPage() {
  const [coins, setCoins] = useState(0);
  const [inventory, setInventory] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  async function load() {
    const res = await fetch("/api/shop/balance", { credentials: "include" });
    const data = await res.json();
    setCoins(data.coins ?? 0);
    setInventory(data.inventory ?? []);
    setLoading(false);
  }

  async function buyItem(itemId: string) {
    const res = await fetch("/api/shop/buy", {
      method: "POST",
      headers: { "content-type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ itemId }),
    });

    if (res.ok) {
      toast.success("Предмет куплен!");
      await load();
    } else {
      const d = await res.json().catch(() => ({}));
      if (d.error === "NOT_ENOUGH_COINS") {
        toast.error("Не хватает монет");
      } else if (d.error === "ALREADY_OWNED") {
        toast.error("У вас уже есть этот предмет");
      } else {
        toast.error("Ошибка покупки");
      }
    }
  }

  useEffect(() => {
    load();
  }, []);

  if (loading) {
    return <div className="p-10 text-center" style={{ color: '#8888aa' }}>Загрузка магазина...</div>;
  }

  return (
    <div className="px-10 py-10">
      <div style={{ color: '#7a40ff', fontSize: '0.7rem', opacity: 0.6, marginBottom: '1rem', fontFamily: "'Orbitron', sans-serif" }}>BUILD v1.0.2</div>
      <div className="flex items-center justify-between mb-10">
        <h1 className="text-4xl font-bold tracking-wide" style={{fontFamily: "'Rajdhani', sans-serif", color: '#ffffff', fontWeight: 700}}>МАГАЗИН</h1>
        <div className="flex items-center gap-3 px-5 py-3 rounded-lg" style={{background: 'rgba(255, 200, 0, 0.1)', border: '1px solid rgba(255, 200, 0, 0.3)'}}>
          <span className="text-2xl">🪙</span>
          <span className="text-xl font-bold" style={{color: '#ffc800'}}>{coins}</span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 max-w-6xl">
        {Object.values(SHOP_ITEMS).map((item) => {
          const owned = inventory.includes(item.id);

          let cardStyle: React.CSSProperties = {
            border: '1px solid rgba(122, 64, 255, 0.2)',
            opacity: owned ? 0.6 : 1,
            position: 'relative',
            overflow: 'hidden',
          };

          let nameStyle: React.CSSProperties = {
            color: '#e0e0ff',
          };

          if (item.type === "NAMETAG_COLOR") {
            nameStyle.color = item.value;
            if (item.value === "rainbow") {
              nameStyle.background = 'linear-gradient(90deg, #ff0000, #ff9900, #ffff00, #00ff00, #0099ff, #9900ff)';
              nameStyle.backgroundClip = 'text';
              nameStyle.WebkitBackgroundClip = 'text';
              nameStyle.color = 'transparent';
              nameStyle.animation = 'rainbow 2s linear infinite';
            }
          }

          if (item.type === "PROFILE_BANNER") {
            cardStyle.background = item.value;
          }

          if (item.id === "FRAME_DIAMOND") {
            cardStyle.border = '2px solid #00f0ff';
            cardStyle.boxShadow = '0 0 15px rgba(0, 240, 255, 0.3), inset 0 0 10px rgba(0, 240, 255, 0.1)';
          }

          if (item.id === "FRAME_GOLD") {
            cardStyle.border = '2px solid #ffc800';
            cardStyle.boxShadow = '0 0 15px rgba(255, 200, 0, 0.3), inset 0 0 10px rgba(255, 200, 0, 0.1)';
          }

          if (item.id === "NAME_GOLD") {
            cardStyle.border = '2px solid #ffc800';
          }

          return (
            <div key={item.id} className="cyber-card rounded-lg p-5" style={cardStyle}>
              <h3 className="text-xl font-semibold mb-1" style={nameStyle}>{item.name}</h3>
              <p className="text-sm mb-4" style={{color: '#8888aa'}}>{item.description}</p>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1">
                  <span>🪙</span>
                  <span className="font-bold" style={{color: '#ffc800'}}>{item.price}</span>
                </div>
                <button
                  disabled={owned}
                  className="neon-button rounded-md"
                  style={{
                    opacity: owned ? 0.4 : 1,
                    cursor: owned ? 'not-allowed' : 'pointer',
                    padding: '0.4rem 1rem',
                    fontSize: '0.85rem',
                  }}
                  onClick={() => buyItem(item.id)}
                >
                  {owned ? "Куплено" : "Купить"}
                </button>
              </div>
            </div>
          );
        })}
      </div>

      <style jsx>{`
        @keyframes rainbow {
          0% { filter: hue-rotate(0deg); }
          100% { filter: hue-rotate(360deg); }
        }
      `}</style>
    </div>
  );
}