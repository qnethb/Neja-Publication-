import { prisma } from './prisma';
import type { DivisionInput } from './kpi';

/** Loads every record the KPI engine needs for a set of divisions. */
export async function loadDivisionInputs(where: {
  estateId?: string;
  estateIds?: string[] | null;
  divisionId?: string;
  divisionIds?: string[];
  crop?: string;
}): Promise<DivisionInput[]> {
  const divisions = await prisma.division.findMany({
    where: {
      ...(where.estateId ? { estateId: where.estateId } : {}),
      ...(where.estateIds ? { estateId: { in: where.estateIds } } : {}),
      ...(where.divisionId ? { id: where.divisionId } : {}),
      ...(where.divisionIds ? { id: { in: where.divisionIds } } : {}),
      ...(where.crop ? { primaryCrop: where.crop } : {}),
    },
    orderBy: { name: 'asc' },
    include: {
      estate: { select: { id: true, name: true, code: true, group: { select: { name: true } } } },
      cropHistory: { orderBy: { seasonStart: 'desc' } },
      operations: { orderBy: { date: 'desc' } },
      soilWeather: { orderBy: { date: 'desc' } },
      recommendations: { select: { status: true, dueDate: true } },
    },
  });

  return divisions.map((d) => ({
    id: d.id,
    name: d.name,
    areaHa: d.areaHa,
    plantingYear: d.plantingYear,
    primaryCrop: d.primaryCrop,
    estateId: d.estateId,
    estateName: d.estate.name,
    cropHistory: d.cropHistory.map((h) => ({
      season: h.season,
      seasonStart: h.seasonStart,
      seasonEnd: h.seasonEnd,
      expectedYieldKgHa: h.expectedYieldKgHa,
      actualYieldKgHa: h.actualYieldKgHa,
    })),
    operations: d.operations.map((o) => ({
      date: o.date,
      costLkr: o.costLkr,
      laborHours: o.laborHours,
    })),
    soilWeather: d.soilWeather.map((s) => ({
      date: s.date,
      potassiumPpm: s.potassiumPpm,
      rainfallMm: s.rainfallMm,
      pH: s.pH,
      organicMatterPct: s.organicMatterPct,
    })),
    recommendations: d.recommendations.map((r) => ({ status: r.status, dueDate: r.dueDate })),
  }));
}

export async function estateHeader(estateId: string) {
  return prisma.estate.findUnique({
    where: { id: estateId },
    include: {
      group: { select: { id: true, name: true, region: true } },
      manager: { select: { id: true, name: true, email: true } },
      assistantManager: { select: { id: true, name: true } },
    },
  });
}
