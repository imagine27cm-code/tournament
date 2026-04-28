import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function POST(request: Request) {
  try {
    const session = await auth();
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { newLeaderUserId } = body;

    if (!newLeaderUserId) {
      return NextResponse.json({ error: 'New leader user ID is required' }, { status: 400 });
    }

    const partyMember = await prisma.partyMember.findFirst({
      where: {
        userId: session.user.id,
        party: { status: 'waiting' }
      },
      include: { party: true }
    });

    if (!partyMember) {
      return NextResponse.json({ error: 'You are not in a party' }, { status: 400 });
    }

    if (partyMember.party.leaderId !== session.user.id) {
      return NextResponse.json({ error: 'Only party leader can transfer leadership' }, { status: 403 });
    }

    if (newLeaderUserId === session.user.id) {
      return NextResponse.json({ error: 'You are already the leader' }, { status: 400 });
    }

    const newLeaderMember = await prisma.partyMember.findFirst({
      where: {
        partyId: partyMember.partyId,
        userId: newLeaderUserId
      }
    });

    if (!newLeaderMember) {
      return NextResponse.json({ error: 'User is not in this party' }, { status: 400 });
    }

    await prisma.party.update({
      where: { id: partyMember.partyId },
      data: { leaderId: newLeaderUserId }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Transfer leadership error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}