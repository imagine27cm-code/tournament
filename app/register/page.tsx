"use client";

import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useState } from "react";

export default function RegisterPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  return (
    <div className="mx-auto max-w-md px-4 py-10">
      <h1 className="text-3xl font-semibold tracking-tight gradient-text" style={{fontFamily: "'Orbitron', sans-serif", textShadow: '0 0 20px #00f0ff40'}}>РЕГИСТРАЦИЯ</h1>
      <p className="mt-2 text-sm" style={{color: '#8888aa'}}>
        Создаёт пользователя с ролью PLAYER
      </p>

      <form
        className="mt-6 space-y-3 cyber-card rounded-lg p-6"
        onSubmit={async (e) => {
          e.preventDefault();
          setLoading(true);
          setError(null);

          const res = await fetch("/api/auth/register", {
            method: "POST",
            headers: { "content-type": "application/json" },
            body: JSON.stringify({ name, email, password }),
          });

          if (!res.ok) {
            const data = await res.json().catch(() => ({}));
            setLoading(false);
            setError(data?.error === "EMAIL_TAKEN" ? "Email уже зарегистрирован." : "Ошибка регистрации.");
            return;
          }

          const signRes = await signIn("credentials", {
            email,
            password,
            redirect: false,
            callbackUrl: "/dashboard",
          });
          setLoading(false);
          if (!signRes || signRes.error) {
            router.push("/signin");
            return;
          }
          router.push(signRes.url ?? "/dashboard");
        }}
      >
        <label className="block text-sm">
          <div className="mb-2" style={{color: '#8888aa'}}>Имя (опционально)</div>
          <input
            className="cyber-input w-full rounded-md"
            style={{borderRadius: '4px'}}
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
        </label>

        <label className="block text-sm">
          <div className="mb-2" style={{color: '#00f0ff'}}>Email</div>
          <input
            className="cyber-input w-full rounded-md"
            style={{borderRadius: '4px'}}
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            type="email"
            required
          />
        </label>

        <label className="block text-sm">
          <div className="mb-2" style={{color: '#00f0ff'}}>Пароль (минимум 6)</div>
          <input
            className="cyber-input w-full rounded-md"
            style={{borderRadius: '4px'}}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            type="password"
            required
          />
        </label>

        {error ? <div className="text-sm" style={{color: '#ff0044', textShadow: '0 0 8px #ff004480'}}>{error}</div> : null}

        <button
          disabled={loading}
          className="neon-button w-full"
          style={{borderRadius: '4px', marginTop: '1rem'}}
        >
          {loading ? "Создаём..." : "СОЗДАТЬ АККАУНТ"}
        </button>
      </form>
    </div>
  );
}