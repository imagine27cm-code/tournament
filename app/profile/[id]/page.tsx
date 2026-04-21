import { auth } from "@/lib/auth";
import { notFound } from "next/navigation";
import { ProfileClient } from "@/components/ProfileClient";

export default async function ProfilePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await auth();
  
  const { prisma } = await import("@/lib/prisma");
  
  const user = await prisma.user.findUnique({
    where: { id },
    select: {
      id: true,
      name: true,
      email: true,
      rp: true,
      wins: true,
      losses: true,
      createdAt: true,
    }
  });

  if (!user) notFound();

  // Отдельно запросим команду
  const team = await prisma.team.findFirst({
    where: { members: { some: { id } } },
    select: {
      id: true,
      name: true,
      captainId: true,
    }
  });

  // Показываем почту только самому игроку
  const showEmail = session?.user?.id === user.id;

  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      <ProfileClient
        user={{ ...user, team }}
        currentUserId={session?.user?.id ?? null}
        showEmail={showEmail}
      />
    </div>
  );
}