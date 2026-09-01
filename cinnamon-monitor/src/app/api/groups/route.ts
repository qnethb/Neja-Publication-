import { prisma } from '@/lib/prisma';
import { requireUser, handler, ok } from '@/lib/http';
import { accessibleGroupIds } from '@/lib/rbac';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export const GET = handler(async () => {
  const user = await requireUser();
  const groupIds = await accessibleGroupIds(user);

  const groups = await prisma.group.findMany({
    where: groupIds === null ? {} : { id: { in: groupIds } },
    orderBy: { name: 'asc' },
    include: {
      generalManager: { select: { id: true, name: true, email: true } },
      estates: { select: { id: true, name: true, code: true, totalAreaHa: true } },
    },
  });

  return ok(groups);
});
