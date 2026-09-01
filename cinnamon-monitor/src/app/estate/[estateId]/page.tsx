'use client';

import { useQuery } from '@tanstack/react-query';
import { useMemo, useState } from 'react';
import { AppShell } from '@/components/AppShell';
import { BackLink, ErrorNote, Panel, Spinner, Tabs } from '@/components/ui';
import { MapPanel } from '@/components/MapPanel';
import { OverviewTab } from '@/components/estate/OverviewTab';
import { DivisionsTab } from '@/components/estate/DivisionsTab';
import { CropHistoryTab } from '@/components/estate/CropHistoryTab';
import { RecommendationsTab } from '@/components/estate/RecommendationsTab';
import { ReportsTab } from '@/components/estate/ReportsTab';
import type { DivisionRecord, EstateKpiResponse } from '@/components/estate/types';
import { api } from '@/lib/client';
import { ha } from '@/lib/format';

const TABS = [
  { id: 'overview', label: 'Overview' },
  { id: 'divisions', label: 'Divisions' },
  { id: 'map', label: 'Map' },
  { id: 'history', label: 'Crop History' },
  { id: 'recommendations', label: 'Recommendations' },
  { id: 'reports', label: 'Reports' },
];

export default function EstatePage({ params }: { params: { estateId: string } }) {
  const [tab, setTab] = useState('overview');
  const [season, setSeason] = useState<string | null>(null);

  const { data, isLoading, error } = useQuery({
    queryKey: ['estate-kpis', params.estateId, season],
    queryFn: () =>
      api<EstateKpiResponse>(
        `/api/estates/${params.estateId}/kpis${season ? `?season=${encodeURIComponent(season)}` : ''}`,
      ),
  });

  const { data: divisionRecords } = useQuery({
    queryKey: ['divisions', params.estateId],
    queryFn: () => api<DivisionRecord[]>(`/api/divisions?estateId=${params.estateId}&crop=CINNAMON`),
    enabled: tab === 'map',
  });

  const mapDivisions = useMemo(() => {
    if (!data || !divisionRecords) return [];
    return divisionRecords.map((record) => {
      const metric = data.divisions.find((m) => m.divisionId === record.id);
      return {
        divisionId: record.id,
        name: record.name,
        areaHa: record.areaHa,
        geoJsonBoundary: record.geoJsonBoundary,
        centroidLat: record.centroidLat,
        centroidLng: record.centroidLng,
        predictedYieldKgHa: metric?.predictedYieldKgHa ?? null,
        lastSeasonYieldKgHa: metric?.lastSeasonYieldKgHa ?? null,
        riskLevel: metric?.riskLevel ?? 'LOW',
        riskIndex: metric?.riskIndex ?? 0,
      };
    });
  }, [data, divisionRecords]);

  return (
    <AppShell>
      <div className="space-y-4">
        <BackLink href="/dashboard">Dashboard</BackLink>

        {isLoading ? <Spinner /> : null}
        {error ? <ErrorNote error={error} /> : null}

        {data ? (
          <>
            <div>
              <h1 className="text-lg font-bold text-forest-700">{data.estate.name} Estate</h1>
              <p className="text-sm text-slate-500">
                {data.estate.group.name} group · {data.estate.group.region} · {ha(data.estate.totalAreaHa)} total
              </p>
              <p className="text-xs text-slate-400">
                Estate Manager: {data.estate.manager?.name ?? 'Unassigned'}
                {data.estate.assistantManager ? ` · Assistant: ${data.estate.assistantManager.name}` : ''}
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <label className="section-title" htmlFor="season">
                Season
              </label>
              <select
                id="season"
                className="input max-w-[150px]"
                value={season ?? data.kpis.season ?? ''}
                onChange={(e) => setSeason(e.target.value)}
              >
                {data.seasons.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </div>

            <Tabs tabs={TABS} active={tab} onChange={setTab} />

            {tab === 'overview' ? <OverviewTab data={data} /> : null}
            {tab === 'divisions' ? <DivisionsTab divisions={data.divisions} /> : null}
            {tab === 'map' ? (
              <Panel title="Division boundaries">
                <MapPanel divisions={mapDivisions} />
              </Panel>
            ) : null}
            {tab === 'history' ? <CropHistoryTab data={data} divisions={data.divisions} /> : null}
            {tab === 'recommendations' ? (
              <RecommendationsTab estateId={params.estateId} divisions={data.divisions} />
            ) : null}
            {tab === 'reports' ? (
              <ReportsTab estateId={params.estateId} season={season} />
            ) : null}
          </>
        ) : null}
      </div>
    </AppShell>
  );
}
