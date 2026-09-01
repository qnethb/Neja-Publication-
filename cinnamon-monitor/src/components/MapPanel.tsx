'use client';

import dynamic from 'next/dynamic';
import { useState } from 'react';
import type { MapDivision } from './DivisionMapView';

// Leaflet touches `window` on import, so the map is loaded only in the browser.
const DivisionMapView = dynamic(() => import('./DivisionMapView'), {
  ssr: false,
  loading: () => (
    <div className="grid h-[380px] place-items-center rounded-xl bg-slate-100 text-sm text-slate-500">
      Loading map…
    </div>
  ),
});

export function MapPanel({ divisions, height }: { divisions: MapDivision[]; height?: number }) {
  const [mode, setMode] = useState<'risk' | 'yield'>('risk');
  const withBoundary = divisions.filter((d) => d.geoJsonBoundary);

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-2">
        <span className="section-title">Colour by</span>
        {(['risk', 'yield'] as const).map((m) => (
          <button
            key={m}
            onClick={() => setMode(m)}
            className={`chip ${mode === m ? 'bg-forest-600 text-white' : 'bg-slate-100 text-slate-600'}`}
          >
            {m === 'risk' ? 'Risk status' : 'Predicted yield'}
          </button>
        ))}
      </div>

      {withBoundary.length === 0 ? (
        <div className="grid h-[220px] place-items-center rounded-xl bg-slate-100 text-sm text-slate-500">
          No division boundaries have been uploaded yet.
        </div>
      ) : (
        <DivisionMapView divisions={withBoundary} mode={mode} height={height} />
      )}

      <div className="flex flex-wrap gap-3 text-[11px] text-slate-500">
        {mode === 'risk'
          ? [
              ['#2e7d32', 'Low risk'],
              ['#c98a1e', 'Medium risk'],
              ['#b91c1c', 'High risk'],
            ].map(([color, label]) => <LegendDot key={label} color={color} label={label} />)
          : [
              ['#14532d', '500+ kg/ha'],
              ['#2e7d32', '400–499'],
              ['#6fb073', '300–399'],
              ['#e3ab3f', 'Below 300'],
            ].map(([color, label]) => <LegendDot key={label} color={color} label={label} />)}
      </div>
    </div>
  );
}

function LegendDot({ color, label }: { color: string; label: string }) {
  return (
    <span className="inline-flex items-center gap-1.5">
      <span className="h-3 w-3 rounded-sm" style={{ backgroundColor: color }} />
      {label}
    </span>
  );
}
