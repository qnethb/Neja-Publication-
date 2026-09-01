import { AGRONOMY_BASELINES, seasonStartYear, standAgeYears } from './domain';
import { predictYield } from './prediction';
import type { RiskLevel } from './domain';

// Structural input types so the KPI maths stays independent of Prisma types and
// can be lifted straight into a no-code formula layer.
export type CropHistoryRecord = {
  season: string;
  seasonStart: Date;
  seasonEnd: Date;
  expectedYieldKgHa: number;
  actualYieldKgHa: number | null;
};

export type OperationRecord = { date: Date; costLkr: number; laborHours: number };

export type SnapshotRecord = {
  date: Date;
  potassiumPpm: number | null;
  rainfallMm: number | null;
  pH: number | null;
  organicMatterPct: number | null;
};

export type RecommendationRecord = { status: string; dueDate: Date | null };

export type DivisionInput = {
  id: string;
  name: string;
  areaHa: number;
  plantingYear: number;
  primaryCrop: string;
  estateId: string;
  estateName?: string;
  cropHistory: CropHistoryRecord[];
  operations: OperationRecord[];
  soilWeather: SnapshotRecord[];
  recommendations: RecommendationRecord[];
};

export type DivisionMetrics = {
  divisionId: string;
  name: string;
  estateId: string;
  estateName?: string;
  areaHa: number;
  plantingYear: number;
  standAgeYears: number;
  season: string | null;
  forecastYieldKgHa: number | null;
  predictedYieldKgHa: number | null;
  predictionConfidencePct: number | null;
  lastCompletedSeason: string | null;
  lastSeasonYieldKgHa: number | null;
  yieldVariancePct: number | null;
  varianceVsTargetPct: number | null;
  forecastAccuracyPct: number | null;
  costPerKgLkr: number | null;
  totalProducedKg: number | null;
  openRecommendations: number;
  overdueRecommendations: number;
  recommendationCompletionRatePct: number | null;
  latestPotassiumPpm: number | null;
  seasonRainfallMm: number | null;
  riskIndex: number;
  riskLevel: RiskLevel;
  riskDrivers: string[];
};

export type EstateKpis = {
  estateId: string;
  season: string | null;
  lastCompletedSeason: string | null;
  divisionCount: number;
  cinnamonAreaHa: number;
  forecastedYieldKgHa: number | null;
  actualYieldKgHa: number | null;
  yieldVariancePct: number | null;
  forecastAccuracyPct: number | null;
  costPerKgLkr: number | null;
  recommendationCompletionRatePct: number | null;
  riskIndex: number;
  riskLevel: RiskLevel;
  predictedYieldKgHa: number | null;
  totalProducedKg: number | null;
};

const round = (v: number, dp = 1) => Number(v.toFixed(dp));

export function sortSeasonsDesc(seasons: string[]): string[] {
  return Array.from(new Set(seasons)).sort((a, b) => seasonStartYear(b) - seasonStartYear(a));
}

export function availableSeasons(divisions: DivisionInput[]): string[] {
  return sortSeasonsDesc(divisions.flatMap((d) => d.cropHistory.map((h) => h.season)));
}

/** Newest season that already has an actual yield recorded. */
export function latestCompletedSeason(divisions: DivisionInput[]): string | null {
  const seasons = sortSeasonsDesc(
    divisions.flatMap((d) =>
      d.cropHistory.filter((h) => h.actualYieldKgHa !== null).map((h) => h.season),
    ),
  );
  return seasons[0] ?? null;
}

