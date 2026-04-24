"use client";

import { useEffect, useState, useCallback, memo } from "react";
import { useSession } from "next-auth/react";
import Link from "next/link";

type Friend = {
  id: string;
  email: string;
  name: string | null;
};

function FriendListInner() {
  const { data: session, status } = useSession();
  const [friends, setFriends] = useState<Friend[]>([]);
  const [loading, setLoading] = useState(true);
  const [isOpen, setIsOpen] = useState(true);

  const loadFriends = useCallback(async () => {
    if (status !== "authenticated" || !session?.user?.id) {
      setLoading(false);
      return;
    }
    try {
      const res = await fetch("/api/friends", {
        cache: "no-store",
        credentials: "include",
      });
      const data = (await res.json().catch(() => ({}))) as {
        friends?: Friend[];
      };
      setFriends(data.friends ?? []);
    } catch {
      setFriends([]);
    } finally {
      setLoading(false);
    }
  }, [status, session?.user?.id]);

  useEffect(() => {
    loadFriends();
  }, [loadFriends]);

  // Не рендерим если не авторизован
  if (status !== "authenticated" || !session?.user?.id) {
    return null;
  }

  return (
    <aside
      className="fixed right-0 top-16 z-40 overflow-y-auto border-l transition-transform duration-300"
      style={{
        height: "calc(100vh - 4rem)",
        width: isOpen ? "16rem" : "2.5rem",
        borderColor: "rgba(0, 240, 255, 0.2)",
        background: "rgba(18, 18, 31, 0.95)",
        backdropFilter: "blur(10px)",
        transform: isOpen ? "translateX(0)" : "translateX(calc(100% - 2.5rem))",
      }}
    >
      {/* Кнопка сворачивания */}
      <button
        onClick={() => setIsOpen((v) => !v)}
        className="absolute left-0 top-4 flex h-8 w-8 -translate-x-1/2 items-center justify-center rounded-full"
        style={{
          background: "rgba(0, 240, 255, 0.15)",
          border: "1px solid rgba(0, 240, 255, 0.3)",
        }}
        aria-label={isOpen ? "Скрыть друзей" : "Показать друзей"}
      >
        <span style={{ color: "#00f0ff", fontSize: "0.75rem" }}>
          {isOpen ? "›" : "‹"}
        </span>
      </button>

      {isOpen && (
        <div className="p-4">
          <div className="mb-4 flex items-center justify-between">
            <h2
              className="text-xs font-semibold uppercase tracking-wider"
              style={{
                color: "#00f0ff",
                fontFamily: "'Orbitron', sans-serif",
                textShadow: "0 0 8px #00f0ff40",
              }}
            >
              Друзья онлайн
            </h2>
            <button
              onClick={loadFriends}
              className="text-[10px]"
              style={{ color: "#8888aa" }}
            >
              ↻
            </button>
          </div>

          {loading ? (
            <div className="text-xs" style={{ color: "#8888aa" }}>
              Загрузка...
            </div>
          ) : friends.length === 0 ? (
            <div className="text-xs" style={{ color: "#8888aa" }}>
              Нет друзей.{" "}
              <Link href="/players" className="cyber-link">
                Добавить
              </Link>
            </div>
          ) : (
            <ul className="space-y-2">
              {friends.map((friend) => (
                <li
                  key={friend.id}
                  className="flex items-center gap-2 rounded-md p-2 text-sm transition-colors hover:bg-white/5"
                  style={{
                    border: "1px solid rgba(0, 240, 255, 0.1)",
                    background: "rgba(26, 26, 46, 0.6)",
                  }}
                >
                  {/* Online indicator */}
                  <div
                    className="h-2 w-2 shrink-0 rounded-full"
                    style={{
                      background: "#00ff88",
                      boxShadow: "0 0 6px #00ff88",
                    }}
                    title="Онлайн"
                  />
                  <Link
                    href={`/profile/${friend.id}`}
                    className="flex-1 truncate"
                  >
                    <div
                      className="text-xs font-medium"
                      style={{ color: "#e0e0ff" }}
                    >
                      {friend.name ?? "Без имени"}
                    </div>
                    <div
                      className="text-[10px] truncate"
                      style={{ color: "#8888aa" }}
                    >
                      {friend.email}
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </aside>
  );
}

export const FriendList = memo(FriendListInner);
