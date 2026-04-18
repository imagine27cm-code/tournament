import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { AdminClient } from "@/components/AdminClient";

export default async function AdminPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) redirect("/signin?callbackUrl=/admin");
  if (session.user.role !== "ADMIN") redirect("/dashboard");

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <h1 className="text-2xl font-semibold tracking-tight">Админ‑панель</h1>
      <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-300">
        Создание турниров, утверждение заявок, запуск Round Robin и расписания.
      </p>
      <div className="mt-6">
        <AdminClient />
      </div>
    </div>
  );
}

