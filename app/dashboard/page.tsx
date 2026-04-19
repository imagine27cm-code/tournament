import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { DashboardClient } from "@/components/DashboardClient";

export default async function DashboardPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/signin?callbackUrl=/dashboard");

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <h1 className="text-3xl font-semibold tracking-tight gradient-text" style={{fontFamily: "'Orbitron', sans-serif", textShadow: '0 0 20px #00f0ff40'}}>КАБИНЕТ</h1>
      <p className="mt-2 text-sm" style={{color: '#8888aa'}}>
        Команды, приглашения и админ‑операции
      </p>
      <div className="mt-8">
        <DashboardClient role={session.user.role} userId={session.user.id} />
      </div>
    </div>
  );
}