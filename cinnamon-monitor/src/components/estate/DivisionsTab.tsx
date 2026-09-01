'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';
import { Empty, RiskBadge, Variance } from '@/components/ui';
import { ha, kgHa } from '@/lib/format';
import type { DivisionMetrics } from '@/lib/kpi';

type SortKey = 'name' | 'area' | 'variance' | 'risk' | 'yield';

export function DivisionsTab({ divisions }: { divisions: DivisionMetrics[] }) {
  const [sort, setSort] = useState<SortKey>('risk');
  const [riskFilter, setRiskFilter] = useState<string>('ALL');

  const rows = useMemo(() => {
    const filtered = divisions.filter((d) => riskFilter === 'ALL' || d.riskLevel === riskFilter);
    const sorted = [...filtered];
    sorted.sort((a, b) => {
      switch (sort) {
        case 'area':
          return b.areaHa - a.areaHa;
        case 'variance':
          return (a.yieldVariancePct ?? 0) - (b.yieldVariancePct ?? 0);
        case 'yield':
          return (b.lastSeasonYieldKgHa ?? 0) - (a.lastSeasonYieldKgHa ?? 0);
        case 'risk':
          return b.riskIndex - a.riskIndex;
        default:
          return a.name.localeCompare(b.name);
      }
    });
    return sorted;
  }, [divisions, sort, riskFilter]);

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-2">
        <label className="sr-only" htmlFor="sort">
          Sort divisions
        </label>
        <select id="sort" className="input max-w-[190px]" value={sort} onChange={(e) => setSort(e.target.value as SortKey)}>
          <option value="risk">Sort: highest risk</option>
          <option value="variance">Sort: worst variance</option>
          <option value="yield">Sort: highest yield</option>
          <option value="area">Sort: largest area</option>
          <option value="name">Sort: name</option>
        </select>
        <select
          className="input max-w-[160px]"
          value={riskFilter}
          onChange={(e) => setRiskFilter(e.target.value)}
          aria-label="Filter by risk"
        >
          <option value="ALL">All risk levels</option>
          <option value="HIGH">High risk</option>
          <option value="MEDIUM">Medium risk</option>
          <option value="LOW">Low risk</option>
        </select>
      </div>

      {rows.length === 0 ? (
        <Empty>No divisions match this filter.</Empty>
      ) : (
        <ul className="space-y-2">
          {rows.map((d) => (
            <li key={d.divisionId} className="card">
              <Link href={`/division/${d.divisionId}`} className="block p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-bold text-ink">{d.name}</p>
                    <p className="text-xs text-slate-500">
                      {ha(d.areaHa)} · planted {d.plantingYear} · {d.standAgeYears}y old
                    </p>
                  </div>
                  <RiskBadge level={d.riskLevel} index={d.riskIndex} />
                </div>

                <dl className="mt-3 grid grid-cols-3 gap-2 text-center">
                  <Stat label="Forecast" value={kgHa(d.forecastYieldKgHa)} />
                  <Stat label={`Actual ${d.lastCompletedSeason ?? ''}`} value={kgHa(d.lastSeasonYieldKgHa)} />
                  <div className="rounded-lg bg-slate-50 px-2 py-2">
                    <dt className="text-[10px] font-semibold uppercase tracking-wide text-slate-500">Variance</dt>
                    <dd className="text-sm">
                      <Variance value={d.yieldVariancePct} />
                    </dd>
                  </div>
                </dl>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg bg-slate-50 px-2 py-2">
      <dt className="truncate text-[10px] font-semibold uppercase tracking-wide text-slate-500">{label}</dt>
      <dd className="text-sm font-semibold text-ink">{value}</dd>
    </div>
  );
}
