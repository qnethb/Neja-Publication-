import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { assert, requireUser, handler, ok } from '@/lib/http';
import { accessibleDivisionIds, canViewEstate } from '@/lib/rbac';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export const GET = handler(async (req: NextRequest) => {
  const user = await requireUser();
  const estateId = req.nextUrl.searchParams.get('estateId');
  const crop = req.nextUrl.searchParams.get('crop');

  const divisionIds = await accessibleDivisionIds(user);
  // An estate filter is only honoured for roles that can see the estate itself;
  // division-scoped roles stay limited to their own divisions.
  if (estateId && divisionIds !== null && !(await canViewEstate(user, estateId))) {
    assert(false, 403, 'No access to this estate');
  }

  const divisions = await prisma.division.findMany({
    where: {
      ...(divisionIds === null ? {} : { id: { in: divisionIds } }),
      ...(estateId ? { estateId } : {}),
      ...(crop ? { primaryCrop: crop } : {}),
    },
    orderBy: [{ estate: { name: 'asc' } }, { name: 'asc' }],
    include: {
      estate: { select: { id: true, name: true, code: true, group: { select: { id: true, name: true } } } },
    },
  });

  return ok(divisions);
});
