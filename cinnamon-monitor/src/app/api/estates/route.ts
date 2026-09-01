import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireUser, handler, ok } from '@/lib/http';
import { accessibleEstateIds } from '@/lib/rbac';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export const GET = handler(async (req: NextRequest) => {
  const user = await requireUser();
  const groupId = req.nextUrl.searchParams.get('groupId');
  const estateIds = await accessibleEstateIds(user);

  const estates = await prisma.estate.findMany({
    where: {
      ...(estateIds === null ? {} : { id: { in: estateIds } }),
      ...(groupId ? { groupId } : {}),
    },
    orderBy: { name: 'asc' },
    include: {
      group: { select: { id: true, name: true, region: true } },
      manager: { select: { id: true, name: true } },
      _count: { select: { divisions: true } },
    },
  });

  return ok(estates);
});
