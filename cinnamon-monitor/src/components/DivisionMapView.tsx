'use client';

import 'leaflet/dist/leaflet.css';
import { useMemo } from 'react';
import { GeoJSON, MapContainer, Popup, TileLayer, Tooltip } from 'react-leaflet';
import type { Feature, Geometry } from 'geojson';
import Link from 'next/link';
import { kgHa, ha } from '@/lib/format';

export type MapDivision = {
  divisionId: string;
  name: string;
  areaHa: number;
  geoJsonBoundary: string | null;
  centroidLat: number | null;
  centroidLng: number | null;
  predictedYieldKgHa: number | null;
  lastSeasonYieldKgHa: number | null;
  riskLevel: string;
  riskIndex: number;
};

const RISK_COLORS: Record<string, string> = {
  LOW: '#2e7d32',
  MEDIUM: '#c98a1e',
  HIGH: '#b91c1c',
};

// Predicted-yield bands used when the map is coloured by production potential.
const YIELD_BANDS: [number, string][] = [
  [500, '#14532d'],
  [400, '#2e7d32'],
  [300, '#6fb073'],
  [0, '#e3ab3f'],
];

export function colorFor(division: MapDivision, mode: 'risk' | 'yield'): string {
  if (mode === 'risk') return RISK_COLORS[division.riskLevel] ?? '#64748b';
  const value = division.predictedYieldKgHa ?? division.lastSeasonYieldKgHa ?? 0;
  return (YIELD_BANDS.find(([min]) => value >= min) ?? YIELD_BANDS[YIELD_BANDS.length - 1])[1];
}

export default function DivisionMapView({
  divisions,
  mode,
  height = 380,
}: {
  divisions: MapDivision[];
  mode: 'risk' | 'yield';
  height?: number;
}) {
  const withBoundary = useMemo(
    () =>
      divisions.flatMap((d) => {
        if (!d.geoJsonBoundary) return [];
        try {
          return [{ division: d, feature: JSON.parse(d.geoJsonBoundary) as Feature<Geometry> }];
        } catch {
          return [];
        }
      }),
    [divisions],
  );

  const center = useMemo<[number, number]>(() => {
    const pts = divisions.filter((d) => d.centroidLat !== null && d.centroidLng !== null);
    if (pts.length === 0) return [6.93, 80.34];
    return [
      pts.reduce((a, d) => a + (d.centroidLat as number), 0) / pts.length,
      pts.reduce((a, d) => a + (d.centroidLng as number), 0) / pts.length,
    ];
  }, [divisions]);

  return (
    <MapContainer
      center={center}
      zoom={12}
      scrollWheelZoom={false}
      style={{ height, width: '100%' }}
      attributionControl={false}
    >
      <TileLayer
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        attribution="&copy; OpenStreetMap contributors"
      />
      {withBoundary.map(({ division, feature }) => (
        <GeoJSON
          key={`${division.divisionId}-${mode}`}
          data={feature}
          style={{
            color: colorFor(division, mode),
            weight: 2,
            fillColor: colorFor(division, mode),
            fillOpacity: 0.35,
          }}
        >
          <Tooltip sticky>
            <span className="text-xs font-semibold">{division.name}</span>
          </Tooltip>
          <MapPopupContent division={division} />
        </GeoJSON>
      ))}
    </MapContainer>
  );
}

function MapPopupContent({ division }: { division: MapDivision }) {
  return (
    <Popup>
      <div className="min-w-[180px] space-y-1 text-xs">
        <p className="text-sm font-bold text-forest-700">{division.name}</p>
        <p>Area: {ha(division.areaHa)}</p>
        <p>Predicted: {kgHa(division.predictedYieldKgHa)}</p>
        <p>Last season: {kgHa(division.lastSeasonYieldKgHa)}</p>
        <p>
          Risk: {division.riskLevel} ({division.riskIndex})
        </p>
        <Link href={`/division/${division.divisionId}`} className="font-semibold text-forest-700 underline">
          View details →
        </Link>
      </div>
    </Popup>
  );
}
