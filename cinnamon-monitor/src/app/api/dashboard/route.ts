import { prisma } from '@/lib/prisma';
import { requireUser, handler, ok } from '@/lib/http';
import { accessibleDivisionIds, accessibleEstateIds, isDivisionScoped } from '@/lib/rbac';
import { loadDivisionInputs } from '@/lib/queries';
import { computeEstateKpis, isOverdue, type DivisionMetrics } from '@/lib/kpi';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/** Portfolio roll-up across every estate the signed-in user can reach. */
export const GET = handler(async () => {
  const user = await requireUser();
  const [estateIds, divisionIds] = await Promise.all([
    accessibleEstateIds(user),
    accessibleDivisionIds(user),
  ]);

  // Division-scoped roles get no estate roll-ups — their home screen is the
  // list of divisions they are responsible for.
  const estates = await prisma.estate.findMany({
    where: estateIds === null ? {} : { id: { in: estateIds } },
    orderBy: { name: 'asc' },
    include: { group: { select: { id: true, name: true, region: true } } },
  });

  const divisions = await loadDivisionInputs({
    divisionIds: divisionIds === null ? undefined : divisionIds,
    crop: 'CINNAMON',
  });

  const perEstate = estates.map((estate) => {
    const own = divisions.filter((d) => d.estateId === estate.id);
    const { kpis, divisions: metrics } = computeEstateKpis(estate.id, own);
    return {
      estate: { id: estate.id, name: estate.name, code: estate.code, group: estate.group },
      kpis,
      divisions: metrics,
    };
  });

  // Metrics come from the division scope so that division-scoped roles, which
  // have no estate roll-ups, still get a portfolio summary.
  const allMetrics: DivisionMetrics[] = computeEstateKpis('', divisions).divisions;
  const totalArea = allMetrics.reduce((acc, m) => acc + m.areaHa, 0);
  const weighted = (pick: (m: DivisionMetrics) => number | null) => {
    const rows = allMetrics.filter((m) => pick(m) !== null);
    const area = rows.reduce((acc, m) => acc + m.areaHa, 0);
    if (!area) return null;
    return Number((rows.reduce((acc, m) => acc + (pick(m) as number) * m.areaHa, 0) / area).toFixed(1));
  };

  const recs = divisions.flatMap((d) => d.recommendations);
  const now = new Date();

  return ok({
    scope: estateIds === null ? 'GLOBAL' : isDivisionScoped(user) ? 'DIVISION' : 'SCOPED',
    portfolio: {
      estateCount: estates.length,
      divisionCount: allMetrics.length,
      cinnamonAreaHa: Number(totalArea.toFixed(1)),
      forecastedYieldKgHa: weighted((m) => m.forecastYieldKgHa),
      predictedYieldKgHa: weighted((m) => m.predictedYieldKgHa),
      actualYieldKgHa: weighted((m) => m.lastSeasonYieldKgHa),
      forecastAccuracyPct: weighted((m) => m.forecastAccuracyPct),
      costPerKgLkr: weighted((m) => m.costPerKgLkr),
      riskIndex: weighted((m) => m.riskIndex),
      recommendationCompletionRatePct: recs.length
        ? Number(((recs.filter((r) => r.status === 'COMPLETED').length / recs.length) * 100).toFixed(1))
        : null,
      overdueRecommendations: recs.filter((r) => isOverdue(r, now)).length,
    },
    estates: perEstate.map((e) => ({ estate: e.estate, kpis: e.kpis })),
    divisions: allMetrics.slice().sort((a, b) => a.name.localeCompare(b.name)),
    watchlist: allMetrics
      .slice()
      .sort((a, b) => b.riskIndex - a.riskIndex)
      .slice(0, 6),
  });
});
