'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import Link from 'next/link';
import { AppShell } from '@/components/AppShell';
import { Empty, ErrorNote, Panel, Spinner } from '@/components/ui';
import { useAuth } from '@/app/providers';
import { api, post } from '@/lib/client';
import { ROLES, ROLE_LABELS, type Role } from '@/lib/domain';
import { ha } from '@/lib/format';

type UserRow = {
  id: string;
  name: string;
  email: string;
  role: Role;
  active: boolean;
  groups?: { id: string; name: string }[];
  estates?: { id: string; name: string }[];
  divisions?: { id: string; name: string }[];
};

type GroupRow = {
  id: string;
  name: string;
  region: string;
  generalManager: { name: string } | null;
  estates: { id: string; name: string; code: string; totalAreaHa: number }[];
};

export default function AdminPage() {
  const { me } = useAuth();
  const queryClient = useQueryClient();
  const isAdmin = me?.user?.role === 'TOP_MANAGEMENT';

  const users = useQuery({ queryKey: ['users'], queryFn: () => api<UserRow[]>('/api/users'), enabled: isAdmin });
  const groups = useQuery({ queryKey: ['groups'], queryFn: () => api<GroupRow[]>('/api/groups') });

  const [form, setForm] = useState({ name: '', email: '', password: '', role: 'FIELD_OFFICER' as Role });
  const create = useMutation({
    mutationFn: () => post('/api/users', form),
    onSuccess: () => {
      setForm({ name: '', email: '', password: '', role: 'FIELD_OFFICER' });
      queryClient.invalidateQueries({ queryKey: ['users'] });
    },
  });

  if (me && !isAdmin) {
    return (
      <AppShell>
        <ErrorNote error={new Error('Admin tools are limited to Top Management.')} />
      </AppShell>
    );
  }

  return (
    <AppShell>
      <div className="space-y-4">
        <div>
          <h1 className="text-lg font-bold text-forest-700">Administration</h1>
          <p className="text-sm text-slate-500">Estate structure and user access</p>
        </div>

        <Panel title="Groups and estates">
          {groups.isLoading ? <Spinner /> : null}
          {groups.data?.length === 0 ? <Empty>No groups seeded.</Empty> : null}
          <ul className="space-y-3">
            {(groups.data ?? []).map((g) => (
              <li key={g.id}>
                <p className="text-sm font-bold text-ink">
                  {g.name} <span className="font-normal text-slate-400">· {g.region}</span>
                </p>
                <p className="text-xs text-slate-500">GM: {g.generalManager?.name ?? 'Unassigned'}</p>
                {g.estates.length > 0 ? (
                  <ul className="mt-1 space-y-1">
                    {g.estates.map((e) => (
                      <li key={e.id}>
                        <Link href={`/estate/${e.id}`} className="text-xs font-semibold text-forest-700">
                          {e.name} ({e.code}) · {ha(e.totalAreaHa)}
                        </Link>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-xs italic text-slate-400">No estates yet</p>
                )}
              </li>
            ))}
          </ul>
        </Panel>

        <Panel title="Create user">
          <form
            className="space-y-3"
            onSubmit={(e) => {
              e.preventDefault();
              create.mutate();
            }}
          >
            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <label className="label">Name</label>
                <input className="input" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
              </div>
              <div>
                <label className="label">Email</label>
                <input
                  type="email"
                  className="input"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  required
                />
              </div>
              <div>
                <label className="label">Password</label>
                <input
                  type="password"
                  className="input"
                  minLength={8}
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                  required
                />
              </div>
              <div>
                <label className="label">Role</label>
                <select className="input" value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value as Role })}>
                  {ROLES.map((r) => (
                    <option key={r} value={r}>
                      {ROLE_LABELS[r]}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            {create.error ? <ErrorNote error={create.error} /> : null}
            <button className="btn-primary w-full" disabled={create.isPending}>
              {create.isPending ? 'Creating…' : 'Create user'}
            </button>
            <p className="text-xs text-slate-400">
              Assign estates, groups or divisions afterwards by seeding or extending this screen.
            </p>
          </form>
        </Panel>

        <Panel title={`Users (${users.data?.length ?? 0})`}>
          {users.isLoading ? <Spinner /> : null}
          <ul className="divide-y divide-slate-100">
            {(users.data ?? []).map((u) => (
              <li key={u.id} className="py-2.5">
                <p className="text-sm font-semibold text-ink">{u.name}</p>
                <p className="text-xs text-slate-500">
                  {ROLE_LABELS[u.role]} · {u.email}
                </p>
                <p className="text-[11px] text-slate-400">
                  {scopeSummary(u)}
                </p>
              </li>
            ))}
          </ul>
        </Panel>
      </div>
    </AppShell>
  );
}

function scopeSummary(u: UserRow): string {
  const parts: string[] = [];
  if (u.groups?.length) parts.push(`Groups: ${u.groups.map((g) => g.name).join(', ')}`);
  if (u.estates?.length) parts.push(`Estates: ${u.estates.map((e) => e.name).join(', ')}`);
  if (u.divisions?.length) parts.push(`Divisions: ${u.divisions.map((d) => d.name).join(', ')}`);
  return parts.length ? parts.join(' · ') : 'Scope from management appointments';
}
