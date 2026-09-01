'use client';

import { useQuery } from '@tanstack/react-query';
import { useState } from 'react';
import { Empty, Panel, Spinner, Variance } from '@/components/ui';
import { DivisionYieldChart, YieldTrendChart } from '@/components/charts';
import { api } from '@/lib/client';
import { kgHa, num, titleCase } from '@/lib/format';
import type { DivisionMetrics } from '@/lib/kpi';
import type { EstateKpiResponse } from './types';

type HistoryRow = {
  id: string;
  season: string;
  expectedYieldKgHa: number;
  actualYieldKgHa: number | null;
  gradeMixQuillPct: number | null;
  gradeMixFeatheringsPct: number | null;
  gradeMixChipsPct: number | null;
  harvestMethod: string | null;
  notes: string | null;
};

export function CropHistoryTab({
  data,
  divisions,
}: {
  data: EstateKpiResponse;
  divisions: DivisionMetrics[];
}) {
  const [divisionId, setDivisionId] = useState<string>(divisions[0]?.divisionId ?? '');

  const { data: history, isLoading } = useQuery({
    queryKey: ['crop-history', divisionId],
    queryFn: () => api<HistoryRow[]>(`/api/divisions/${divisionId}/crop-history`),
    enabled: Boolean(divisionId),
  });

  return (
    <div className="space-y-4">
      <Panel title="Estate yield — forecast vs actual">
        {data.trend.length === 0 ? <Empty>No seasons recorded.</Empty> : <YieldTrendChart data={data.trend} />}
      </Panel>

      <Panel
        title="Division history"
        action={
          <select
            className="input max-w-[190px]"
            value={divisionId}
            onChange={(e) => setDivisionId(e.target.value)}
            aria-label="Select division"
          >
            {divisions.map((d) => (
              <option key={d.divisionId} value={d.divisionId}>
                {d.name}
              </option>
            ))}
          </select>
        }
      >
        {isLoading ? <Spinner /> : null}
        {history && history.length > 0 ? (
          <div className="space-y-4">
            <DivisionYieldChart data={history} />
            <ul className="divide-y divide-slate-100">
              {[...history].reverse().map((h) => (
                <li key={h.id} className="py-3">
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-sm font-bold text-ink">{h.season}</p>
                    <Variance
                      value={
                        h.actualYieldKgHa !== null
                          ? ((h.actualYieldKgHa - h.expectedYieldKgHa) / h.expectedYieldKgHa) * 100
                          : null
                      }
                    />
                  </div>
                  <p className="mt-0.5 text-xs text-slate-500">
                    Forecast {kgHa(h.expectedYieldKgHa)} · Actual {kgHa(h.actualYieldKgHa)} ·{' '}
                    {titleCase(h.harvestMethod)}
                  </p>
                  {h.gradeMixQuillPct !== null ? (
                    <p className="mt-1 text-xs text-slate-500">
                      Grade mix — quills {num(h.gradeMixQuillPct, 0)}% · featherings{' '}
                      {num(h.gradeMixFeatheringsPct, 0)}% · chips {num(h.gradeMixChipsPct, 0)}%
                    </p>
                  ) : null}
                  {h.notes ? <p className="mt-1 text-xs italic text-slate-400">{h.notes}</p> : null}
                </li>
              ))}
            </ul>
          </div>
        ) : !isLoading ? (
          <Empty>No crop history for this division.</Empty>
        ) : null}
      </Panel>
    </div>
  );
}
