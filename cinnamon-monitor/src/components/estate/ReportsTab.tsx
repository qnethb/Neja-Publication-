'use client';

import { Panel } from '@/components/ui';

const REPORTS = [
  {
    key: 'estate-season-performance',
    title: 'Estate Season Performance',
    description: 'KPI scorecard, per-division yield, field cost and risk commentary for the selected season.',
    formats: ['pdf', 'csv'] as const,
  },
  {
    key: 'forecast-accuracy',
    title: 'Forecast Accuracy',
    description: 'Forecast versus actual by division and season, with absolute error and accuracy scores.',
    formats: ['csv'] as const,
  },
  {
    key: 'soil-nutrition',
    title: 'Soil & Nutrition',
    description: 'Laboratory and field readings — pH, N, P, K, organic matter, rainfall — with agronomic flags.',
    formats: ['csv'] as const,
  },
  {
    key: 'management-actions',
    title: 'Management Actions',
    description: 'Every recommendation with owner, due date, status and overdue marker.',
    formats: ['csv'] as const,
  },
];

export function ReportsTab({ estateId, season }: { estateId: string; season: string | null }) {
  // `season` is null until the user picks one; the performance report then
  // defaults, server side, to the last closed season.
  function url(key: string, format: string) {
    const params = new URLSearchParams({ estateId, format });
    if (key === 'estate-season-performance' && season) params.set('season', season);
    return `/api/reports/${key}?${params.toString()}`;
  }

  return (
    <div className="space-y-3">
      <p className="text-xs text-slate-500">
        Season Performance covers {season ?? 'the last closed season'}. Pick a season above to change it.
      </p>
      {REPORTS.map((report) => (
        <Panel key={report.key} title={report.title}>
          <p className="text-sm text-slate-600">{report.description}</p>
          <div className="mt-3 flex flex-wrap gap-2">
            {report.formats.map((format) => (
              <a
                key={format}
                href={url(report.key, format)}
                className={format === 'pdf' ? 'btn-primary px-4' : 'btn-secondary px-4'}
                download
              >
                Download {format.toUpperCase()}
              </a>
            ))}
            <a href={url(report.key, 'json')} target="_blank" rel="noreferrer" className="btn-secondary px-4">
              View JSON
            </a>
          </div>
        </Panel>
      ))}
    </div>
  );
}
