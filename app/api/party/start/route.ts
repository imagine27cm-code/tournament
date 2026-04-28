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
      },
      include: {
        party: {
          include: {
            members: true
          }
        }
      }
    });

    if (!partyMember) {
      return NextResponse.json({ error: 'You are not in a party' }, { status: 400 });
    }

    if (partyMember.party.leaderId !== session.user.id) {
      return NextResponse.json({ error: 'Only party leader can start game' }, { status: 403 });
    }

    const members = partyMember.party.members;
    const allReady = members.every(m => m.isReady);

    if (members.length === 5 && !allReady) {
      return NextResponse.json({ error: 'Not all players are ready' }, { status: 400 });
    }

    const party = await prisma.party.update({
      where: { id: partyMember.partyId },
      data: { status: 'playing' }
    });

    return NextResponse.json({
      success: true,
      matchId: party.matchId,
      redirectUrl: `/map-select?matchId=${party.id}`
    });
  } catch (error) {
    console.error('Start party error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}