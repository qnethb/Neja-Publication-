export function num(value: number | null | undefined, dp = 1, dash = '—'): string {
  if (value === null || value === undefined || Number.isNaN(value)) return dash;
  return value.toLocaleString('en-LK', { minimumFractionDigits: dp, maximumFractionDigits: dp });
}

export function pct(value: number | null | undefined, dp = 1): string {
  if (value === null || value === undefined || Number.isNaN(value)) return '—';
  return `${value > 0 && dp >= 0 ? '' : ''}${num(value, dp)}%`;
}

export function signedPct(value: number | null | undefined, dp = 1): string {
  if (value === null || value === undefined || Number.isNaN(value)) return '—';
  return `${value >= 0 ? '+' : ''}${num(value, dp)}%`;
}

export function lkr(value: number | null | undefined, dp = 2): string {
  if (value === null || value === undefined || Number.isNaN(value)) return '—';
  return `LKR ${num(value, dp)}`;
}

export function ha(value: number | null | undefined): string {
  return value === null || value === undefined ? '—' : `${num(value, 1)} ha`;
}

export function kgHa(value: number | null | undefined): string {
  return value === null || value === undefined ? '—' : `${num(value, 0)} kg/ha`;
}

export function shortDate(value: string | Date | null | undefined): string {
  if (!value) return '—';
  const d = typeof value === 'string' ? new Date(value) : value;
  if (Number.isNaN(d.getTime())) return '—';
  return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
}

export function titleCase(value: string | null | undefined): string {
  if (!value) return '—';
  return value
    .split('_')
    .map((w) => w.charAt(0) + w.slice(1).toLowerCase())
    .join(' ');
}
