import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const session = await auth();
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const count = await prisma.matchmakingQueue.count();
    
    return NextResponse.json({
      queueCount: count,
      inQueue: !!(await prisma.matchmakingQueue.findUnique({
        where: { userId: session.user.id }
      }))
    });
  } catch (error) {
    console.error('Matchmaking status error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}