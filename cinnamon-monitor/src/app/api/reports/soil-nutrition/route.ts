import { NextRequest } from 'next/server';
import { assert, requireUser, handler, ok } from '@/lib/http';
import { canViewEstate } from '@/lib/rbac';
import { buildSoilNutrition } from '@/lib/reports';
import { csvResponse, toCsv } from '@/lib/csv';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export const GET = handler(async (req: NextRequest) => {
  const user = await requireUser();
  const estateId = req.nextUrl.searchParams.get('estateId');
  assert(estateId, 400, 'estateId is required');
  assert(await canViewEstate(user, estateId), 403, 'No access to this estate');

  const report = await buildSoilNutrition(estateId);

  if ((req.nextUrl.searchParams.get('format') ?? 'json').toLowerCase() === 'csv') {
    const csv = toCsv(report.rows, [
      { key: 'division', header: 'Division', value: (r) => r.division },
      { key: 'date', header: 'Date', value: (r) => r.date },
      { key: 'source', header: 'Source', value: (r) => r.source },
      { key: 'pH', header: 'pH', value: (r) => r.pH },
      { key: 'n', header: 'Nitrogen (ppm)', value: (r) => r.nitrogenPpm },
      { key: 'p', header: 'Phosphorus (ppm)', value: (r) => r.phosphorusPpm },
      { key: 'k', header: 'Potassium (ppm)', value: (r) => r.potassiumPpm },
      { key: 'om', header: 'Organic matter (%)', value: (r) => r.organicMatterPct },
      { key: 'rain', header: 'Rainfall (mm)', value: (r) => r.rainfallMm },
      { key: 'temp', header: 'Temperature (C)', value: (r) => r.tempC },
      { key: 'flags', header: 'Flags', value: (r) => r.flags.join('; ') },
    ]);
    return csvResponse(`soil-nutrition-${report.estate.name}.csv`, csv);
  }

  return ok(report);
});
