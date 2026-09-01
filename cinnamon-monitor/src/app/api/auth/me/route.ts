import { getCurrentUser } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { accessibleEstateIds, accessibleGroupIds, canCreateRecommendation, canLogOperation } from '@/lib/rbac';
import { handler, ok } from '@/lib/http';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export const GET = handler(async () => {
  const user = await getCurrentUser();
  if (!user) return ok({ user: null }, { status: 200 });

  const [estateIds, groupIds] = await Promise.all([
    accessibleEstateIds(user),
    accessibleGroupIds(user),
  ]);

  const [estates, groups] = await Promise.all([
    prisma.estate.findMany({
      where: estateIds === null ? {} : { id: { in: estateIds } },
      select: { id: true, name: true, code: true, groupId: true },
      orderBy: { name: 'asc' },
    }),
    prisma.group.findMany({
      where: groupIds === null ? {} : { id: { in: groupIds } },
      select: { id: true, name: true, region: true },
      orderBy: { name: 'asc' },
    }),
  ]);

  return ok({
    user: {
      ...user,
      permissions: {
        createRecommendation: canCreateRecommendation(user),
        logOperation: canLogOperation(user),
        globalScope: user.role === 'TOP_MANAGEMENT',
      },
    },
    estates,
    groups,
  });
});
