"use client";

import { signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";

export default function SignInForm() {
  const router = useRouter();
  const sp = useSearchParams();
  const callbackUrl = sp.get("callbackUrl") ?? "/dashboard";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  return (
    <form
      className="mt-6 space-y-3 cyber-card rounded-lg p-6"
      onSubmit={async (e) => {
        e.preventDefault();
        setLoading(true);
        setError(null);
        const res = await signIn("credentials", {
          email,
          password,
          redirect: false,
          callbackUrl,
        });
        setLoading(false);
        if (!res || res.error) {
          setError("Неверный email или пароль.");
          return;
        }
        router.push(res.url ?? callbackUrl);
      }}
    >
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
        <div className="mb-2" style={{color: '#00f0ff'}}>Пароль</div>
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
        {loading ? "Входим..." : "ВОЙТИ"}
      </button>
    </form>
  );
}