export function computeDivisionMetrics(
  division: DivisionInput,
  season?: string | null,
  now: Date = new Date(),
): DivisionMetrics {
  const historyDesc = [...division.cropHistory].sort(
    (a, b) => seasonStartYear(b.season) - seasonStartYear(a.season),
  );
  const targetSeason = season ?? historyDesc[0]?.season ?? null;
  const current = targetSeason ? historyDesc.find((h) => h.season === targetSeason) ?? null : null;

  const completed = historyDesc.filter((h) => h.actualYieldKgHa !== null);
  const lastCompleted = completed[0] ?? null;

  const age = standAgeYears(division.plantingYear, now);
  const seasonWindow = current ?? lastCompleted;

  const snapshotsInWindow = seasonWindow
    ? division.soilWeather.filter(
        (s) => s.date >= seasonWindow.seasonStart && s.date <= seasonWindow.seasonEnd,
      )
    : [];
  const snapshotPool = snapshotsInWindow.length > 0 ? snapshotsInWindow : division.soilWeather;

  const seasonRainfallMm = sum(snapshotPool.map((s) => s.rainfallMm));
  const latestPotassiumPpm = latestValue(division.soilWeather, (s) => s.potassiumPpm);
  const avgRainfallForModel = averageSeasonRainfall(division);

  const prediction =
    division.cropHistory.length > 0 || current
      ? predictYield({
          recentActualYields: completed.map((h) => h.actualYieldKgHa as number),
          fallbackYieldKgHa: current?.expectedYieldKgHa ?? AGRONOMY_BASELINES.targetYieldKgHa,
          avgRainfallMm: avgRainfallForModel,
          potassiumPpm: latestPotassiumPpm,
          standAgeYears: age,
        })
      : null;

  const actual = lastCompleted?.actualYieldKgHa ?? null;
  const expectedForActual = lastCompleted?.expectedYieldKgHa ?? null;
  const yieldVariancePct =
    actual !== null && expectedForActual ? ((actual - expectedForActual) / expectedForActual) * 100 : null;
  const varianceVsTargetPct =
    actual !== null
      ? ((actual - AGRONOMY_BASELINES.targetYieldKgHa) / AGRONOMY_BASELINES.targetYieldKgHa) * 100
      : null;

  const forecastAccuracyPct = accuracyOver(completed);

  const costWindow = lastCompleted ?? current;
  let costPerKgLkr: number | null = null;
  let totalProducedKg: number | null = null;
  if (costWindow) {
    const yieldKgHa = costWindow.actualYieldKgHa ?? costWindow.expectedYieldKgHa;
    totalProducedKg = yieldKgHa * division.areaHa;
    const cost = division.operations
      .filter((o) => o.date >= costWindow.seasonStart && o.date <= costWindow.seasonEnd)
      .reduce((acc, o) => acc + o.costLkr, 0);
    if (totalProducedKg > 0 && cost > 0) costPerKgLkr = cost / totalProducedKg;
  }

  const recs = division.recommendations;
  const completedRecs = recs.filter((r) => r.status === 'COMPLETED').length;
  const overdue = recs.filter((r) => isOverdue(r, now)).length;
  const open = recs.filter((r) => r.status !== 'COMPLETED').length;

  const risk = riskIndexFor({
    potassiumPpm: latestPotassiumPpm,
    rainfallMm: avgRainfallForModel,
    standAgeYears: age,
  });

  return {
    divisionId: division.id,
    name: division.name,
    estateId: division.estateId,
    estateName: division.estateName,
    areaHa: division.areaHa,
    plantingYear: division.plantingYear,
    standAgeYears: age,
    season: targetSeason,
    forecastYieldKgHa: current ? round(current.expectedYieldKgHa) : null,
    predictedYieldKgHa: prediction ? prediction.predictedYieldKgHa : null,
    predictionConfidencePct: prediction ? prediction.confidencePct : null,
    lastCompletedSeason: lastCompleted?.season ?? null,
    lastSeasonYieldKgHa: actual !== null ? round(actual) : null,
    yieldVariancePct: yieldVariancePct !== null ? round(yieldVariancePct) : null,
    varianceVsTargetPct: varianceVsTargetPct !== null ? round(varianceVsTargetPct) : null,
    forecastAccuracyPct,
    costPerKgLkr: costPerKgLkr !== null ? round(costPerKgLkr, 2) : null,
    totalProducedKg: totalProducedKg !== null ? round(totalProducedKg) : null,
    openRecommendations: open,
    overdueRecommendations: overdue,
    recommendationCompletionRatePct: recs.length ? round((completedRecs / recs.length) * 100) : null,
    latestPotassiumPpm,
    seasonRainfallMm: seasonRainfallMm !== null ? round(seasonRainfallMm) : null,
    riskIndex: risk.index,
    riskLevel: risk.level,
    riskDrivers: risk.drivers,
  };
}

