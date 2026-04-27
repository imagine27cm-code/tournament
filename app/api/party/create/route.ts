import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function POST() {
  try {
    const session = await auth();
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const existingParty = await prisma.partyMember.findFirst({
      where: {
        userId: session.user.id,
        party: {
          status: 'waiting'
        }
      }
    });

    if (existingParty) {
      return NextResponse.json({ error: 'You are already in a party' }, { status: 400 });
    }

    const party = await prisma.party.create({
      data: {
        leaderId: session.user.id,
        members: {
          create: {
            userId: session.user.id
          }
        }
      },
      include: {
        members: true
      }
    });

    return NextResponse.json({ partyId: party.id, party });
  } catch (error) {
    console.error('Create party error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}