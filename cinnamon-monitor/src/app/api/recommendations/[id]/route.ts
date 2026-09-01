import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { assert, requireUser, handler, ok } from '@/lib/http';
import { canCreateRecommendation, canUpdateRecommendation, canViewDivision } from '@/lib/rbac';
import { PRIORITIES, REC_STATUSES } from '@/lib/domain';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export const GET = handler(async (_req: NextRequest, { params }: { params: { id: string } }) => {
  const user = await requireUser();
  const rec = await prisma.recommendation.findUnique({
    where: { id: params.id },
    include: {
      division: { select: { id: true, name: true, estateId: true } },
      assignedTo: { select: { id: true, name: true } },
      createdBy: { select: { id: true, name: true } },
    },
  });
  assert(rec, 404, 'Recommendation not found');
  assert(await canViewDivision(user, rec.divisionId), 403, 'No access to this recommendation');
  return ok(rec);
});

export const PATCH = handler(async (req: NextRequest, { params }: { params: { id: string } }) => {
  const user = await requireUser();
  const existing = await prisma.recommendation.findUnique({ where: { id: params.id } });
  assert(existing, 404, 'Recommendation not found');
  assert(await canViewDivision(user, existing.divisionId), 403, 'No access to this recommendation');
  assert(canUpdateRecommendation(user), 403, 'Your role cannot update recommendations');

  const body = await req.json();
  const data: Record<string, unknown> = {};

  if (body.status !== undefined) {
    assert(REC_STATUSES.includes(body.status), 400, 'Unknown status');
    data.status = body.status;
    data.completedAt = body.status === 'COMPLETED' ? new Date() : null;
  }
  if (body.progressNotes !== undefined) data.progressNotes = body.progressNotes || null;

  // Content edits stay with the roles allowed to issue recommendations.
  const contentFields = ['actionTitle', 'actionDescription', 'rationale', 'expectedImpact', 'priority', 'dueDate', 'assignedToId'];
  const touchesContent = contentFields.some((f) => body[f] !== undefined);
  if (touchesContent) {
    assert(canCreateRecommendation(user), 403, 'Only Group GM or Top Management can edit recommendation content');
    if (body.priority !== undefined) {
      assert(PRIORITIES.includes(body.priority), 400, 'Unknown priority');
      data.priority = body.priority;
    }
    if (body.actionTitle !== undefined) data.actionTitle = body.actionTitle;
    if (body.actionDescription !== undefined) data.actionDescription = body.actionDescription;
    if (body.rationale !== undefined) data.rationale = body.rationale || null;
    if (body.expectedImpact !== undefined) data.expectedImpact = body.expectedImpact || null;
    if (body.assignedToId !== undefined) data.assignedToId = body.assignedToId || null;
    if (body.dueDate !== undefined) data.dueDate = body.dueDate ? new Date(body.dueDate) : null;
  }

  assert(Object.keys(data).length > 0, 400, 'Nothing to update');

  const updated = await prisma.recommendation.update({
    where: { id: params.id },
    data,
    include: {
      division: { select: { id: true, name: true, estateId: true } },
      assignedTo: { select: { id: true, name: true } },
      createdBy: { select: { id: true, name: true } },
    },
  });

  return ok(updated);
});
