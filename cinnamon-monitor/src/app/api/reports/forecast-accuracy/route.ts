import { NextRequest } from 'next/server';
import { assert, requireUser, handler, ok } from '@/lib/http';
import { canViewEstate } from '@/lib/rbac';
import { buildForecastAccuracy } from '@/lib/reports';
import { csvResponse, toCsv } from '@/lib/csv';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export const GET = handler(async (req: NextRequest) => {
  const user = await requireUser();
  const estateId = req.nextUrl.searchParams.get('estateId');
  assert(estateId, 400, 'estateId is required');
  assert(await canViewEstate(user, estateId), 403, 'No access to this estate');

  const report = await buildForecastAccuracy(estateId);

  if ((req.nextUrl.searchParams.get('format') ?? 'json').toLowerCase() === 'csv') {
    const csv = toCsv(report.rows, [
      { key: 'division', header: 'Division', value: (r) => r.division },
      { key: 'season', header: 'Season', value: (r) => r.season },
      { key: 'expected', header: 'Forecast (kg/ha)', value: (r) => r.expectedYieldKgHa },
      { key: 'actual', header: 'Actual (kg/ha)', value: (r) => r.actualYieldKgHa },
      { key: 'error', header: 'Absolute error (kg/ha)', value: (r) => r.absErrorKgHa },
      { key: 'accuracy', header: 'Accuracy (%)', value: (r) => r.accuracyPct },
    ]);
    return csvResponse(`forecast-accuracy-${report.estate.name}.csv`, csv);
  }

  return ok(report);
});
