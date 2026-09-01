import { prisma } from '@/lib/prisma';
import { assert, requireUser, handler, ok } from '@/lib/http';
import { canViewDivision } from '@/lib/rbac';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export const GET = handler(async (_req: Request, { params }: { params: { id: string } }) => {
  const user = await requireUser();
  assert(await canViewDivision(user, params.id), 403, 'No access to this division');

  const history = await prisma.cropHistory.findMany({
    where: { divisionId: params.id },
    orderBy: { seasonStart: 'asc' },
  });

  return ok(history);
});