export function computeEstateKpis(
  estateId: string,
  divisions: DivisionInput[],
  season?: string | null,
  now: Date = new Date(),
): { kpis: EstateKpis; divisions: DivisionMetrics[] } {
  const cinnamon = divisions.filter((d) => d.primaryCrop === 'CINNAMON');
  const targetSeason = season ?? availableSeasons(cinnamon)[0] ?? null;
  const metrics = cinnamon.map((d) => computeDivisionMetrics(d, targetSeason, now));

  const cinnamonAreaHa = round(sumNumbers(cinnamon.map((d) => d.areaHa)), 2);

  const forecastedYieldKgHa = weightedAverage(
    metrics.map((m) => [m.forecastYieldKgHa, m.areaHa] as const),
  );
  const actualYieldKgHa = weightedAverage(
    metrics.map((m) => [m.lastSeasonYieldKgHa, m.areaHa] as const),
  );
  const predictedYieldKgHa = weightedAverage(
    metrics.map((m) => [m.predictedYieldKgHa, m.areaHa] as const),
  );
  const forecastAccuracyPct = weightedAverage(
    metrics.map((m) => [m.forecastAccuracyPct, m.areaHa] as const),
  );

  // Variance compares the actual of the last completed season against the
  // forecast that was set for that same season.
  const lastSeason = latestCompletedSeason(cinnamon);
  const varianceParts = cinnamon.flatMap((d) => {
    const row = d.cropHistory.find((h) => h.season === lastSeason && h.actualYieldKgHa !== null);
    if (!row) return [];
    return [
      {
        expected: row.expectedYieldKgHa * d.areaHa,
        actual: (row.actualYieldKgHa as number) * d.areaHa,
      },
    ];
  });
  const expectedTotal = sumNumbers(varianceParts.map((p) => p.expected));
  const actualTotal = sumNumbers(varianceParts.map((p) => p.actual));
  const yieldVariancePct =
    expectedTotal > 0 ? round(((actualTotal - expectedTotal) / expectedTotal) * 100) : null;

  const totalCost = sumNumbers(
    cinnamon.flatMap((d) => {
      const row = d.cropHistory.find((h) => h.season === lastSeason);
      if (!row) return [];
      return d.operations
        .filter((o) => o.date >= row.seasonStart && o.date <= row.seasonEnd)
        .map((o) => o.costLkr);
    }),
  );
  const totalProducedKg = actualTotal;
  const costPerKgLkr = totalProducedKg > 0 && totalCost > 0 ? round(totalCost / totalProducedKg, 2) : null;

  const allRecs = cinnamon.flatMap((d) => d.recommendations);
  const recommendationCompletionRatePct = allRecs.length
    ? round((allRecs.filter((r) => r.status === 'COMPLETED').length / allRecs.length) * 100)
    : null;

  const riskIndex = metrics.length
    ? round(weightedAverage(metrics.map((m) => [m.riskIndex, m.areaHa] as const)) ?? 0)
    : 0;

  return {
    kpis: {
      estateId,
      season: targetSeason,
      lastCompletedSeason: lastSeason,
      divisionCount: cinnamon.length,
      cinnamonAreaHa,
      forecastedYieldKgHa: nullableRound(forecastedYieldKgHa),
      actualYieldKgHa: nullableRound(actualYieldKgHa),
      yieldVariancePct,
      forecastAccuracyPct: nullableRound(forecastAccuracyPct),
      costPerKgLkr,
      recommendationCompletionRatePct,
      riskIndex,
      riskLevel: riskLevelFor(riskIndex),
      predictedYieldKgHa: nullableRound(predictedYieldKgHa),
      totalProducedKg: totalProducedKg > 0 ? round(totalProducedKg) : null,
    },
    divisions: metrics,
  };
}

/**
 * Composite risk index (0 = safe, 100 = critical) built from the three drivers
 * management asked for: low soil potassium, low rainfall and ageing stands.
 */
