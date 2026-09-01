import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { assert, requireUser, handler, ok } from '@/lib/http';
import { canViewDivision, canWriteDivision } from '@/lib/rbac';
import { SNAPSHOT_SOURCES } from '@/lib/domain';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export const GET = handler(async (req: NextRequest, { params }: { params: { id: string } }) => {
  const user = await requireUser();
  assert(await canViewDivision(user, params.id), 403, 'No access to this division');

  const take = Number(req.nextUrl.searchParams.get('take') ?? 24);
  const snapshots = await prisma.soilWeatherSnapshot.findMany({
    where: { divisionId: params.id },
    orderBy: { date: 'desc' },
    take: Math.min(Math.max(take, 1), 200),
  });

  const latestLab = await prisma.soilWeatherSnapshot.findFirst({
    where: { divisionId: params.id, potassiumPpm: { not: null } },
    orderBy: { date: 'desc' },
  });

  return ok({ snapshots, latestLab });
});

export const POST = handler(async (req: NextRequest, { params }: { params: { id: string } }) => {
  const user = await requireUser();
  assert(await canWriteDivision(user, params.id), 403, 'Not allowed to record readings for this division');

  const body = await req.json();
  const source = body.source ?? 'MANUAL';
  assert(SNAPSHOT_SOURCES.includes(source), 400, 'Unknown source');

  const snapshot = await prisma.soilWeatherSnapshot.create({
    data: {
      divisionId: params.id,
      date: body.date ? new Date(body.date) : new Date(),
      pH: nullableNumber(body.pH),
      nitrogenPpm: nullableNumber(body.nitrogenPpm),
      phosphorusPpm: nullableNumber(body.phosphorusPpm),
      potassiumPpm: nullableNumber(body.potassiumPpm),
      organicMatterPct: nullableNumber(body.organicMatterPct),
      rainfallMm: nullableNumber(body.rainfallMm),
      tempC: nullableNumber(body.tempC),
      source,
    },
  });

  return ok(snapshot, { status: 201 });
});

function nullableNumber(value: unknown): number | null {
  if (value === null || value === undefined || value === '') return null;
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
}
