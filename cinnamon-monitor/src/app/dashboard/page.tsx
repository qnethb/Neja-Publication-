'use client';

import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { AppShell } from '@/components/AppShell';
import { KpiCard, Panel, RiskBadge, Spinner, ErrorNote, Empty, Variance } from '@/components/ui';
import { useAuth } from '@/app/providers';
import { api } from '@/lib/client';
import { ha, kgHa, lkr, num, pct } from '@/lib/format';
import { ROLE_LABELS } from '@/lib/domain';
import type { DivisionMetrics, EstateKpis } from '@/lib/kpi';

type DashboardData = {
  scope: 'GLOBAL' | 'SCOPED' | 'DIVISION';
  portfolio: {
    estateCount: number;
    divisionCount: number;
    cinnamonAreaHa: number;
    forecastedYieldKgHa: number | null;
    predictedYieldKgHa: number | null;
    actualYieldKgHa: number | null;
    forecastAccuracyPct: number | null;
    costPerKgLkr: number | null;
    riskIndex: number | null;
    recommendationCompletionRatePct: number | null;
    overdueRecommendations: number;
  };
  estates: { estate: { id: string; name: string; code: string; group: { name: string } }; kpis: EstateKpis }[];
  divisions: DivisionMetrics[];
  watchlist: DivisionMetrics[];
};

export default function DashboardPage() {
  const { me } = useAuth();
  const { data, isLoading, error } = useQuery({
    queryKey: ['dashboard'],
    queryFn: () => api<DashboardData>('/api/dashboard'),
  });

  const user = me?.user;
  const singleEstate = data?.estates.length === 1 ? data.estates[0] : null;

  return (
    <AppShell>
      <div className="space-y-4">
        <div>
          <h1 className="text-lg font-bold text-forest-700">
            {greeting()}, {user?.name?.split(' ')[0] ?? 'there'}
          </h1>
          <p className="text-sm text-slate-500">
            {user ? ROLE_LABELS[user.role] : ''} · cinnamon portfolio overview
          </p>
        </div>

        {isLoading ? <Spinner /> : null}
        {error ? <ErrorNote error={error} /> : null}

        {data ? (
          <>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              <KpiCard label="Cinnamon area" value={ha(data.portfolio.cinnamonAreaHa)} sub={`${data.portfolio.divisionCount} divisions`} />
              <KpiCard label="Forecast yield" value={kgHa(data.portfolio.forecastedYieldKgHa)} sub="Current season" tone="warn" />
              <KpiCard label="Last actual yield" value={kgHa(data.portfolio.actualYieldKgHa)} sub="Last completed season" />
              <KpiCard label="Predicted yield" value={kgHa(data.portfolio.predictedYieldKgHa)} sub="Model estimate" />
              <KpiCard label="Forecast accuracy" value={pct(data.portfolio.forecastAccuracyPct)} />
              <KpiCard label="Cost per kg" value={lkr(data.portfolio.costPerKgLkr)} />
              <KpiCard
                label="Actions completed"
                value={pct(data.portfolio.recommendationCompletionRatePct, 0)}
                sub={`${data.portfolio.overdueRecommendations} overdue`}
                tone={data.portfolio.overdueRecommendations > 0 ? 'warn' : 'good'}
              />
              <KpiCard
                label="Risk index"
                value={num(data.portfolio.riskIndex, 0)}
                sub="0 = safe · 100 = critical"
                tone={(data.portfolio.riskIndex ?? 0) >= 50 ? 'bad' : (data.portfolio.riskIndex ?? 0) >= 25 ? 'warn' : 'good'}
              />
            </div>

            {singleEstate ? (
              <Link href={`/estate/${singleEstate.estate.id}`} className="btn-primary w-full">
                Open {singleEstate.estate.name} Estate
              </Link>
            ) : null}

            {data.scope === 'DIVISION' ? (
              <Panel title={`Your divisions (${data.divisions.length})`}>
                {data.divisions.length === 0 ? (
                  <Empty>No divisions have been assigned to you yet.</Empty>
                ) : (
                  <ul className="divide-y divide-slate-100">
                    {data.divisions.map((d) => (
                      <li key={d.divisionId}>
                        <Link href={`/division/${d.divisionId}`} className="flex items-center gap-3 py-3">
                          <div className="min-w-0 flex-1">
                            <p className="truncate text-sm font-semibold text-ink">{d.name}</p>
                            <p className="truncate text-xs text-slate-500">
                              {d.estateName} Estate · {ha(d.areaHa)} · {d.openRecommendations} open action(s)
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="text-sm font-bold text-forest-600">{kgHa(d.lastSeasonYieldKgHa)}</p>
                            <p className="text-xs">
                              <Variance value={d.yieldVariancePct} />
                            </p>
                          </div>
                          <RiskBadge level={d.riskLevel} index={d.riskIndex} />
                        </Link>
                      </li>
                    ))}
                  </ul>
                )}
              </Panel>
            ) : null}

            <Panel title={`Estates (${data.estates.length})`}>
              {data.estates.length === 0 ? (
                <Empty>
                  {data.scope === 'DIVISION'
                    ? 'Estate roll-ups are available to estate managers and above.'
                    : 'No estates are in your access scope yet.'}
                </Empty>
              ) : (
                <ul className="divide-y divide-slate-100">
                  {data.estates.map(({ estate, kpis }) => (
                    <li key={estate.id}>
                      <Link href={`/estate/${estate.id}`} className="flex items-center gap-3 py-3">
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-semibold text-ink">{estate.name} Estate</p>
                          <p className="truncate text-xs text-slate-500">
                            {estate.group.name} group · {ha(kpis.cinnamonAreaHa)} cinnamon · {kpis.divisionCount} divisions
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-bold text-forest-600">{kgHa(kpis.actualYieldKgHa)}</p>
                          <p className="text-xs">
                            <Variance value={kpis.yieldVariancePct} />
                          </p>
                        </div>
                        <RiskBadge level={kpis.riskLevel} index={kpis.riskIndex} />
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
            </Panel>

            <Panel title="Watchlist — highest risk divisions">
              {data.watchlist.length === 0 ? (
                <Empty>Nothing flagged.</Empty>
              ) : (
                <ul className="divide-y divide-slate-100">
                  {data.watchlist.map((d) => (
                    <li key={d.divisionId}>
                      <Link href={`/division/${d.divisionId}`} className="flex items-start gap-3 py-3">
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-semibold text-ink">
                            {d.name} <span className="font-normal text-slate-400">· {d.estateName}</span>
                          </p>
                          <p className="mt-0.5 text-xs text-slate-500">
                            {d.riskDrivers[0] ?? 'No agronomic driver flagged'}
                          </p>
                        </div>
                        <RiskBadge level={d.riskLevel} index={d.riskIndex} />
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
            </Panel>
          </>
        ) : null}
      </div>
    </AppShell>
  );
}

function greeting(): string {
  const h = new Date().getHours();
  if (h < 12) return 'Good morning';
  if (h < 17) return 'Good afternoon';
  return 'Good evening';
}
