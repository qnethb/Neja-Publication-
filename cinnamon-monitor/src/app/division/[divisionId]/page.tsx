'use client';

import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { useState } from 'react';
import { AppShell } from '@/components/AppShell';
import {
  BackLink,
  Empty,
  ErrorNote,
  KpiCard,
  Panel,
  PriorityBadge,
  RiskBadge,
  Spinner,
  StatusBadge,
  Variance,
} from '@/components/ui';
import { DivisionYieldChart, RainfallChart } from '@/components/charts';
import { MapPanel } from '@/components/MapPanel';
import { OperationForm } from '@/components/OperationForm';
import { api } from '@/lib/client';
import { ha, kgHa, lkr, num, pct, shortDate, titleCase } from '@/lib/format';
import type { DivisionMetrics } from '@/lib/kpi';

type DivisionDetail = {
  id: string;
  name: string;
  areaHa: number;
  primaryCrop: string;
  plantingYear: number;
  variety: string | null;
  soilType: string | null;
  irrigationType: string | null;
  geoJsonBoundary: string | null;
  centroidLat: number | null;
  centroidLng: number | null;
  canWrite: boolean;
  estate: {
    id: string;
    name: string;
    code: string;
    manager: { id: string; name: string } | null;
    group: { id: string; name: string; region: string };
  };
  blocks: { id: string; blockCode: string; areaHa: number; density: number; plantingDate: string }[];
};

type Operation = {
  id: string;
  date: string;
  operationType: string;
  inputProduct: string | null;
  rate: string | null;
  costLkr: number;
  laborHours: number;
  weatherNotes: string | null;
  loggedBy: { name: string } | null;
};

type SoilWeather = {
  snapshots: {
    id: string;
    date: string;
    pH: number | null;
    nitrogenPpm: number | null;
    phosphorusPpm: number | null;
    potassiumPpm: number | null;
    organicMatterPct: number | null;
    rainfallMm: number | null;
    tempC: number | null;
    source: string;
  }[];
  latestLab: SoilWeather['snapshots'][number] | null;
};

type Recommendation = {
  id: string;
  priority: string;
  status: string;
  actionTitle: string;
  actionDescription: string;
  dueDate: string | null;
  assignedTo: { name: string } | null;
};

