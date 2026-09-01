import { prisma } from './prisma';
import {
  computeEstateKpis,
  isOverdue,
  latestCompletedSeason,
  type DivisionMetrics,
  type EstateKpis,
} from './kpi';
import { loadDivisionInputs, estateHeader } from './queries';
import { seasonStartYear } from './domain';

export type EstateSeasonPerformanceReport = {
  generatedAt: string;
  estate: { id: string; name: string; code: string; group: string; manager: string | null };
  season: string | null;
  kpis: EstateKpis;
  divisions: DivisionMetrics[];
  seasonRows: {
    divisionId: string;
    division: string;
    areaHa: number;
    expectedYieldKgHa: number | null;
    actualYieldKgHa: number | null;
    variancePct: number | null;
    producedKg: number | null;
    costLkr: number;
    costPerKgLkr: number | null;
  }[];
};

export async function buildEstateSeasonPerformance(
  estateId: string,
  season?: string | null,
): Promise<EstateSeasonPerformanceReport> {
  const estate = await estateHeader(estateId);
  if (!estate) throw new Error('Estate not found');

  const divisions = await loadDivisionInputs({ estateId, crop: 'CINNAMON' });
  // Without an explicit season the report covers the last closed season, so the
  // actual, variance and cost columns are populated rather than blank.
  const targetSeason = season ?? latestCompletedSeason(divisions);
  const { kpis, divisions: metrics } = computeEstateKpis(estateId, divisions, targetSeason);

  const seasonRows = divisions.map((d) => {
    const row = d.cropHistory.find((h) => h.season === targetSeason) ?? null;
    const yieldKgHa = row?.actualYieldKgHa ?? row?.expectedYieldKgHa ?? null;
    const producedKg = yieldKgHa !== null ? Number((yieldKgHa * d.areaHa).toFixed(0)) : null;
    const costLkr = row
      ? d.operations
          .filter((o) => o.date >= row.seasonStart && o.date <= row.seasonEnd)
          .reduce((acc, o) => acc + o.costLkr, 0)
      : 0;
    const variancePct =
      row && row.actualYieldKgHa !== null && row.expectedYieldKgHa > 0
        ? Number((((row.actualYieldKgHa - row.expectedYieldKgHa) / row.expectedYieldKgHa) * 100).toFixed(1))
        : null;
    return {
      divisionId: d.id,
      division: d.name,
      areaHa: d.areaHa,
      expectedYieldKgHa: row?.expectedYieldKgHa ?? null,
      actualYieldKgHa: row?.actualYieldKgHa ?? null,
      variancePct,
      producedKg,
      costLkr: Number(costLkr.toFixed(0)),
      costPerKgLkr: producedKg && costLkr > 0 ? Number((costLkr / producedKg).toFixed(2)) : null,
    };
  });

  return {
    generatedAt: new Date().toISOString(),
    estate: {
      id: estate.id,
      name: estate.name,
      code: estate.code,
      group: estate.group.name,
      manager: estate.manager?.name ?? null,
    },
    season: targetSeason,
    kpis,
    divisions: metrics,
    seasonRows,
  };
}

export type ForecastAccuracyReport = {
  generatedAt: string;
  estate: { id: string; name: string };
  rows: {
    divisionId: string;
    division: string;
    season: string;
    expectedYieldKgHa: number;
    actualYieldKgHa: number | null;
    absErrorKgHa: number | null;
    accuracyPct: number | null;
  }[];
  bySeason: { season: string; expectedKgHa: number; actualKgHa: number; accuracyPct: number }[];
  overallAccuracyPct: number | null;
};

export async function buildForecastAccuracy(estateId: string): Promise<ForecastAccuracyReport> {
  const estate = await estateHeader(estateId);
  if (!estate) throw new Error('Estate not found');
  const divisions = await loadDivisionInputs({ estateId, crop: 'CINNAMON' });

  const rows = divisions
    .flatMap((d) =>
      d.cropHistory.map((h) => {
        const absError =
          h.actualYieldKgHa !== null ? Math.abs(h.actualYieldKgHa - h.expectedYieldKgHa) : null;
        return {
          divisionId: d.id,
          division: d.name,
          season: h.season,
          expectedYieldKgHa: h.expectedYieldKgHa,
          actualYieldKgHa: h.actualYieldKgHa,
          absErrorKgHa: absError !== null ? Number(absError.toFixed(1)) : null,
          accuracyPct:
            absError !== null && h.expectedYieldKgHa > 0
              ? Number(Math.max(0, (1 - absError / h.expectedYieldKgHa) * 100).toFixed(1))
              : null,
          areaHa: d.areaHa,
        };
      }),
    )
    .sort((a, b) => seasonStartYear(b.season) - seasonStartYear(a.season) || a.division.localeCompare(b.division));

  const seasons = Array.from(new Set(rows.map((r) => r.season))).sort(
    (a, b) => seasonStartYear(a) - seasonStartYear(b),
  );
  const bySeason = seasons.flatMap((season) => {
    const seasonRows = rows.filter((r) => r.season === season && r.actualYieldKgHa !== null);
    if (seasonRows.length === 0) return [];
    const area = seasonRows.reduce((acc, r) => acc + r.areaHa, 0);
    const expectedKgHa = seasonRows.reduce((acc, r) => acc + r.expectedYieldKgHa * r.areaHa, 0) / area;
    const actualKgHa =
      seasonRows.reduce((acc, r) => acc + (r.actualYieldKgHa as number) * r.areaHa, 0) / area;
    const accuracyPct = Math.max(0, (1 - Math.abs(actualKgHa - expectedKgHa) / expectedKgHa) * 100);
    return [
      {
        season,
        expectedKgHa: Number(expectedKgHa.toFixed(1)),
        actualKgHa: Number(actualKgHa.toFixed(1)),
        accuracyPct: Number(accuracyPct.toFixed(1)),
      },
    ];
  });

  const scored = rows.filter((r) => r.accuracyPct !== null);
  const overallAccuracyPct = scored.length
    ? Number((scored.reduce((acc, r) => acc + (r.accuracyPct as number), 0) / scored.length).toFixed(1))
    : null;

  return {
    generatedAt: new Date().toISOString(),
    estate: { id: estate.id, name: estate.name },
    rows: rows.map(({ areaHa, ...rest }) => rest),
    bySeason,
    overallAccuracyPct,
  };
}

