'use client';

import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';

const GREEN = '#1b5e20';
const GOLD = '#c98a1e';

const axis = { fontSize: 11, fill: '#64748b' };

export function YieldTrendChart({
  data,
}: {
  data: { season: string; forecastKgHa: number | null; actualKgHa: number | null }[];
}) {
  return (
    <ResponsiveContainer width="100%" height={220}>
      <BarChart data={data} margin={{ top: 8, right: 8, left: -18, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
        <XAxis dataKey="season" tick={axis} tickLine={false} axisLine={false} />
        <YAxis tick={axis} tickLine={false} axisLine={false} width={46} />
        <Tooltip
          formatter={(v) => (v === null || v === undefined ? '—' : `${v} kg/ha`)}
          contentStyle={{ fontSize: 12, borderRadius: 8, border: '1px solid #e2e8f0' }}
        />
        <Legend wrapperStyle={{ fontSize: 11 }} />
        <Bar dataKey="forecastKgHa" name="Forecast" fill={GOLD} radius={[4, 4, 0, 0]} />
        <Bar dataKey="actualKgHa" name="Actual" fill={GREEN} radius={[4, 4, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}

export function DivisionYieldChart({
  data,
}: {
  data: { season: string; expectedYieldKgHa: number; actualYieldKgHa: number | null }[];
}) {
  return (
    <ResponsiveContainer width="100%" height={220}>
      <LineChart data={data} margin={{ top: 8, right: 8, left: -18, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
        <XAxis dataKey="season" tick={axis} tickLine={false} axisLine={false} />
        <YAxis tick={axis} tickLine={false} axisLine={false} width={46} />
        <Tooltip
          formatter={(v) => (v === null || v === undefined ? '—' : `${v} kg/ha`)}
          contentStyle={{ fontSize: 12, borderRadius: 8, border: '1px solid #e2e8f0' }}
        />
        <Legend wrapperStyle={{ fontSize: 11 }} />
        <Line
          type="monotone"
          dataKey="expectedYieldKgHa"
          name="Forecast"
          stroke={GOLD}
          strokeWidth={2}
          strokeDasharray="5 4"
          dot={{ r: 3 }}
        />
        <Line
          type="monotone"
          dataKey="actualYieldKgHa"
          name="Actual"
          stroke={GREEN}
          strokeWidth={2.5}
          dot={{ r: 3 }}
          connectNulls
        />
      </LineChart>
    </ResponsiveContainer>
  );
}

export function RainfallChart({ data }: { data: { month: string; rainfallMm: number }[] }) {
  return (
    <ResponsiveContainer width="100%" height={170}>
      <BarChart data={data} margin={{ top: 8, right: 8, left: -22, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
        <XAxis dataKey="month" tick={{ ...axis, fontSize: 10 }} tickLine={false} axisLine={false} />
        <YAxis tick={axis} tickLine={false} axisLine={false} width={42} />
        <Tooltip
          formatter={(v) => `${v} mm`}
          contentStyle={{ fontSize: 12, borderRadius: 8, border: '1px solid #e2e8f0' }}
        />
        <Bar dataKey="rainfallMm" name="Rainfall" radius={[3, 3, 0, 0]}>
          {data.map((d, i) => (
            <Cell key={i} fill={d.rainfallMm < 80 ? '#e3ab3f' : '#2e7d32'} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}
