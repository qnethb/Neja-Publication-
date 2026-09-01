import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import { predictYield } from '../src/lib/prediction';
import { MODEL_VERSION, seasonLabel } from '../src/lib/domain';

const prisma = new PrismaClient();

// Deterministic PRNG so repeated seeds produce the same demo data.
function mulberry32(seed: number) {
  let a = seed;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const rnd = mulberry32(20260901);
const between = (min: number, max: number) => min + rnd() * (max - min);
const pick = <T>(items: T[]): T => items[Math.floor(rnd() * items.length)];
const round = (v: number, dp = 1) => Number(v.toFixed(dp));

const PASSWORD = 'Cinnamon@123';

// Cinnamon seasons run October -> September.
const now = new Date();
const currentSeasonStartYear = now.getMonth() >= 9 ? now.getFullYear() : now.getFullYear() - 1;
const SEASON_YEARS = [
  currentSeasonStartYear - 3,
  currentSeasonStartYear - 2,
  currentSeasonStartYear - 1,
  currentSeasonStartYear,
];
const CURRENT_SEASON = seasonLabel(currentSeasonStartYear);

const GROUPS = [
  { name: 'Mahaoya', region: 'Deraniyagala' },
  { name: 'Sapumalkande', region: 'Deraniyagala' },
  { name: 'Udabage', region: 'Deraniyagala' },
  { name: 'Miyanawita', region: 'Deraniyagala' },
  { name: 'Pitiyakande', region: 'Mawathagama' },
];

const ESTATES = [
  {
    name: 'Galagama',
    code: 'GLG',
    group: 'Mahaoya',
    district: 'Kegalle',
    totalAreaHa: 612.5,
    mainCrops: 'RUBBER,CINNAMON,TEA',
    lat: 6.9345,
    lng: 80.3382,
  },
  {
    name: 'Sapumalkande',
    code: 'SPK',
    group: 'Sapumalkande',
    district: 'Kegalle',
    totalAreaHa: 743.8,
    mainCrops: 'RUBBER,CINNAMON,OIL_PALM',
    lat: 6.9612,
    lng: 80.3801,
  },
  {
    name: 'Udabage',
    code: 'UDB',
    group: 'Udabage',
    district: 'Kegalle',
    totalAreaHa: 528.4,
    mainCrops: 'RUBBER,CINNAMON,FORESTRY',
    lat: 6.9028,
    lng: 80.3057,
  },
];

const DIVISIONS = [
  { estate: 'GLG', name: 'Notinghill', areaHa: 68.4, crop: 'CINNAMON', plantingYear: 2011, variety: 'Sri Gemunu', soil: 'Red Yellow Podzolic', irrigation: 'RAINFED', lat: 6.9391, lng: 80.3312 },
  { estate: 'GLG', name: 'Bayswater', areaHa: 54.2, crop: 'CINNAMON', plantingYear: 2015, variety: 'Sri Wijaya', soil: 'Reddish Brown Latosolic', irrigation: 'RAINFED', lat: 6.9302, lng: 80.3441 },
  { estate: 'GLG', name: 'Galagama Lower', areaHa: 47.9, crop: 'CINNAMON', plantingYear: 2004, variety: 'Sri Gemunu', soil: 'Red Yellow Podzolic', irrigation: 'SPRINKLER', lat: 6.9271, lng: 80.3355 },
  { estate: 'GLG', name: 'Kirikanda', areaHa: 96.1, crop: 'RUBBER', plantingYear: 2009, variety: 'RRIC 121', soil: 'Red Yellow Podzolic', irrigation: 'RAINFED', lat: 6.9418, lng: 80.3465 },
  { estate: 'SPK', name: 'Deaela', areaHa: 72.6, crop: 'CINNAMON', plantingYear: 2013, variety: 'Sri Wijaya', soil: 'Reddish Brown Latosolic', irrigation: 'RAINFED', lat: 6.9655, lng: 80.3742 },
  { estate: 'SPK', name: 'Marlbe', areaHa: 61.3, crop: 'CINNAMON', plantingYear: 2007, variety: 'Sri Gemunu', soil: 'Red Yellow Podzolic', irrigation: 'RAINFED', lat: 6.9578, lng: 80.3866 },
  { estate: 'SPK', name: 'Keppitigala', areaHa: 58.8, crop: 'CINNAMON', plantingYear: 2018, variety: 'Sri Wijaya', soil: 'Immature Brown Loam', irrigation: 'DRIP', lat: 6.9689, lng: 80.3855 },
  { estate: 'UDB', name: 'Udabage Upper', areaHa: 51.7, crop: 'CINNAMON', plantingYear: 2016, variety: 'Sri Gemunu', soil: 'Reddish Brown Latosolic', irrigation: 'RAINFED', lat: 6.9071, lng: 80.3012 },
  { estate: 'UDB', name: 'Halgolla', areaHa: 44.5, crop: 'CINNAMON', plantingYear: 2002, variety: 'Local Seedling', soil: 'Red Yellow Podzolic', irrigation: 'RAINFED', lat: 6.8981, lng: 80.3104 },
];

function boundaryFor(name: string, lat: number, lng: number, areaHa: number): string {
  // Rough square footprint sized from the area, with a little jitter so the map
  // shows distinct shapes rather than identical boxes.
  const sideKm = Math.sqrt(areaHa / 100);
  const dLat = sideKm / 111 / 2;
  const dLng = sideKm / (111 * Math.cos((lat * Math.PI) / 180)) / 2;
  const j = () => between(-0.18, 0.18);
  const ring = [
    [lng - dLng * (1 + j()), lat - dLat * (1 + j())],
    [lng + dLng * (1 + j()), lat - dLat * (1 + j())],
    [lng + dLng * (1 + j()), lat + dLat * (1 + j())],
    [lng + dLng * j() * 0.5, lat + dLat * (1.2 + j())],
    [lng - dLng * (1 + j()), lat + dLat * (1 + j())],
  ];
  ring.push(ring[0]);
  return JSON.stringify({
    type: 'Feature',
    properties: { name, areaHa },
    geometry: { type: 'Polygon', coordinates: [ring.map(([x, y]) => [round(x, 6), round(y, 6)])] },
  });
}

const OPERATION_PLAN = [
  { type: 'WEEDING', product: 'Manual slashing', rate: '2 rounds', share: 0.14, monthOffsets: [1, 6] },
  { type: 'FERTILIZING', product: 'Urea + MOP (Cinnamon mix)', rate: '250 kg/ha', share: 0.24, monthOffsets: [2, 8] },
  { type: 'PRUNING', product: 'Shoot thinning', rate: '—', share: 0.11, monthOffsets: [3] },
  { type: 'PEST_CONTROL', product: 'Neem-based bio pesticide', rate: '3 l/ha', share: 0.08, monthOffsets: [5] },
  { type: 'HARVESTING', product: 'Peeling gang', rate: 'Contract', share: 0.38, monthOffsets: [9, 10] },
  { type: 'OTHER', product: 'Road & drain maintenance', rate: '—', share: 0.05, monthOffsets: [4] },
];

const WEATHER_NOTES = [
  'Dry spell, good peeling conditions',
  'Intermittent showers',
  'Heavy south-west monsoon rain',
  'Overcast, high humidity',
  'Clear and warm',
];

async function main() {
  console.log('Clearing existing data…');
  await prisma.recommendation.deleteMany();
  await prisma.prediction.deleteMany();
  await prisma.soilWeatherSnapshot.deleteMany();
  await prisma.operationLog.deleteMany();
  await prisma.cropHistory.deleteMany();
  await prisma.cinnamonBlock.deleteMany();
  await prisma.division.deleteMany();
  await prisma.estate.deleteMany();
  await prisma.group.deleteMany();
  await prisma.user.deleteMany();

  const passwordHash = bcrypt.hashSync(PASSWORD, 10);

  console.log('Creating users…');
  const users = await Promise.all(
    [
      { name: 'Nimal Perera', email: 'admin@lalanrubbers.lk', role: 'TOP_MANAGEMENT' },
      { name: 'Ruwan Jayasuriya', email: 'gm.mahaoya@lalanrubbers.lk', role: 'GROUP_GM' },
      { name: 'Dilhani Fernando', email: 'gm.sapumalkande@lalanrubbers.lk', role: 'GROUP_GM' },
      { name: 'Sunil Bandara', email: 'em.galagama@lalanrubbers.lk', role: 'ESTATE_MANAGER' },
      { name: 'Chamara Silva', email: 'em.sapumalkande@lalanrubbers.lk', role: 'ESTATE_MANAGER' },
      { name: 'Anusha Rathnayake', email: 'em.udabage@lalanrubbers.lk', role: 'ESTATE_MANAGER' },
      { name: 'Kasun Alwis', email: 'am.galagama@lalanrubbers.lk', role: 'ESTATE_MANAGER' },
      { name: 'Tharindu Weerasinghe', email: 'dm.notinghill@lalanrubbers.lk', role: 'DIVISION_MANAGER' },
      { name: 'Malani Gunaratne', email: 'fo.deaela@lalanrubbers.lk', role: 'FIELD_OFFICER' },
    ].map((u) => prisma.user.create({ data: { ...u, passwordHash, phone: '+94 77 000 0000' } })),
  );
  const byEmail = (email: string) => users.find((u) => u.email === email)!;

  console.log('Creating groups…');
  const groups = await Promise.all(
    GROUPS.map((g) =>
      prisma.group.create({
        data: {
          name: g.name,
          region: g.region,
          generalManagerId:
            g.name === 'Mahaoya'
              ? byEmail('gm.mahaoya@lalanrubbers.lk').id
              : g.name === 'Sapumalkande' || g.name === 'Udabage'
                ? byEmail('gm.sapumalkande@lalanrubbers.lk').id
                : null,
        },
      }),
    ),
  );
  const groupByName = (name: string) => groups.find((g) => g.name === name)!;

  console.log('Creating estates…');
  const estateManagers: Record<string, string> = {
    GLG: byEmail('em.galagama@lalanrubbers.lk').id,
    SPK: byEmail('em.sapumalkande@lalanrubbers.lk').id,
    UDB: byEmail('em.udabage@lalanrubbers.lk').id,
  };
  const estates = await Promise.all(
    ESTATES.map((e) =>
      prisma.estate.create({
        data: {
          name: e.name,
          code: e.code,
          district: e.district,
          totalAreaHa: e.totalAreaHa,
          mainCrops: e.mainCrops,
          groupId: groupByName(e.group).id,
          managerId: estateManagers[e.code],
          assistantManagerId: e.code === 'GLG' ? byEmail('am.galagama@lalanrubbers.lk').id : null,
        },
      }),
    ),
  );
  const estateByCode = (code: string) => estates.find((e) => e.code === code)!;

  console.log('Creating divisions and blocks…');
  const divisions = [];
  for (const d of DIVISIONS) {
    const division = await prisma.division.create({
      data: {
        estateId: estateByCode(d.estate).id,
        name: d.name,
        areaHa: d.areaHa,
        primaryCrop: d.crop,
        plantingYear: d.plantingYear,
        variety: d.variety,
        soilType: d.soil,
        irrigationType: d.irrigation,
        centroidLat: d.lat,
        centroidLng: d.lng,
        geoJsonBoundary: boundaryFor(d.name, d.lat, d.lng, d.areaHa),
      },
    });
    divisions.push({ ...division, meta: d });

    if (d.crop === 'CINNAMON') {
      const blockCount = 2 + Math.floor(rnd() * 2);
      for (let b = 0; b < blockCount; b += 1) {
        await prisma.cinnamonBlock.create({
          data: {
            divisionId: division.id,
            blockCode: `${d.name.slice(0, 3).toUpperCase()}-${String(b + 1).padStart(2, '0')}`,
            areaHa: round(d.areaHa / blockCount, 2),
            plantingDate: new Date(d.plantingYear + b, 5, 15),
            density: Math.round(between(3800, 5200)),
            soilType: d.soil,
            irrigationType: d.irrigation,
          },
        });
      }
    }
  }

  console.log('Creating crop history, operations and soil/weather records…');
  for (const division of divisions) {
    const d = division.meta;
    const isCinnamon = d.crop === 'CINNAMON';
    // Baseline productivity: mature but not over-aged stands yield best.
    const age = now.getFullYear() - d.plantingYear;
    const baseYield = isCinnamon
      ? clamp(230 + Math.min(age, 12) * 22 - Math.max(0, age - 16) * 14 + between(-35, 35), 150, 620)
      : between(900, 1400);

    for (let i = 0; i < SEASON_YEARS.length; i += 1) {
      const startYear = SEASON_YEARS[i];
      const season = seasonLabel(startYear);
      const seasonStart = new Date(startYear, 9, 1);
      const seasonEnd = new Date(startYear + 1, 8, 30);
      const isCurrent = season === CURRENT_SEASON;

      const trend = 1 + 0.03 * i;
      const expected = round(baseYield * trend * between(0.97, 1.06), 1);
      const actual = isCurrent ? null : round(expected * between(0.82, 1.12), 1);

      await prisma.cropHistory.create({
        data: {
          divisionId: division.id,
          crop: d.crop,
          season,
          seasonStart,
          seasonEnd,
          expectedYieldKgHa: expected,
          actualYieldKgHa: actual,
          gradeMixQuillPct: isCinnamon ? round(between(52, 68), 1) : null,
          gradeMixFeatheringsPct: isCinnamon ? round(between(14, 24), 1) : null,
          gradeMixChipsPct: isCinnamon ? round(between(12, 26), 1) : null,
          harvestMethod: isCinnamon ? pick(['MANUAL_PEELING', 'MIXED']) : 'MANUAL_PEELING',
          notes: isCurrent
            ? 'Season in progress — forecast only.'
            : actual && actual < expected * 0.9
              ? 'Yield short of forecast; peeling labour shortage during peak months.'
              : 'Season closed and reconciled with the factory intake register.',
        },
      });

      // Operations spread across the season.
      const seasonCostPerHa = between(150000, 215000);
      for (const op of OPERATION_PLAN) {
        for (const offset of op.monthOffsets) {
          const date = new Date(startYear, 9 + offset, Math.floor(between(2, 27)));
          if (date > now) continue;
          await prisma.operationLog.create({
            data: {
              divisionId: division.id,
              date,
              operationType: op.type,
              inputProduct: op.product,
              rate: op.rate,
              costLkr: round(
                (seasonCostPerHa * op.share * d.areaHa) / op.monthOffsets.length * between(0.9, 1.1),
                0,
              ),
              laborHours: round((d.areaHa * op.share * between(9, 16)) / op.monthOffsets.length, 1),
              weatherNotes: pick(WEATHER_NOTES),
              loggedById:
                d.name === 'Deaela'
                  ? byEmail('fo.deaela@lalanrubbers.lk').id
                  : d.name === 'Notinghill' || d.name === 'Bayswater'
                    ? byEmail('dm.notinghill@lalanrubbers.lk').id
                    : estateManagers[d.estate],
            },
          });
        }
      }

      // Monthly weather, quarterly soil laboratory results.
      const seasonRainfall = between(1450, 2200);
      for (let m = 0; m < 12; m += 1) {
        const date = new Date(startYear, 9 + m, 15);
        if (date > now) continue;
        const monsoonWeight = [0.12, 0.07, 0.05, 0.04, 0.06, 0.11, 0.13, 0.12, 0.09, 0.07, 0.08, 0.06][m];
        const isLab = m % 3 === 0;
        await prisma.soilWeatherSnapshot.create({
          data: {
            divisionId: division.id,
            date,
            rainfallMm: round(seasonRainfall * monsoonWeight * between(0.8, 1.2), 1),
            tempC: round(between(24.5, 31.5), 1),
            source: isLab ? 'LAB' : 'MANUAL',
            pH: isLab ? round(between(4.6, 6.3), 2) : null,
            nitrogenPpm: isLab ? round(between(18, 46), 1) : null,
            phosphorusPpm: isLab ? round(between(8, 28), 1) : null,
            potassiumPpm: isLab
              ? round(
                  d.name === 'Halgolla' || d.name === 'Marlbe'
                    ? between(92, 138)
                    : between(128, 205),
                  1,
                )
              : null,
            organicMatterPct: isLab ? round(between(1.4, 3.8), 2) : null,
          },
        });
      }
    }
  }

  console.log('Generating predictions for the current season…');
  const cinnamonDivisions = divisions.filter((d) => d.meta.crop === 'CINNAMON');
  for (const division of cinnamonDivisions) {
    const history = await prisma.cropHistory.findMany({
      where: { divisionId: division.id, actualYieldKgHa: { not: null } },
      orderBy: { seasonStart: 'desc' },
      take: 3,
    });
    const snapshots = await prisma.soilWeatherSnapshot.findMany({
      where: { divisionId: division.id },
      orderBy: { date: 'desc' },
    });
    const potassium = snapshots.find((s) => s.potassiumPpm !== null)?.potassiumPpm ?? null;
    const rainfallTotals = SEASON_YEARS.map((y) =>
      snapshots
        .filter((s) => s.date >= new Date(y, 9, 1) && s.date <= new Date(y + 1, 8, 30))
        .reduce((acc, s) => acc + (s.rainfallMm ?? 0), 0),
    ).filter((v) => v > 0);
    const avgRainfall = rainfallTotals.length
      ? rainfallTotals.reduce((a, b) => a + b, 0) / rainfallTotals.length
      : null;

    const result = predictYield({
      recentActualYields: history.map((h) => h.actualYieldKgHa as number),
      fallbackYieldKgHa: 400,
      avgRainfallMm: avgRainfall,
      potassiumPpm: potassium,
      standAgeYears: now.getFullYear() - division.meta.plantingYear,
    });

    await prisma.prediction.create({
      data: {
        divisionId: division.id,
        season: CURRENT_SEASON,
        predictedYieldKgHa: result.predictedYieldKgHa,
        confidencePct: result.confidencePct,
        modelVersion: MODEL_VERSION,
        keyDrivers: result.keyDrivers,
      },
    });
  }

  console.log('Creating management recommendations…');
  const author = byEmail('admin@lalanrubbers.lk');
  const gm = byEmail('gm.mahaoya@lalanrubbers.lk');
  const templates = [
    {
      priority: 'HIGH',
      actionTitle: 'Apply corrective muriate of potash',
      actionDescription: 'Broadcast 120 kg/ha MOP in two splits before and after the inter-monsoon rains.',
      rationale: 'Latest soil laboratory results show potassium below the 150 ppm baseline.',
      expectedImpact: '+6-9% quill yield in the following season.',
    },
    {
      priority: 'MEDIUM',
      actionTitle: 'Re-schedule peeling gangs to the dry window',
      actionDescription: 'Move 40% of the peeling programme into the Jan-Mar dry window and pre-book contract labour.',
      rationale: 'Wet-weather peeling in the last season drove bark damage and grade downgrades.',
      expectedImpact: 'Quill share up by 4-5 percentage points.',
    },
    {
      priority: 'HIGH',
      actionTitle: 'Start phased replanting of over-aged blocks',
      actionDescription: 'Replant the oldest 15% of the cinnamon extent with Sri Gemunu over two seasons.',
      rationale: 'Stand age is past the productive peak and yields are declining year on year.',
      expectedImpact: 'Restores yield to 420+ kg/ha within 4 seasons.',
    },
    {
      priority: 'LOW',
      actionTitle: 'Install rain gauges in every cinnamon division',
      actionDescription: 'Fit a manual rain gauge per division and record daily readings in the app.',
      rationale: 'Rainfall records are incomplete, which lowers forecast confidence.',
      expectedImpact: 'Prediction confidence up by 5-8 percentage points.',
    },
    {
      priority: 'MEDIUM',
      actionTitle: 'Review weeding contract rates',
      actionDescription: 'Re-tender manual slashing rounds and benchmark against neighbouring estates.',
      rationale: 'Cost per kg is above the divisional average for a comparable yield.',
      expectedImpact: 'LKR 15-20 per kg reduction in field cost.',
    },
  ];

  const statuses = ['COMPLETED', 'IN_PROGRESS', 'PENDING', 'COMPLETED', 'PENDING', 'IN_PROGRESS'];
  let statusCursor = 0;
  for (const division of cinnamonDivisions) {
    const count = 2 + Math.floor(rnd() * 2);
    for (let i = 0; i < count; i += 1) {
      const template = templates[(statusCursor + i) % templates.length];
      const status = statuses[statusCursor % statuses.length];
      statusCursor += 1;
      const dueDate = new Date(now.getTime() + between(-70, 120) * 24 * 60 * 60 * 1000);
      await prisma.recommendation.create({
        data: {
          divisionId: division.id,
          priority: template.priority,
          actionTitle: template.actionTitle,
          actionDescription: template.actionDescription,
          rationale: template.rationale,
          expectedImpact: template.expectedImpact,
          assignedToId: estateManagers[division.meta.estate],
          createdById: division.meta.estate === 'GLG' ? gm.id : author.id,
          dueDate,
          status,
          completedAt: status === 'COMPLETED' ? new Date(dueDate.getTime() - 3 * 86400000) : null,
          progressNotes:
            status === 'IN_PROGRESS' ? 'First split applied; second split scheduled after the rains.' : null,
          createdAt: new Date(now.getTime() - between(20, 200) * 24 * 60 * 60 * 1000),
        },
      });
    }
  }

  console.log('Linking user access scopes…');
  await prisma.user.update({
    where: { id: gm.id },
    data: { groups: { connect: [{ id: groupByName('Mahaoya').id }] } },
  });
  await prisma.user.update({
    where: { id: byEmail('gm.sapumalkande@lalanrubbers.lk').id },
    data: {
      groups: {
        connect: [{ id: groupByName('Sapumalkande').id }, { id: groupByName('Udabage').id }],
      },
    },
  });
  await prisma.user.update({
    where: { id: byEmail('dm.notinghill@lalanrubbers.lk').id },
    data: {
      divisions: {
        connect: divisions
          .filter((d) => ['Notinghill', 'Bayswater'].includes(d.meta.name))
          .map((d) => ({ id: d.id })),
      },
    },
  });
  await prisma.user.update({
    where: { id: byEmail('fo.deaela@lalanrubbers.lk').id },
    data: {
      divisions: {
        connect: divisions.filter((d) => d.meta.name === 'Deaela').map((d) => ({ id: d.id })),
      },
    },
  });

  const counts = {
    users: await prisma.user.count(),
    groups: await prisma.group.count(),
    estates: await prisma.estate.count(),
    divisions: await prisma.division.count(),
    blocks: await prisma.cinnamonBlock.count(),
    cropHistory: await prisma.cropHistory.count(),
    operations: await prisma.operationLog.count(),
    soilWeather: await prisma.soilWeatherSnapshot.count(),
    predictions: await prisma.prediction.count(),
    recommendations: await prisma.recommendation.count(),
  };
  console.log('Seed complete:', counts);
  console.log(`Current season: ${CURRENT_SEASON}. Login password for every demo user: ${PASSWORD}`);
}

function clamp(v: number, min: number, max: number) {
  return Math.min(max, Math.max(min, v));
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
