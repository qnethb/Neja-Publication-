import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { assert, requireUser, handler, ok } from '@/lib/http';
import { canViewDivision, canWriteDivision } from '@/lib/rbac';
import { OPERATION_TYPES } from '@/lib/domain';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export const GET = handler(async (req: NextRequest, { params }: { params: { id: string } }) => {
  const user = await requireUser();
  assert(await canViewDivision(user, params.id), 403, 'No access to this division');

  const take = Number(req.nextUrl.searchParams.get('take') ?? 10);
  const operations = await prisma.operationLog.findMany({
    where: { divisionId: params.id },
    orderBy: { date: 'desc' },
    take: Math.min(Math.max(take, 1), 200),
    include: { loggedBy: { select: { id: true, name: true } } },
  });

  return ok(operations);
});

export const POST = handler(async (req: NextRequest, { params }: { params: { id: string } }) => {
  const user = await requireUser();
  assert(await canWriteDivision(user, params.id), 403, 'Not allowed to log operations for this division');

  const body = await req.json();
  assert(body.operationType && OPERATION_TYPES.includes(body.operationType), 400, 'Unknown operation type');
  assert(body.date, 400, 'Date is required');

  const operation = await prisma.operationLog.create({
    data: {
      divisionId: params.id,
      date: new Date(body.date),
      operationType: body.operationType,
      inputProduct: body.inputProduct || null,
      rate: body.rate || null,
      costLkr: Number(body.costLkr ?? 0) || 0,
      laborHours: Number(body.laborHours ?? 0) || 0,
      weatherNotes: body.weatherNotes || null,
      loggedById: user.id,
    },
    include: { loggedBy: { select: { id: true, name: true } } },
  });

  return ok(operation, { status: 201 });
});
