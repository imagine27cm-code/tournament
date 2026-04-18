"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";

export default function JoinTeamPage({ params }: { params: { token: string } }) {
  const { data, status } = useSession();
  const router = useRouter();
  const [msg, setMsg] = useState<string>("Обработка приглашения...");

  useEffect(() => {
    if (status === "loading") return;
    if (!data?.user?.id) {
      router.push(`/signin?callbackUrl=/join/${params.token}`);
      return;
    }
    fetch(`/api/team-invites/${params.token}/accept`, { method: "POST" })
      .then(async (r) => ({ ok: r.ok, data: await r.json().catch(() => ({})) }))
      .then(({ ok, data }) => {
        if (!ok) {
          setMsg(`Ошибка: ${data?.error ?? "unknown"}`);
          return;
        }
        setMsg("Готово! Вы добавлены в команду.");
        setTimeout(() => router.push("/dashboard"), 900);
      });
  }, [status, data?.user?.id, params.token, router]);

  return (
    <div className="mx-auto max-w-md px-4 py-10">
      <div className="rounded-lg border bg-white p-4 text-sm dark:bg-black">{msg}</div>
    </div>
  );
}

