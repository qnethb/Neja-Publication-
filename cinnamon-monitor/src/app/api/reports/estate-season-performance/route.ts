import { NextRequest } from 'next/server';
import { assert, requireUser, handler, ok } from '@/lib/http';
import { canViewEstate } from '@/lib/rbac';
import { buildEstateSeasonPerformance } from '@/lib/reports';
import { csvResponse, toCsv } from '@/lib/csv';
import { estateSeasonPerformancePdf } from '@/lib/pdf';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export const GET = handler(async (req: NextRequest) => {
  const user = await requireUser();
  const sp = req.nextUrl.searchParams;
  const estateId = sp.get('estateId');
  assert(estateId, 400, 'estateId is required');
  assert(await canViewEstate(user, estateId), 403, 'No access to this estate');

  const report = await buildEstateSeasonPerformance(estateId, sp.get('season'));
  const format = (sp.get('format') ?? 'json').toLowerCase();
  const slug = `${report.estate.code}-season-${(report.season ?? 'na').replace('/', '-')}`;

  if (format === 'csv') {
    const csv = toCsv(report.seasonRows, [
      { key: 'division', header: 'Division', value: (r) => r.division },
      { key: 'areaHa', header: 'Area (ha)', value: (r) => r.areaHa },
      { key: 'expected', header: 'Forecast yield (kg/ha)', value: (r) => r.expectedYieldKgHa },
      { key: 'actual', header: 'Actual yield (kg/ha)', value: (r) => r.actualYieldKgHa },
      { key: 'variance', header: 'Variance (%)', value: (r) => r.variancePct },
      { key: 'produced', header: 'Produced (kg)', value: (r) => r.producedKg },
      { key: 'cost', header: 'Field cost (LKR)', value: (r) => r.costLkr },
      { key: 'costPerKg', header: 'Cost per kg (LKR)', value: (r) => r.costPerKgLkr },
    ]);
    return csvResponse(`${slug}-performance.csv`, csv);
  }

  if (format === 'pdf') {
    const pdf = await estateSeasonPerformancePdf(report);
    return new Response(new Uint8Array(pdf), {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${slug}-performance.pdf"`,
      },
    });
  }

  return ok(report);
});
