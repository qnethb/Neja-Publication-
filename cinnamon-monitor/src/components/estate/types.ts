import type { DivisionMetrics, EstateKpis } from '@/lib/kpi';

export type EstateKpiResponse = {
  estate: {
    id: string;
    name: string;
    code: string;
    group: { id: string; name: string; region: string };
    manager: { id: string; name: string; email: string } | null;
    assistantManager: { id: string; name: string } | null;
    totalAreaHa: number;
    mainCrops: string[];
  };
  kpis: EstateKpis;
  divisions: DivisionMetrics[];
  trend: { season: string; forecastKgHa: number | null; actualKgHa: number | null }[];
  seasons: string[];
  alerts: { severity: 'HIGH' | 'MEDIUM'; divisionId: string; division: string; message: string }[];
};

export type DivisionRecord = {
  id: string;
  name: string;
  areaHa: number;
  primaryCrop: string;
  plantingYear: number;
  geoJsonBoundary: string | null;
  centroidLat: number | null;
  centroidLng: number | null;
};
