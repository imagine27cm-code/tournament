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
      where: { id: inviteId }
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

    await prisma.partyInvite.update({
      where: { id: inviteId },
      data: { status: 'declined' }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Decline invite error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}