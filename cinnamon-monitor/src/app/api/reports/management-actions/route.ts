import { NextRequest } from 'next/server';
import { assert, requireUser, handler, ok } from '@/lib/http';
import { canViewEstate } from '@/lib/rbac';
import { buildManagementActions } from '@/lib/reports';
import { csvResponse, toCsv } from '@/lib/csv';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export const GET = handler(async (req: NextRequest) => {
  const user = await requireUser();
  const estateId = req.nextUrl.searchParams.get('estateId');
  assert(estateId, 400, 'estateId is required');
  assert(await canViewEstate(user, estateId), 403, 'No access to this estate');

  const report = await buildManagementActions(estateId);

  if ((req.nextUrl.searchParams.get('format') ?? 'json').toLowerCase() === 'csv') {
    const csv = toCsv(report.rows, [
      { key: 'division', header: 'Division', value: (r) => r.division },
      { key: 'title', header: 'Action', value: (r) => r.actionTitle },
      { key: 'priority', header: 'Priority', value: (r) => r.priority },
      { key: 'status', header: 'Status', value: (r) => r.status },
      { key: 'assigned', header: 'Assigned to', value: (r) => r.assignedTo },
      { key: 'createdBy', header: 'Issued by', value: (r) => r.createdBy },
      { key: 'due', header: 'Due date', value: (r) => r.dueDate },
      { key: 'overdue', header: 'Overdue', value: (r) => (r.overdue ? 'YES' : 'NO') },
      { key: 'impact', header: 'Expected impact', value: (r) => r.expectedImpact },
    ]);
    return csvResponse(`management-actions-${report.estate.name}.csv`, csv);
  }

  return ok(report);
});
