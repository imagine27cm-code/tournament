import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function POST() {
  try {
    const session = await auth();
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const inParty = await prisma.partyMember.findFirst({
      where: {
        userId: session.user.id,
        party: { status: 'waiting' }
      }
    });

    if (inParty) {
      return NextResponse.json({ error: 'You are already in a party. Leave party to join matchmaking queue.' }, { status: 400 });
    }

    await prisma.matchmakingQueue.upsert({
      where: { userId: session.user.id },
      update: {},
      create: { userId: session.user.id }
    });

    const queueCount = await prisma.matchmakingQueue.count();

    if (queueCount >= 10) {
      const players = await prisma.matchmakingQueue.findMany({
        orderBy: { createdAt: 'asc' },
        take: 10,
        select: { userId: true }
      });

      const userIds = players.map(p => p.userId);
      const shuffled = userIds.sort(() => Math.random() - 0.5);
      
      const teamA = shuffled.slice(0, 5);
      const teamB = shuffled.slice(5, 10);

      const match = await prisma.match.create({
        data: {
          isMatchmaking: true,
          status: 'SCHEDULED',
          teamA,
          teamB
        }
      });

      await prisma.matchmakingQueue.deleteMany({
        where: { userId: { in: userIds } }
      });

      return NextResponse.json({
        success: true,
        queueCount: queueCount - 10,
        matchFound: true,
        matchId: match.id,
        redirectUrl: `/map-select?matchId=${match.id}`
      });
    }

    return NextResponse.json({
      success: true,
      queueCount,
      matchFound: false
    });
  } catch (error) {
    console.error('Matchmaking join error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}