export default function DivisionPage({ params }: { params: { divisionId: string } }) {
  const id = params.divisionId;
  const [formOpen, setFormOpen] = useState(false);

  const division = useQuery({ queryKey: ['division', id], queryFn: () => api<DivisionDetail>(`/api/divisions/${id}`) });
  const metrics = useQuery({
    queryKey: ['division-metrics', id],
    queryFn: () => api<DivisionMetrics>(`/api/divisions/${id}/metrics`),
  });
  const history = useQuery({
    queryKey: ['crop-history', id],
    queryFn: () =>
      api<{ id: string; season: string; expectedYieldKgHa: number; actualYieldKgHa: number | null }[]>(
        `/api/divisions/${id}/crop-history`,
      ),
  });
  const operations = useQuery({
    queryKey: ['operations', id],
    queryFn: () => api<Operation[]>(`/api/divisions/${id}/operations?take=10`),
  });
  const soil = useQuery({
    queryKey: ['soil-weather', id],
    queryFn: () => api<SoilWeather>(`/api/divisions/${id}/soil-weather?take=12`),
  });
  const recommendations = useQuery({
    queryKey: ['division-recommendations', id],
    queryFn: () => api<Recommendation[]>(`/api/divisions/${id}/recommendations`),
  });
  const prediction = useQuery({
    queryKey: ['prediction', id],
    queryFn: () =>
      api<{ season: string; live: { predictedYieldKgHa: number; confidencePct: number; keyDrivers: string } | null }>(
        `/api/divisions/${id}/predictions`,
      ),
  });

  const d = division.data;
  const m = metrics.data;

  return (
    <AppShell>
      <div className="space-y-4">
        <BackLink href={d ? `/estate/${d.estate.id}` : '/dashboard'}>
          {d ? `${d.estate.name} Estate` : 'Back'}
        </BackLink>

        {division.isLoading ? <Spinner /> : null}
        {division.error ? <ErrorNote error={division.error} /> : null}

        {d ? (
          <>
            <div className="flex items-start justify-between gap-3">
              <div>
                <h1 className="text-lg font-bold text-forest-700">{d.name}</h1>
                <p className="text-sm text-slate-500">
                  {d.estate.name} Estate · {d.estate.group.name} group
                </p>
                <p className="text-xs text-slate-400">
                  {titleCase(d.primaryCrop)} · {d.variety ?? 'variety n/a'} · {d.soilType ?? 'soil n/a'} ·{' '}
                  {titleCase(d.irrigationType)}
                </p>
              </div>
              {m ? <RiskBadge level={m.riskLevel} index={m.riskIndex} /> : null}
            </div>

            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              <KpiCard label="Cinnamon area" value={ha(d.areaHa)} sub={`${d.blocks.length} blocks`} />
              <KpiCard label="Stand age" value={`${m?.standAgeYears ?? '—'} yrs`} sub={`Planted ${d.plantingYear}`} />
              <KpiCard label="Forecast yield" value={kgHa(m?.forecastYieldKgHa)} sub={`Season ${m?.season ?? '—'}`} tone="warn" />
              <KpiCard label="Last actual" value={kgHa(m?.lastSeasonYieldKgHa)} sub={`Season ${m?.lastCompletedSeason ?? '—'}`} />
              <KpiCard label="Predicted yield" value={kgHa(m?.predictedYieldKgHa)} sub={`Confidence ${pct(m?.predictionConfidencePct, 0)}`} />
              <KpiCard label="Forecast accuracy" value={pct(m?.forecastAccuracyPct)} />
              <KpiCard label="Cost per kg" value={lkr(m?.costPerKgLkr)} />
              <div className="card card-pad">
                <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">Yield variance</p>
                <p className="mt-1 text-xl font-bold leading-tight">
                  <Variance value={m?.yieldVariancePct} />
                </p>
                <p className="mt-0.5 text-[11px] text-slate-400">Actual vs forecast</p>
              </div>
            </div>

            {prediction.data?.live ? (
              <Panel title="Prediction drivers">
                <p className="text-sm font-semibold text-forest-700">
                  {kgHa(prediction.data.live.predictedYieldKgHa)} for {prediction.data.season} ·{' '}
                  {pct(prediction.data.live.confidencePct, 0)} confidence
                </p>
                <p className="mt-1 text-xs text-slate-500">{prediction.data.live.keyDrivers}</p>
              </Panel>
            ) : null}

            {m && m.riskDrivers.length > 0 ? (
              <Panel title="Risk drivers">
                <ul className="list-inside list-disc space-y-1 text-sm text-slate-600">
                  {m.riskDrivers.map((r, i) => (
                    <li key={i}>{r}</li>
                  ))}
                </ul>
              </Panel>
            ) : null}

            <Panel title="Boundary">
              <MapPanel
                height={240}
                divisions={[
                  {
                    divisionId: d.id,
                    name: d.name,
                    areaHa: d.areaHa,
                    geoJsonBoundary: d.geoJsonBoundary,
                    centroidLat: d.centroidLat,
                    centroidLng: d.centroidLng,
                    predictedYieldKgHa: m?.predictedYieldKgHa ?? null,
                    lastSeasonYieldKgHa: m?.lastSeasonYieldKgHa ?? null,
                    riskLevel: m?.riskLevel ?? 'LOW',
                    riskIndex: m?.riskIndex ?? 0,
                  },
                ]}
              />
            </Panel>

            <Panel title="Crop history">
              {history.data && history.data.length > 0 ? (
                <DivisionYieldChart data={history.data} />
              ) : (
                <Empty>No seasons recorded.</Empty>
              )}
            </Panel>

            <Panel
              title="Operations log"
              action={
                d.canWrite ? (
                  <button className="btn-secondary px-3 text-xs" onClick={() => setFormOpen((v) => !v)}>
                    {formOpen ? 'Cancel' : '+ Add operation'}
                  </button>
                ) : null
              }
            >
              {formOpen && d.canWrite ? (
                <div className="mb-4 rounded-lg bg-slate-50 p-3">
                  <OperationForm divisionId={id} onDone={() => setFormOpen(false)} />
                </div>
              ) : null}

              {operations.data && operations.data.length > 0 ? (
                <ul className="divide-y divide-slate-100">
                  {operations.data.map((op) => (
                    <li key={op.id} className="py-2.5">
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <p className="text-sm font-semibold text-ink">{titleCase(op.operationType)}</p>
                          <p className="truncate text-xs text-slate-500">
                            {op.inputProduct ?? '—'}
                            {op.rate ? ` · ${op.rate}` : ''}
                          </p>
                          {op.weatherNotes ? (
                            <p className="truncate text-[11px] italic text-slate-400">{op.weatherNotes}</p>
                          ) : null}
                        </div>
                        <div className="shrink-0 text-right">
                          <p className="text-xs font-semibold text-ink">{lkr(op.costLkr, 0)}</p>
                          <p className="text-[11px] text-slate-400">{shortDate(op.date)}</p>
                          <p className="text-[11px] text-slate-400">{num(op.laborHours, 1)} h</p>
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>
              ) : (
                <Empty>No operations logged yet.</Empty>
              )}
            </Panel>

            <Panel title="Soil & weather">
              {soil.data?.latestLab ? (
                <>
                  <p className="mb-2 text-xs text-slate-400">
                    Latest laboratory result · {shortDate(soil.data.latestLab.date)} · {soil.data.latestLab.source}
                  </p>
                  <dl className="grid grid-cols-3 gap-2 text-center sm:grid-cols-5">
                    <Reading label="pH" value={num(soil.data.latestLab.pH, 1)} warn={(soil.data.latestLab.pH ?? 9) < 5} />
                    <Reading label="N ppm" value={num(soil.data.latestLab.nitrogenPpm, 0)} />
                    <Reading label="P ppm" value={num(soil.data.latestLab.phosphorusPpm, 0)} />
                    <Reading
                      label="K ppm"
                      value={num(soil.data.latestLab.potassiumPpm, 0)}
                      warn={(soil.data.latestLab.potassiumPpm ?? 999) < 150}
                    />
                    <Reading label="OM %" value={num(soil.data.latestLab.organicMatterPct, 1)} />
                  </dl>
                </>
              ) : (
                <Empty>No laboratory results recorded.</Empty>
              )}

              {soil.data && soil.data.snapshots.length > 0 ? (
                <div className="mt-4">
                  <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Rainfall — last 12 records
                  </p>
                  <RainfallChart
                    data={[...soil.data.snapshots]
                      .reverse()
                      .map((s) => ({
                        month: new Date(s.date).toLocaleDateString('en-GB', { month: 'short' }),
                        rainfallMm: s.rainfallMm ?? 0,
                      }))}
                  />
                </div>
              ) : null}
            </Panel>

            <Panel title={`Recommendations (${recommendations.data?.length ?? 0})`}>
              {recommendations.data && recommendations.data.length > 0 ? (
                <ul className="space-y-2">
                  {recommendations.data.map((r) => (
                    <li key={r.id} className="rounded-lg border border-slate-200 p-3">
                      <div className="flex items-start justify-between gap-2">
                        <p className="text-sm font-semibold text-ink">{r.actionTitle}</p>
                        <div className="flex shrink-0 flex-col items-end gap-1">
                          <PriorityBadge priority={r.priority} />
                          <StatusBadge status={r.status} />
                        </div>
                      </div>
                      <p className="mt-1 text-xs text-slate-600">{r.actionDescription}</p>
                      <p className="mt-1 text-[11px] text-slate-400">
                        Owner {r.assignedTo?.name ?? 'unassigned'} · due {shortDate(r.dueDate)}
                      </p>
                    </li>
                  ))}
                </ul>
              ) : (
                <Empty>No recommendations for this division.</Empty>
              )}
              <Link href={`/estate/${d.estate.id}`} className="mt-3 inline-block text-xs font-semibold text-forest-700">
                Manage in estate view →
              </Link>
            </Panel>
          </>
        ) : null}
      </div>
    </AppShell>
  );
}

function Reading({ label, value, warn }: { label: string; value: string; warn?: boolean }) {
  return (
    <div className={`rounded-lg px-2 py-2 ${warn ? 'bg-red-50' : 'bg-slate-50'}`}>
      <dt className="text-[10px] font-semibold uppercase tracking-wide text-slate-500">{label}</dt>
      <dd className={`text-sm font-bold ${warn ? 'text-red-600' : 'text-ink'}`}>{value}</dd>
    </div>
  );
}
