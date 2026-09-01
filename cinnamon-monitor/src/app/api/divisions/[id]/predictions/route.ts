import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { assert, requireUser, handler, ok } from '@/lib/http';
import { canViewDivision, canWriteDivision } from '@/lib/rbac';
import { predictYield } from '@/lib/prediction';
import { MODEL_VERSION, seasonLabel, standAgeYears } from '@/lib/domain';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

function currentSeason(now = new Date()): string {
  return seasonLabel(now.getMonth() >= 9 ? now.getFullYear() : now.getFullYear() - 1);
}

export const GET = handler(async (req: NextRequest, { params }: { params: { id: string } }) => {
  const user = await requireUser();
  assert(await canViewDivision(user, params.id), 403, 'No access to this division');

  const season = req.nextUrl.searchParams.get('season') ?? currentSeason();
  const stored = await prisma.prediction.findMany({
    where: { divisionId: params.id },
    orderBy: { createdAt: 'desc' },
  });

  const live = await computePrediction(params.id, season);
  return ok({ season, live, stored });
});

/** Recomputes the prediction for a season and persists it. */
export const POST = handler(async (req: NextRequest, { params }: { params: { id: string } }) => {
  const user = await requireUser();
  assert(await canWriteDivision(user, params.id), 403, 'Not allowed to run predictions for this division');

  const body = await req.json().catch(() => ({}));
  const season = body.season ?? currentSeason();
  const live = await computePrediction(params.id, season);
  assert(live, 404, 'Division not found');

  const saved = await prisma.prediction.upsert({
    where: {
      divisionId_season_modelVersion: {
        divisionId: params.id,
        season,
        modelVersion: MODEL_VERSION,
      },
    },
    create: {
      divisionId: params.id,
      season,
      predictedYieldKgHa: live.predictedYieldKgHa,
      confidencePct: live.confidencePct,
      modelVersion: MODEL_VERSION,
      keyDrivers: live.keyDrivers,
    },
    update: {
      predictedYieldKgHa: live.predictedYieldKgHa,
      confidencePct: live.confidencePct,
      keyDrivers: live.keyDrivers,
      createdAt: new Date(),
    },
  });

  return ok({ season, prediction: saved, factors: live.factors }, { status: 201 });
});

async function computePrediction(divisionId: string, season: string) {
  const division = await prisma.division.findUnique({
    where: { id: divisionId },
    include: {
      cropHistory: { orderBy: { seasonStart: 'desc' } },
      soilWeather: { orderBy: { date: 'desc' } },
    },
  });
  if (!division) return null;

  const completed = division.cropHistory.filter((h) => h.actualYieldKgHa !== null);
  const potassium = division.soilWeather.find((s) => s.potassiumPpm !== null)?.potassiumPpm ?? null;

  const seasonRainfalls = division.cropHistory
    .map((h) =>
      division.soilWeather
        .filter((s) => s.date >= h.seasonStart && s.date <= h.seasonEnd)
        .reduce((acc, s) => acc + (s.rainfallMm ?? 0), 0),
    )
    .filter((v) => v > 0);
  const avgRainfallMm = seasonRainfalls.length
    ? seasonRainfalls.reduce((a, b) => a + b, 0) / seasonRainfalls.length
    : null;

  const target = division.cropHistory.find((h) => h.season === season);

  return predictYield({
    recentActualYields: completed.map((h) => h.actualYieldKgHa as number),
    fallbackYieldKgHa: target?.expectedYieldKgHa ?? 400,
    avgRainfallMm,
    potassiumPpm: potassium,
    standAgeYears: standAgeYears(division.plantingYear),
  });
}
