import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { assert, requireUser, handler, ok } from '@/lib/http';
import { accessibleDivisionIds, canViewEstate } from '@/lib/rbac';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export const GET = handler(async (req: NextRequest) => {
  const user = await requireUser();
  const sp = req.nextUrl.searchParams;
  const estateId = sp.get('estateId');
  const divisionId = sp.get('divisionId');
  const status = sp.get('status');
  const priority = sp.get('priority');

  const divisionIds = await accessibleDivisionIds(user);
  if (estateId && divisionIds !== null && !(await canViewEstate(user, estateId))) {
    assert(false, 403, 'No access to this estate');
  }

  const recommendations = await prisma.recommendation.findMany({
    where: {
      ...(divisionId ? { divisionId } : {}),
      division: {
        ...(divisionIds === null ? {} : { id: { in: divisionIds } }),
        ...(estateId ? { estateId } : {}),
      },
      ...(status ? { status } : {}),
      ...(priority ? { priority } : {}),
    },
    orderBy: [{ status: 'asc' }, { dueDate: 'asc' }],
    include: {
      division: { select: { id: true, name: true, estateId: true } },
      assignedTo: { select: { id: true, name: true } },
      createdBy: { select: { id: true, name: true } },
    },
  });

  return ok(recommendations);
});
