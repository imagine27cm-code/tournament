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
    const { friendId } = body;

    if (!friendId) {
      return NextResponse.json({ error: 'Friend ID is required' }, { status: 400 });
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
      return NextResponse.json({ error: 'Only party leader can send invites' }, { status: 403 });
    }

    const memberCount = await prisma.partyMember.count({
      where: { partyId: partyMember.partyId }
    });

    if (memberCount >= 5) {
      return NextResponse.json({ error: 'Party is full' }, { status: 400 });
    }

    const isFriend = await prisma.friendRequest.findFirst({
      where: {
        OR: [
          { fromUserId: session.user.id, toUserId: friendId, status: 'ACCEPTED' },
          { fromUserId: friendId, toUserId: session.user.id, status: 'ACCEPTED' }
        ]
      }
    });

    if (!isFriend) {
      return NextResponse.json({ error: 'User is not your friend' }, { status: 400 });
    }

    const existingInvite = await prisma.partyInvite.findFirst({
      where: {
        partyId: partyMember.partyId,
        toUserId: friendId,
        status: 'pending'
      }
    });

    if (existingInvite) {
      return NextResponse.json({ error: 'Invite already sent' }, { status: 400 });
    }

    const alreadyInParty = await prisma.partyMember.findFirst({
      where: {
        userId: friendId,
        party: { status: 'waiting' }
      }
    });

    if (alreadyInParty) {
      return NextResponse.json({ error: 'User is already in another party' }, { status: 400 });
    }

    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 1);

    const invite = await prisma.partyInvite.create({
      data: {
        partyId: partyMember.partyId,
        fromUserId: session.user.id,
        toUserId: friendId,
        expiresAt
      }
    });

    return NextResponse.json({ success: true, invite });
  } catch (error) {
    console.error('Party invite error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}