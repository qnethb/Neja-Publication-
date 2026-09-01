'use client';

import Link from 'next/link';
import type { ReactNode } from 'react';
import { num, signedPct } from '@/lib/format';

export function KpiCard({
  label,
  value,
  sub,
  tone = 'default',
}: {
  label: string;
  value: string;
  sub?: string;
  tone?: 'default' | 'good' | 'warn' | 'bad';
}) {
  const toneClass = {
    default: 'text-forest-600',
    good: 'text-forest-500',
    warn: 'text-cinnamon-500',
    bad: 'text-red-600',
  }[tone];

  return (
    <div className="card card-pad">
      <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">{label}</p>
      <p className={`mt-1 text-xl font-bold leading-tight ${toneClass}`}>{value}</p>
      {sub ? <p className="mt-0.5 text-[11px] text-slate-400">{sub}</p> : null}
    </div>
  );
}

export function RiskBadge({ level, index }: { level: string; index?: number }) {
  const styles: Record<string, string> = {
    LOW: 'bg-forest-100 text-forest-700',
    MEDIUM: 'bg-cinnamon-100 text-cinnamon-700',
    HIGH: 'bg-red-100 text-red-700',
  };
  return (
    <span className={`chip ${styles[level] ?? 'bg-slate-100 text-slate-600'}`}>
      {level}
      {index !== undefined ? ` ${num(index, 0)}` : ''}
    </span>
  );
}

export function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    PENDING: 'bg-slate-100 text-slate-600',
    IN_PROGRESS: 'bg-blue-100 text-blue-700',
    COMPLETED: 'bg-forest-100 text-forest-700',
    OVERDUE: 'bg-red-100 text-red-700',
  };
  return <span className={`chip ${styles[status] ?? 'bg-slate-100'}`}>{status.replace('_', ' ')}</span>;
}

export function PriorityBadge({ priority }: { priority: string }) {
  const styles: Record<string, string> = {
    HIGH: 'bg-red-100 text-red-700',
    MEDIUM: 'bg-cinnamon-100 text-cinnamon-700',
    LOW: 'bg-slate-100 text-slate-600',
  };
  return <span className={`chip ${styles[priority] ?? 'bg-slate-100'}`}>{priority}</span>;
}

export function Variance({ value }: { value: number | null | undefined }) {
  if (value === null || value === undefined) return <span className="text-slate-400">—</span>;
  const tone = value >= 0 ? 'text-forest-600' : value >= -10 ? 'text-cinnamon-600' : 'text-red-600';
  return <span className={`font-semibold ${tone}`}>{signedPct(value)}</span>;
}

export function Panel({
  title,
  action,
  children,
}: {
  title: string;
  action?: ReactNode;
  children: ReactNode;
}) {
  return (
    <section className="card">
      <header className="flex items-center justify-between gap-3 border-b border-slate-100 px-4 py-3">
        <h2 className="section-title">{title}</h2>
        {action}
      </header>
      <div className="p-4">{children}</div>
    </section>
  );
}

export function Empty({ children }: { children: ReactNode }) {
  return <p className="py-6 text-center text-sm text-slate-400">{children}</p>;
}

export function Spinner({ label = 'Loading…' }: { label?: string }) {
  return (
    <div className="flex items-center justify-center gap-2 py-10 text-sm text-slate-500">
      <span className="h-4 w-4 animate-spin rounded-full border-2 border-forest-200 border-t-forest-600" />
      {label}
    </div>
  );
}

export function ErrorNote({ error }: { error: unknown }) {
  const message = error instanceof Error ? error.message : 'Something went wrong';
  return (
    <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{message}</div>
  );
}

export function BackLink({ href, children }: { href: string; children: ReactNode }) {
  return (
    <Link href={href} className="inline-flex items-center gap-1 text-sm font-semibold text-forest-700">
      <span aria-hidden>←</span> {children}
    </Link>
  );
}

export function Tabs({
  tabs,
  active,
  onChange,
}: {
  tabs: { id: string; label: string }[];
  active: string;
  onChange: (id: string) => void;
}) {
  return (
    <div className="-mx-4 overflow-x-auto px-4">
      <div role="tablist" className="flex w-max gap-1 rounded-xl bg-slate-100 p-1">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            role="tab"
            aria-selected={active === tab.id}
            onClick={() => onChange(tab.id)}
            className={`min-h-[40px] whitespace-nowrap rounded-lg px-4 text-sm font-semibold transition ${
              active === tab.id ? 'bg-white text-forest-700 shadow-sm' : 'text-slate-500'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>
    </div>
  );
}
