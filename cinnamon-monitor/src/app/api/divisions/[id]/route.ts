import { prisma } from '@/lib/prisma';
import { assert, requireUser, handler, ok } from '@/lib/http';
import { canViewDivision, canWriteDivision } from '@/lib/rbac';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export const GET = handler(async (_req: Request, { params }: { params: { id: string } }) => {
  const user = await requireUser();
  assert(await canViewDivision(user, params.id), 403, 'No access to this division');

  const division = await prisma.division.findUnique({
    where: { id: params.id },
    include: {
      estate: {
        select: {
          id: true,
          name: true,
          code: true,
          manager: { select: { id: true, name: true } },
          group: { select: { id: true, name: true, region: true } },
        },
      },
      blocks: { orderBy: { blockCode: 'asc' } },
    },
  });
  assert(division, 404, 'Division not found');

  return ok({ ...division, canWrite: await canWriteDivision(user, params.id) });
});
