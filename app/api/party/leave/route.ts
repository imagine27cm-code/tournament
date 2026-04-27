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
      include: { party: true }
    });

    if (!partyMember) {
      return NextResponse.json({ error: 'You are not in a party' }, { status: 400 });
    }

    await prisma.$transaction(async (tx) => {
      await tx.partyMember.delete({
        where: { id: partyMember.id }
      });

      const remainingMembers = await tx.partyMember.count({
        where: { partyId: partyMember.partyId }
      });

      if (remainingMembers === 0) {
        await tx.party.delete({
          where: { id: partyMember.partyId }
        });
      } else if (partyMember.party.leaderId === session.user.id) {
        const newLeader = await tx.partyMember.findFirst({
          where: { partyId: partyMember.partyId },
          orderBy: { joinedAt: 'asc' }
        });

        if (newLeader) {
          await tx.party.update({
            where: { id: partyMember.partyId },
            data: { leaderId: newLeader.userId }
          });
        }
      }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Leave party error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}