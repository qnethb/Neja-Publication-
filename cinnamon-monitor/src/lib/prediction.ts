import { AGRONOMY_BASELINES, MODEL_VERSION, standAgeYears } from './domain';

export type PredictionInputs = {
  /** Actual yields of the most recent completed seasons, newest first. */
  recentActualYields: number[];
  /** Fallback when no completed season exists yet (e.g. the planned target). */
  fallbackYieldKgHa: number;
  avgRainfallMm: number | null;
  potassiumPpm: number | null;
  standAgeYears: number;
};

export type PredictionResult = {
  predictedYieldKgHa: number;
  confidencePct: number;
  modelVersion: string;
  keyDrivers: string;
  factors: {
    base: number;
    ageFactor: number;
    rainFactor: number;
    kFactor: number;
    clamped: boolean;
  };
};

const round = (value: number, dp = 1) => Number(value.toFixed(dp));

/**
 * Stand productivity curve: yield climbs to a plateau at 10 years and declines
 * once the stand passes 12.
 */
function standCurve(age: number): number {
  return (
    1 +
    0.05 * Math.min(Math.max(age, 0), AGRONOMY_BASELINES.peakStandAgeYears) -
    0.02 * Math.max(0, age - AGRONOMY_BASELINES.declineStandAgeYears)
  );
}

/**
 * Formula based cinnamon yield prediction.
 *
 *   base       = mean of the last 3 completed seasons
 *   ageFactor  = standCurve(age) / standCurve(age of the base seasons)
 *   rainFactor = 1 + 0.0005 * (avgRainfall - 1800)
 *   kFactor    = 1 + 0.001  * (potassium  - 150)
 *
 * The age term is expressed *relative* to the stand's age during the seasons
 * that make up the base. The raw curve alone would multiply a mature stand's
 * own history by ~1.5, because the base already contains that maturity; the
 * ratio isolates the year-on-year change the coming season should bring.
 * With no history the base is the planned target, which assumes a stand at the
 * productive plateau, so the curve is normalised against the peak age instead.
 *
 * The result is clamped to an agronomically plausible band. Confidence drops
 * when history is short or when soil/weather readings are missing.
 */
export function predictYield(input: PredictionInputs): PredictionResult {
  const history = input.recentActualYields.filter((v) => Number.isFinite(v)).slice(0, 3);
  const base =
    history.length > 0 ? history.reduce((a, b) => a + b, 0) / history.length : input.fallbackYieldKgHa;

  const age = Math.max(0, input.standAgeYears);
  // Seasons in the base sit, on average, (history.length + 1) / 2 years back.
  const baseAge =
    history.length > 0
      ? Math.max(0, age - (history.length + 1) / 2)
      : AGRONOMY_BASELINES.peakStandAgeYears;
  const ageFactor = standCurve(age) / standCurve(baseAge);

  const rainFactor =
    input.avgRainfallMm === null
      ? 1
      : 1 + 0.0005 * (input.avgRainfallMm - AGRONOMY_BASELINES.rainfallMm);

  const kFactor =
    input.potassiumPpm === null
      ? 1
      : 1 + 0.001 * (input.potassiumPpm - AGRONOMY_BASELINES.potassiumPpm);

  const raw = base * ageFactor * rainFactor * kFactor;
  const predicted = clamp(
    raw,
    AGRONOMY_BASELINES.minPredictedYieldKgHa,
    AGRONOMY_BASELINES.maxPredictedYieldKgHa,
  );

  let confidence = 70;
  if (history.length >= 3) confidence += 8;
  else if (history.length === 2) confidence += 4;
  else if (history.length === 0) confidence -= 12;
  if (input.avgRainfallMm !== null) confidence += 4;
  if (input.potassiumPpm !== null) confidence += 3;
  if (age > 20) confidence -= 5;
  confidence = clamp(confidence, 45, 85);

  return {
    predictedYieldKgHa: round(predicted),
    confidencePct: round(confidence),
    modelVersion: MODEL_VERSION,
    keyDrivers: describeDrivers({ history: history.length, ageFactor, rainFactor, kFactor, age }),
    factors: {
      base: round(base),
      ageFactor: round(ageFactor, 3),
      rainFactor: round(rainFactor, 3),
      kFactor: round(kFactor, 3),
      clamped: raw !== predicted,
    },
  };
}

export function standAge(plantingYear: number, at?: Date): number {
  return standAgeYears(plantingYear, at);
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

function describeDrivers(args: {
  history: number;
  ageFactor: number;
  rainFactor: number;
  kFactor: number;
  age: number;
}): string {
  const parts: string[] = [];
  parts.push(
    args.history > 0
      ? `${args.history}-season yield history`
      : 'no completed season yet — planned target used as base',
  );
  parts.push(`stand age ${args.age}y (x${args.ageFactor.toFixed(2)})`);
  parts.push(
    args.rainFactor === 1
      ? 'rainfall unavailable (neutral)'
      : `rainfall ${args.rainFactor > 1 ? 'above' : 'below'} 1800 mm baseline (x${args.rainFactor.toFixed(2)})`,
  );
  parts.push(
    args.kFactor === 1
      ? 'soil K unavailable (neutral)'
      : `soil K ${args.kFactor > 1 ? 'above' : 'below'} 150 ppm baseline (x${args.kFactor.toFixed(2)})`,
  );
  return parts.join('; ');
}
