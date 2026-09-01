'use client';

import Link from 'next/link';
import { KpiCard, Panel, Empty } from '@/components/ui';
import { YieldTrendChart } from '@/components/charts';
import { ha, kgHa, lkr, num, pct, signedPct } from '@/lib/format';
import type { EstateKpiResponse } from './types';

export function OverviewTab({ data }: { data: EstateKpiResponse }) {
  const k = data.kpis;

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <KpiCard label="Cinnamon area" value={ha(k.cinnamonAreaHa)} sub={`${k.divisionCount} divisions`} />
        <KpiCard label="Forecast yield" value={kgHa(k.forecastedYieldKgHa)} sub={`Season ${k.season ?? '—'}`} tone="warn" />
        <KpiCard label="Actual yield" value={kgHa(k.actualYieldKgHa)} sub={`Season ${k.lastCompletedSeason ?? '—'}`} />
        <KpiCard
          label="Yield variance"
          value={signedPct(k.yieldVariancePct)}
          sub="Actual vs forecast"
          tone={k.yieldVariancePct === null ? 'default' : k.yieldVariancePct >= 0 ? 'good' : k.yieldVariancePct >= -10 ? 'warn' : 'bad'}
        />
        <KpiCard label="Forecast accuracy" value={pct(k.forecastAccuracyPct)} sub="All closed seasons" />
        <KpiCard label="Cost per kg" value={lkr(k.costPerKgLkr)} sub="Field cost / green bark" />
        <KpiCard
          label="Actions completed"
          value={pct(k.recommendationCompletionRatePct, 0)}
          tone={(k.recommendationCompletionRatePct ?? 0) >= 70 ? 'good' : 'warn'}
        />
        <KpiCard
          label="Risk index"
          value={`${num(k.riskIndex, 0)} · ${k.riskLevel}`}
          sub="Soil K · rainfall · stand age"
          tone={k.riskLevel === 'HIGH' ? 'bad' : k.riskLevel === 'MEDIUM' ? 'warn' : 'good'}
        />
      </div>

      <Panel title="Yield trend — forecast vs actual">
        {data.trend.length === 0 ? <Empty>No season data yet.</Empty> : <YieldTrendChart data={data.trend.slice(-4)} />}
      </Panel>

      <Panel title={`Alerts (${data.alerts.length})`}>
        {data.alerts.length === 0 ? (
          <Empty>No alerts — all divisions within tolerance.</Empty>
        ) : (
          <ul className="space-y-2">
            {data.alerts.map((a, i) => (
              <li key={i}>
                <Link
                  href={`/division/${a.divisionId}`}
                  className={`flex items-start gap-3 rounded-lg border-l-4 px-3 py-2.5 ${
                    a.severity === 'HIGH'
                      ? 'border-red-500 bg-red-50'
                      : 'border-cinnamon-300 bg-cinnamon-50'
                  }`}
                >
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-ink">{a.division}</p>
                    <p className="text-xs text-slate-600">{a.message}</p>
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </Panel>
    </div>
  );
}
