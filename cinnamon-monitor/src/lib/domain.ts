// Single source of truth for the enum-like values stored as strings.
// Keeping these explicit makes the model portable to Airtable / Glide / Bubble
// where the same values become single-select options.

export const ROLES = [
  'FIELD_OFFICER',
  'DIVISION_MANAGER',
  'ESTATE_MANAGER',
  'GROUP_GM',
  'TOP_MANAGEMENT',
] as const;
export type Role = (typeof ROLES)[number];

export const ROLE_LABELS: Record<Role, string> = {
  FIELD_OFFICER: 'Field Officer',
  DIVISION_MANAGER: 'Division Manager',
  ESTATE_MANAGER: 'Estate Manager',
  GROUP_GM: 'Group General Manager',
  TOP_MANAGEMENT: 'Top Management',
};

export const CROPS = ['RUBBER', 'COCONUT', 'TEA', 'CINNAMON', 'OIL_PALM', 'FORESTRY'] as const;
export type Crop = (typeof CROPS)[number];

export const OPERATION_TYPES = [
  'WEEDING',
  'PRUNING',
  'FERTILIZING',
  'PEST_CONTROL',
  'HARVESTING',
  'OTHER',
] as const;
export type OperationType = (typeof OPERATION_TYPES)[number];

export const PRIORITIES = ['HIGH', 'MEDIUM', 'LOW'] as const;
export type Priority = (typeof PRIORITIES)[number];

export const REC_STATUSES = ['PENDING', 'IN_PROGRESS', 'COMPLETED', 'OVERDUE'] as const;
export type RecStatus = (typeof REC_STATUSES)[number];

export const SNAPSHOT_SOURCES = ['LAB', 'SENSOR', 'MANUAL'] as const;
export type SnapshotSource = (typeof SNAPSHOT_SOURCES)[number];

export const IRRIGATION_TYPES = ['RAINFED', 'DRIP', 'SPRINKLER', 'FLOOD'] as const;

export const HARVEST_METHODS = ['MANUAL_PEELING', 'MECHANISED', 'MIXED'] as const;

export const RISK_LEVELS = ['LOW', 'MEDIUM', 'HIGH'] as const;
export type RiskLevel = (typeof RISK_LEVELS)[number];

// Agronomic baselines for cinnamon in the wet-zone estates. Central so that a
// no-code port only has to copy these numbers into a config table.
export const AGRONOMY_BASELINES = {
  rainfallMm: 1800,
  potassiumPpm: 150,
  targetYieldKgHa: 450,
  minPredictedYieldKgHa: 80,
  maxPredictedYieldKgHa: 900,
  peakStandAgeYears: 10,
  declineStandAgeYears: 12,
} as const;

export const MODEL_VERSION = 'cinnamon-yield-v1';

export function seasonLabel(startYear: number): string {
  const end = (startYear + 1) % 100;
  return `${startYear}/${String(end).padStart(2, '0')}`;
}

export function seasonStartYear(season: string): number {
  return Number(season.split('/')[0]);
}

export function standAgeYears(plantingYear: number, at: Date = new Date()): number {
  return Math.max(0, at.getFullYear() - plantingYear);
}