export function riskIndexFor(input: {
  potassiumPpm: number | null;
  rainfallMm: number | null;
  standAgeYears: number;
}): { index: number; level: RiskLevel; drivers: string[] } {
  const drivers: string[] = [];

  const kDeficit =
    input.potassiumPpm === null
      ? 0.35
      : clamp01((AGRONOMY_BASELINES.potassiumPpm - input.potassiumPpm) / AGRONOMY_BASELINES.potassiumPpm);
  if (input.potassiumPpm === null) drivers.push('No recent soil potassium reading');
  else if (kDeficit > 0.15) drivers.push(`Soil K ${Math.round(input.potassiumPpm)} ppm below 150 ppm baseline`);

  const rainDeficit =
    input.rainfallMm === null
      ? 0.35
      : clamp01((AGRONOMY_BASELINES.rainfallMm - input.rainfallMm) / AGRONOMY_BASELINES.rainfallMm);
  if (input.rainfallMm === null) drivers.push('No rainfall record for the season');
  else if (rainDeficit > 0.1) drivers.push(`Rainfall ${Math.round(input.rainfallMm)} mm below 1800 mm baseline`);

  const ageStress = clamp01((input.standAgeYears - 15) / 15);
  if (ageStress > 0) drivers.push(`Ageing stand (${input.standAgeYears} years)`);

  const index = round(kDeficit * 40 + rainDeficit * 35 + ageStress * 25);
  return { index, level: riskLevelFor(index), drivers };
}

export function riskLevelFor(index: number): RiskLevel {
  if (index < 25) return 'LOW';
  if (index < 50) return 'MEDIUM';
  return 'HIGH';
}

export function isOverdue(rec: RecommendationRecord, now: Date = new Date()): boolean {
  if (rec.status === 'COMPLETED') return false;
  if (rec.status === 'OVERDUE') return true;
  return !!rec.dueDate && rec.dueDate < now;
}

function accuracyOver(completed: CropHistoryRecord[]): number | null {
  const usable = completed.filter((h) => h.expectedYieldKgHa > 0 && h.actualYieldKgHa !== null);
  if (usable.length === 0) return null;
  const errors = usable.map(
    (h) => Math.abs((h.actualYieldKgHa as number) - h.expectedYieldKgHa) / h.expectedYieldKgHa,
  );
  const meanError = errors.reduce((a, b) => a + b, 0) / errors.length;
  return round(Math.max(0, Math.min(100, (1 - meanError) * 100)));
}

/** Mean rainfall per season, used as the model's rainfall driver. */
function averageSeasonRainfall(division: DivisionInput): number | null {
  const totals = division.cropHistory
    .map((h) =>
      sum(
        division.soilWeather
          .filter((s) => s.date >= h.seasonStart && s.date <= h.seasonEnd)
          .map((s) => s.rainfallMm),
      ),
    )
    .filter((v): v is number => v !== null && v > 0);
  if (totals.length === 0) return null;
  return round(totals.reduce((a, b) => a + b, 0) / totals.length);
}

function latestValue<T>(rows: SnapshotRecord[], pick: (row: SnapshotRecord) => number | null): number | null {
  const sorted = [...rows].sort((a, b) => b.date.getTime() - a.date.getTime());
  for (const row of sorted) {
    const value = pick(row);
    if (value !== null && value !== undefined) return value;
  }
  return null;
}

function sum(values: (number | null)[]): number | null {
  const usable = values.filter((v): v is number => v !== null && v !== undefined);
  if (usable.length === 0) return null;
  return usable.reduce((a, b) => a + b, 0);
}

function sumNumbers(values: number[]): number {
  return values.reduce((a, b) => a + b, 0);
}

function weightedAverage(pairs: (readonly [number | null, number])[]): number | null {
  const usable = pairs.filter((p): p is readonly [number, number] => p[0] !== null && p[1] > 0);
  if (usable.length === 0) return null;
  const weight = usable.reduce((acc, [, w]) => acc + w, 0);
  if (weight === 0) return null;
  return usable.reduce((acc, [v, w]) => acc + v * w, 0) / weight;
}

function nullableRound(value: number | null, dp = 1): number | null {
  return value === null ? null : round(value, dp);
}

function clamp01(value: number): number {
  return Math.min(1, Math.max(0, value));
}
