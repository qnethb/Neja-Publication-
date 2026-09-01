import { NextRequest } from 'next/server';
import { assert, requireUser, handler, ok } from '@/lib/http';
import { canViewDivision } from '@/lib/rbac';
import { loadDivisionInputs } from '@/lib/queries';
import { computeDivisionMetrics } from '@/lib/kpi';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export const GET = handler(async (req: NextRequest, { params }: { params: { id: string } }) => {
  const user = await requireUser();
  assert(await canViewDivision(user, params.id), 403, 'No access to this division');

  const season = req.nextUrl.searchParams.get('season');
  const [division] = await loadDivisionInputs({ divisionId: params.id });
  assert(division, 404, 'Division not found');

  return ok(computeDivisionMetrics(division, season));
});
