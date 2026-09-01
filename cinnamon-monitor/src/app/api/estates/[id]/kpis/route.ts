import { NextRequest } from 'next/server';
import { assert, requireUser, handler, ok } from '@/lib/http';
import { canViewEstate } from '@/lib/rbac';
import { loadDivisionInputs, estateHeader } from '@/lib/queries';
import { availableSeasons, computeEstateKpis } from '@/lib/kpi';
import { seasonStartYear } from '@/lib/domain';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export const GET = handler(async (req: NextRequest, { params }: { params: { id: string } }) => {
  const user = await requireUser();
  assert(await canViewEstate(user, params.id), 403, 'No access to this estate');

  const estate = await estateHeader(params.id);
  assert(estate, 404, 'Estate not found');

  const season = req.nextUrl.searchParams.get('season');
  const divisions = await loadDivisionInputs({ estateId: params.id, crop: 'CINNAMON' });
  const { kpis, divisions: metrics } = computeEstateKpis(params.id, divisions, season);

  // Estate level yield trend, area weighted per season.
  const seasons = availableSeasons(divisions).sort((a, b) => seasonStartYear(a) - seasonStartYear(b));
  const trend = seasons.map((s) => {
    const rows = divisions.flatMap((d) => {
      const h = d.cropHistory.find((x) => x.season === s);
      return h ? [{ ...h, areaHa: d.areaHa }] : [];
    });
    const area = rows.reduce((acc, r) => acc + r.areaHa, 0);
    const actualRows = rows.filter((r) => r.actualYieldKgHa !== null);
    const actualArea = actualRows.reduce((acc, r) => acc + r.areaHa, 0);
    return {
      season: s,
      forecastKgHa: area ? Number((rows.reduce((a, r) => a + r.expectedYieldKgHa * r.areaHa, 0) / area).toFixed(1)) : null,
      actualKgHa: actualArea
        ? Number((actualRows.reduce((a, r) => a + (r.actualYieldKgHa as number) * r.areaHa, 0) / actualArea).toFixed(1))
        : null,
    };
  });

  const alerts = buildAlerts(metrics);

  return ok({
    estate: {
      id: estate.id,
      name: estate.name,
      code: estate.code,
      group: estate.group,
      manager: estate.manager,
      assistantManager: estate.assistantManager,
      totalAreaHa: estate.totalAreaHa,
      mainCrops: estate.mainCrops.split(',').filter(Boolean),
    },
    kpis,
    divisions: metrics,
    trend,
    seasons: availableSeasons(divisions),
    alerts,
  });
});

function buildAlerts(metrics: ReturnType<typeof computeEstateKpis>['divisions']) {
  const alerts: { severity: 'HIGH' | 'MEDIUM'; divisionId: string; division: string; message: string }[] = [];

  metrics.forEach((m) => {
    if (m.riskLevel === 'HIGH') {
      alerts.push({
        severity: 'HIGH',
        divisionId: m.divisionId,
        division: m.name,
        message: `Risk index ${m.riskIndex}: ${m.riskDrivers[0] ?? 'multiple agronomic stress factors'}`,
      });
    }
    if (m.yieldVariancePct !== null && m.yieldVariancePct <= -10) {
      alerts.push({
        severity: 'HIGH',
        divisionId: m.divisionId,
        division: m.name,
        message: `Last season yield ${m.yieldVariancePct}% below forecast`,
      });
    }
    if (m.overdueRecommendations > 0) {
      alerts.push({
        severity: 'MEDIUM',
        divisionId: m.divisionId,
        division: m.name,
        message: `${m.overdueRecommendations} overdue management action(s)`,
      });
    }
    if (m.latestPotassiumPpm !== null && m.latestPotassiumPpm < 130) {
      alerts.push({
        severity: 'MEDIUM',
        divisionId: m.divisionId,
        division: m.name,
        message: `Soil potassium at ${m.latestPotassiumPpm} ppm — corrective dressing needed`,
      });
    }
  });

  const order = { HIGH: 0, MEDIUM: 1 } as const;
  return alerts.sort((a, b) => order[a.severity] - order[b.severity]).slice(0, 5);
}
