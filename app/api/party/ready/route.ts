import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function POST() {
  try {
    const session = await auth();
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const partyMember = await prisma.partyMember.findFirst({
      where: {
        userId: session.user.id,
        party: { status: 'waiting' }
      }
    });

    if (!partyMember) {
      return NextResponse.json({ error: 'You are not in a party' }, { status: 400 });
    }

    const updatedMember = await prisma.partyMember.update({
      where: { id: partyMember.id },
      data: { isReady: !partyMember.isReady }
    });

    return NextResponse.json({ success: true, isReady: updatedMember.isReady });
  } catch (error) {
    console.error('Ready toggle error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}