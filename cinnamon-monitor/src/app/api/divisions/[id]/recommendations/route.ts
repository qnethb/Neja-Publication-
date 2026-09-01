import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { assert, requireUser, handler, ok } from '@/lib/http';
import { canCreateRecommendation, canViewDivision } from '@/lib/rbac';
import { PRIORITIES } from '@/lib/domain';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export const GET = handler(async (_req: NextRequest, { params }: { params: { id: string } }) => {
  const user = await requireUser();
  assert(await canViewDivision(user, params.id), 403, 'No access to this division');

  const recommendations = await prisma.recommendation.findMany({
    where: { divisionId: params.id },
    orderBy: [{ status: 'asc' }, { dueDate: 'asc' }],
    include: {
      assignedTo: { select: { id: true, name: true } },
      createdBy: { select: { id: true, name: true } },
    },
  });

  return ok(recommendations);
});

/** Only Group GM and Top Management issue management recommendations. */
export const POST = handler(async (req: NextRequest, { params }: { params: { id: string } }) => {
  const user = await requireUser();
  assert(canCreateRecommendation(user), 403, 'Only Group GM or Top Management can issue recommendations');
  assert(await canViewDivision(user, params.id), 403, 'No access to this division');

  const body = await req.json();
  assert(body.actionTitle && body.actionDescription, 400, 'Action title and description are required');
  const priority = body.priority ?? 'MEDIUM';
  assert(PRIORITIES.includes(priority), 400, 'Unknown priority');

  const recommendation = await prisma.recommendation.create({
    data: {
      divisionId: params.id,
      priority,
      actionTitle: body.actionTitle,
      actionDescription: body.actionDescription,
      rationale: body.rationale || null,
      expectedImpact: body.expectedImpact || null,
      assignedToId: body.assignedToId || null,
      createdById: user.id,
      dueDate: body.dueDate ? new Date(body.dueDate) : null,
      status: 'PENDING',
    },
    include: {
      assignedTo: { select: { id: true, name: true } },
      createdBy: { select: { id: true, name: true } },
    },
  });

  return ok(recommendation, { status: 201 });
});
