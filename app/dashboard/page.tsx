import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { DashboardClient } from "@/components/DashboardClient";

export default async function DashboardPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/signin?callbackUrl=/dashboard");

  return (
    <div className="mx-auto max-w-6xl px-6 py-10">
      <h1 className="text-4xl font-bold tracking-wide flex items-center gap-3" style={{fontFamily: "'Orbitron', sans-serif", color: '#ffffff'}}>
        <span style={{ color: '#A6FF00' }}>▌</span> КАБИНЕТ
      </h1>
      <p className="mt-2 text-sm" style={{color: '#8888aa'}}>
        Команды, приглашения и админ‑операции
      </p>
      <div className="mt-8">
        <DashboardClient role={session.user.role} userId={session.user.id} />
      </div>
    </div>
  );
}