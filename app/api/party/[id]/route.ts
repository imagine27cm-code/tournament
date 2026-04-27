import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth();
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const partyId = params.id;

    const party = await prisma.party.findUnique({
      where: { id: partyId },
      include: {
        members: {
          orderBy: { joinedAt: 'asc' },
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
                level: true,
                rp: true
              }
            }
          }
        },
        invites: {
          where: { status: 'pending' },
          include: {
            toUser: {
              select: {
                id: true,
                name: true
              }
            }
          }
        }
      }
    });

    if (!party) {
      return NextResponse.json({ error: 'Party not found' }, { status: 404 });
    }

    const isMember = party.members.some(m => m.userId === session.user.id);

    if (!isMember) {
      return NextResponse.json({ error: 'You are not in this party' }, { status: 403 });
    }

    return NextResponse.json(party);
  } catch (error) {
    console.error('Get party error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}