export type SoilNutritionReport = {
  generatedAt: string;
  estate: { id: string; name: string };
  rows: {
    divisionId: string;
    division: string;
    date: string;
    source: string;
    pH: number | null;
    nitrogenPpm: number | null;
    phosphorusPpm: number | null;
    potassiumPpm: number | null;
    organicMatterPct: number | null;
    rainfallMm: number | null;
    tempC: number | null;
    flags: string[];
  }[];
};

export async function buildSoilNutrition(estateId: string): Promise<SoilNutritionReport> {
  const estate = await estateHeader(estateId);
  if (!estate) throw new Error('Estate not found');

  const snapshots = await prisma.soilWeatherSnapshot.findMany({
    where: { division: { estateId, primaryCrop: 'CINNAMON' } },
    include: { division: { select: { id: true, name: true } } },
    orderBy: [{ date: 'desc' }],
    take: 300,
  });

  return {
    generatedAt: new Date().toISOString(),
    estate: { id: estate.id, name: estate.name },
    rows: snapshots.map((s) => ({
      divisionId: s.division.id,
      division: s.division.name,
      date: s.date.toISOString().slice(0, 10),
      source: s.source,
      pH: s.pH,
      nitrogenPpm: s.nitrogenPpm,
      phosphorusPpm: s.phosphorusPpm,
      potassiumPpm: s.potassiumPpm,
      organicMatterPct: s.organicMatterPct,
      rainfallMm: s.rainfallMm,
      tempC: s.tempC,
      flags: soilFlags(s),
    })),
  };
}

function soilFlags(s: {
  pH: number | null;
  potassiumPpm: number | null;
  organicMatterPct: number | null;
  rainfallMm: number | null;
}): string[] {
  const flags: string[] = [];
  if (s.pH !== null && s.pH < 5.0) flags.push('Acidic soil (pH < 5.0)');
  if (s.potassiumPpm !== null && s.potassiumPpm < 150) flags.push('Potassium below baseline');
  if (s.organicMatterPct !== null && s.organicMatterPct < 2) flags.push('Low organic matter');
  if (s.rainfallMm !== null && s.rainfallMm < 80) flags.push('Dry month');
  return flags;
}

export type ManagementActionsReport = {
  generatedAt: string;
  estate: { id: string; name: string };
  summary: { total: number; completed: number; inProgress: number; pending: number; overdue: number; completionRatePct: number | null };
  rows: {
    id: string;
    division: string;
    priority: string;
    status: string;
    actionTitle: string;
    actionDescription: string;
    rationale: string | null;
    expectedImpact: string | null;
    assignedTo: string | null;
    createdBy: string | null;
    dueDate: string | null;
    createdAt: string;
    overdue: boolean;
  }[];
};

export async function buildManagementActions(estateId: string): Promise<ManagementActionsReport> {
  const estate = await estateHeader(estateId);
  if (!estate) throw new Error('Estate not found');

  const recs = await prisma.recommendation.findMany({
    where: { division: { estateId } },
    include: {
      division: { select: { name: true } },
      assignedTo: { select: { name: true } },
      createdBy: { select: { name: true } },
    },
    orderBy: [{ status: 'asc' }, { dueDate: 'asc' }],
  });

  const now = new Date();
  const rows = recs.map((r) => ({
    id: r.id,
    division: r.division.name,
    priority: r.priority,
    status: r.status,
    actionTitle: r.actionTitle,
    actionDescription: r.actionDescription,
    rationale: r.rationale,
    expectedImpact: r.expectedImpact,
    assignedTo: r.assignedTo?.name ?? null,
    createdBy: r.createdBy?.name ?? null,
    dueDate: r.dueDate ? r.dueDate.toISOString().slice(0, 10) : null,
    createdAt: r.createdAt.toISOString().slice(0, 10),
    overdue: isOverdue({ status: r.status, dueDate: r.dueDate }, now),
  }));

  const completed = rows.filter((r) => r.status === 'COMPLETED').length;
  return {
    generatedAt: new Date().toISOString(),
    estate: { id: estate.id, name: estate.name },
    summary: {
      total: rows.length,
      completed,
      inProgress: rows.filter((r) => r.status === 'IN_PROGRESS').length,
      pending: rows.filter((r) => r.status === 'PENDING').length,
      overdue: rows.filter((r) => r.overdue).length,
      completionRatePct: rows.length ? Number(((completed / rows.length) * 100).toFixed(1)) : null,
    },
    rows,
  };
}
