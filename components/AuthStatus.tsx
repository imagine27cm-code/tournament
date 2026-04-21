"use client";

import Link from "next/link";
import { signOut, useSession } from "next-auth/react";

export function AuthStatus() {
  const { data, status } = useSession();

  if (status === "loading") return <div className="text-sm" style={{color: '#8888aa'}}>...</div>;
  if (!data?.user?.id) {
    return (
      <div className="flex items-center gap-3 text-sm">
        <Link className="cyber-link" href="/signin">
          Войти
        </Link>
        <Link className="neon-button-magenta" href="/register" style={{padding: '0.4rem 1rem', fontSize: '0.8rem'}}>
          Регистрация
        </Link>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-3 text-sm">
      <span style={{color: '#8888aa', fontSize: '0.85rem'}}>
        <Link href={`/profile/${data.user.id}`} style={{ color: '#00f0ff' }}>{data.user.name ?? 'Профиль'}</Link>
        {' '}
        (<span style={{color: '#7a40ff'}}>{data.user.role}</span>)
      </span>
      <button
        onClick={() => signOut({ callbackUrl: "/" })}
        className="neon-button"
        style={{padding: '0.4rem 1rem', fontSize: '0.8rem'}}
      >
        Выйти
      </button>
    </div>
  );
}