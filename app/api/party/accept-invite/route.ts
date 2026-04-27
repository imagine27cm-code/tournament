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
    const { inviteId } = body;

    if (!inviteId) {
      return NextResponse.json({ error: 'Invite ID is required' }, { status: 400 });
    }

    const invite = await prisma.partyInvite.findUnique({
      where: { id: inviteId },
      include: { party: true }
    });

    if (!invite) {
      return NextResponse.json({ error: 'Invite not found' }, { status: 404 });
    }

    if (invite.toUserId !== session.user.id) {
      return NextResponse.json({ error: 'This invite is not for you' }, { status: 403 });
    }

    if (invite.status !== 'pending') {
      return NextResponse.json({ error: 'Invite already processed' }, { status: 400 });
    }

    if (invite.expiresAt < new Date()) {
      await prisma.partyInvite.update({
        where: { id: inviteId },
        data: { status: 'expired' }
      });
      return NextResponse.json({ error: 'Invite expired' }, { status: 400 });
    }

    if (invite.party.status !== 'waiting') {
      return NextResponse.json({ error: 'Party is no longer active' }, { status: 400 });
    }

    const memberCount = await prisma.partyMember.count({
      where: { partyId: invite.partyId }
    });

    if (memberCount >= 5) {
      return NextResponse.json({ error: 'Party is full' }, { status: 400 });
    }

    const alreadyInParty = await prisma.partyMember.findFirst({
      where: {
        userId: session.user.id,
        party: { status: 'waiting' }
      }
    });

    if (alreadyInParty) {
      return NextResponse.json({ error: 'You are already in another party' }, { status: 400 });
    }

    await prisma.$transaction([
      prisma.partyInvite.update({
        where: { id: inviteId },
        data: { status: 'accepted' }
      }),
      prisma.partyMember.create({
        data: {
          partyId: invite.partyId,
          userId: session.user.id
        }
      })
    ]);

    return NextResponse.json({ success: true, partyId: invite.partyId });
  } catch (error) {
    console.error('Accept invite error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}