import { prisma } from '@/lib/prisma';
import { assert, requireUser, handler, ok } from '@/lib/http';
import { canViewEstate } from '@/lib/rbac';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export const GET = handler(async (_req: Request, { params }: { params: { id: string } }) => {
  const user = await requireUser();
  assert(await canViewEstate(user, params.id), 403, 'No access to this estate');

  const estate = await prisma.estate.findUnique({
    where: { id: params.id },
    include: {
      group: { select: { id: true, name: true, region: true } },
      manager: { select: { id: true, name: true, email: true } },
      assistantManager: { select: { id: true, name: true } },
      divisions: {
        orderBy: { name: 'asc' },
        select: {
          id: true,
          name: true,
          areaHa: true,
          primaryCrop: true,
          plantingYear: true,
          variety: true,
          soilType: true,
          irrigationType: true,
          centroidLat: true,
          centroidLng: true,
        },
      },
    },
  });
  assert(estate, 404, 'Estate not found');

  return ok({ ...estate, mainCrops: estate.mainCrops.split(',').filter(Boolean) });
});
