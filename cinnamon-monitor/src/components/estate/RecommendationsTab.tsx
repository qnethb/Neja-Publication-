'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { Empty, ErrorNote, Panel, PriorityBadge, Spinner, StatusBadge } from '@/components/ui';
import { api, patch, post } from '@/lib/client';
import { shortDate } from '@/lib/format';
import { PRIORITIES, REC_STATUSES } from '@/lib/domain';
import { useAuth } from '@/app/providers';
import type { DivisionMetrics } from '@/lib/kpi';

export type RecommendationRow = {
  id: string;
  divisionId: string;
  division: { id: string; name: string };
  priority: string;
  status: string;
  actionTitle: string;
  actionDescription: string;
  rationale: string | null;
  expectedImpact: string | null;
  dueDate: string | null;
  progressNotes: string | null;
  assignedTo: { id: string; name: string } | null;
  createdBy: { id: string; name: string } | null;
};

export function RecommendationsTab({
  estateId,
  divisions,
}: {
  estateId: string;
  divisions: DivisionMetrics[];
}) {
  const { me } = useAuth();
  const queryClient = useQueryClient();
  const [status, setStatus] = useState('ALL');
  const [priority, setPriority] = useState('ALL');
  const [divisionId, setDivisionId] = useState('ALL');
  const [composerOpen, setComposerOpen] = useState(false);

  const canCreate = me?.user?.permissions.createRecommendation ?? false;
  const canUpdate = me?.user ? me.user.role !== 'FIELD_OFFICER' : false;

  const { data, isLoading, error } = useQuery({
    queryKey: ['recommendations', estateId],
    queryFn: () => api<RecommendationRow[]>(`/api/recommendations?estateId=${estateId}`),
  });

  const update = useMutation({
    mutationFn: (vars: { id: string; status?: string; progressNotes?: string }) =>
      patch(`/api/recommendations/${vars.id}`, { status: vars.status, progressNotes: vars.progressNotes }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['recommendations', estateId] });
      queryClient.invalidateQueries({ queryKey: ['estate-kpis'] });
    },
  });

  const rows = (data ?? []).filter(
    (r) =>
      (status === 'ALL' || r.status === status) &&
      (priority === 'ALL' || r.priority === priority) &&
      (divisionId === 'ALL' || r.divisionId === divisionId),
  );

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-2">
        <select className="input max-w-[150px]" value={status} onChange={(e) => setStatus(e.target.value)} aria-label="Filter status">
          <option value="ALL">All statuses</option>
          {REC_STATUSES.map((s) => (
            <option key={s} value={s}>
              {s.replace('_', ' ')}
            </option>
          ))}
        </select>
        <select className="input max-w-[140px]" value={priority} onChange={(e) => setPriority(e.target.value)} aria-label="Filter priority">
          <option value="ALL">All priorities</option>
          {PRIORITIES.map((p) => (
            <option key={p} value={p}>
              {p}
            </option>
          ))}
        </select>
        <select className="input max-w-[170px]" value={divisionId} onChange={(e) => setDivisionId(e.target.value)} aria-label="Filter division">
          <option value="ALL">All divisions</option>
          {divisions.map((d) => (
            <option key={d.divisionId} value={d.divisionId}>
              {d.name}
            </option>
          ))}
        </select>
      </div>

      {canCreate ? (
        <button className="btn-amber w-full" onClick={() => setComposerOpen((v) => !v)}>
          {composerOpen ? 'Close' : '+ New recommendation'}
        </button>
      ) : null}

      {composerOpen && canCreate ? (
        <RecommendationComposer
          divisions={divisions}
          estateId={estateId}
          onDone={() => {
            setComposerOpen(false);
            queryClient.invalidateQueries({ queryKey: ['recommendations', estateId] });
          }}
        />
      ) : null}

      {isLoading ? <Spinner /> : null}
      {error ? <ErrorNote error={error} /> : null}
      {update.error ? <ErrorNote error={update.error} /> : null}

      {rows.length === 0 && !isLoading ? <Empty>No recommendations match these filters.</Empty> : null}

      <ul className="space-y-2">
        {rows.map((r) => (
          <RecommendationCard
            key={r.id}
            rec={r}
            canUpdate={canUpdate}
            onStatus={(next) => update.mutate({ id: r.id, status: next })}
            busy={update.isPending}
          />
        ))}
      </ul>
    </div>
  );
}

function RecommendationCard({
  rec,
  canUpdate,
  onStatus,
  busy,
}: {
  rec: RecommendationRow;
  canUpdate: boolean;
  onStatus: (status: string) => void;
  busy: boolean;
}) {
  const [open, setOpen] = useState(false);
  const overdue = rec.status !== 'COMPLETED' && rec.dueDate && new Date(rec.dueDate) < new Date();

  return (
    <li className="card card-pad">
      <div className="flex items-start justify-between gap-2">
        <button className="min-w-0 flex-1 text-left" onClick={() => setOpen((v) => !v)}>
          <p className="text-sm font-bold text-ink">{rec.actionTitle}</p>
          <p className="mt-0.5 text-xs text-slate-500">
            {rec.division.name} · due {shortDate(rec.dueDate)}
            {overdue ? <span className="font-semibold text-red-600"> · overdue</span> : null}
          </p>
        </button>
        <div className="flex shrink-0 flex-col items-end gap-1">
          <PriorityBadge priority={rec.priority} />
          <StatusBadge status={overdue ? 'OVERDUE' : rec.status} />
        </div>
      </div>

      {open ? (
        <div className="mt-3 space-y-2 border-t border-slate-100 pt-3 text-sm text-slate-600">
          <p>{rec.actionDescription}</p>
          {rec.rationale ? (
            <p className="text-xs">
              <span className="font-semibold text-slate-500">Why: </span>
              {rec.rationale}
            </p>
          ) : null}
          {rec.expectedImpact ? (
            <p className="text-xs">
              <span className="font-semibold text-slate-500">Expected impact: </span>
              {rec.expectedImpact}
            </p>
          ) : null}
          <p className="text-xs text-slate-400">
            Issued by {rec.createdBy?.name ?? '—'} · owner {rec.assignedTo?.name ?? 'unassigned'}
          </p>
          {rec.progressNotes ? <p className="text-xs italic">{rec.progressNotes}</p> : null}

          {canUpdate ? (
            <div className="flex flex-wrap gap-2 pt-1">
              {['PENDING', 'IN_PROGRESS', 'COMPLETED']
                .filter((s) => s !== rec.status)
                .map((s) => (
                  <button key={s} className="btn-secondary px-3 text-xs" disabled={busy} onClick={() => onStatus(s)}>
                    Mark {s.replace('_', ' ').toLowerCase()}
                  </button>
                ))}
            </div>
          ) : null}
        </div>
      ) : null}
    </li>
  );
}

function RecommendationComposer({
  divisions,
  estateId,
  onDone,
}: {
  divisions: DivisionMetrics[];
  estateId: string;
  onDone: () => void;
}) {
  const [form, setForm] = useState({
    divisionId: divisions[0]?.divisionId ?? '',
    priority: 'MEDIUM',
    actionTitle: '',
    actionDescription: '',
    rationale: '',
    expectedImpact: '',
    dueDate: '',
  });

  const { data: users } = useQuery({
    queryKey: ['estate-users', estateId],
    queryFn: () => api<{ id: string; name: string; role: string }[]>(`/api/users?estateId=${estateId}`),
  });
  const [assignedToId, setAssignedToId] = useState('');

  const create = useMutation({
    mutationFn: () =>
      post(`/api/divisions/${form.divisionId}/recommendations`, {
        ...form,
        assignedToId: assignedToId || null,
        dueDate: form.dueDate || null,
      }),
    onSuccess: onDone,
  });

  return (
    <form
      className="card card-pad space-y-3"
      onSubmit={(e) => {
        e.preventDefault();
        create.mutate();
      }}
    >
      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <label className="label">Division</label>
          <select
            className="input"
            value={form.divisionId}
            onChange={(e) => setForm({ ...form, divisionId: e.target.value })}
            required
          >
            {divisions.map((d) => (
              <option key={d.divisionId} value={d.divisionId}>
                {d.name}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="label">Priority</label>
          <select className="input" value={form.priority} onChange={(e) => setForm({ ...form, priority: e.target.value })}>
            {PRIORITIES.map((p) => (
              <option key={p} value={p}>
                {p}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div>
        <label className="label">Action title</label>
        <input
          className="input"
          value={form.actionTitle}
          onChange={(e) => setForm({ ...form, actionTitle: e.target.value })}
          required
        />
      </div>
      <div>
        <label className="label">What must be done</label>
        <textarea
          className="input min-h-[88px] py-2"
          value={form.actionDescription}
          onChange={(e) => setForm({ ...form, actionDescription: e.target.value })}
          required
        />
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <label className="label">Rationale</label>
          <input className="input" value={form.rationale} onChange={(e) => setForm({ ...form, rationale: e.target.value })} />
        </div>
        <div>
          <label className="label">Expected impact</label>
          <input
            className="input"
            value={form.expectedImpact}
            onChange={(e) => setForm({ ...form, expectedImpact: e.target.value })}
          />
        </div>
        <div>
          <label className="label">Owner</label>
          <select className="input" value={assignedToId} onChange={(e) => setAssignedToId(e.target.value)}>
            <option value="">Unassigned</option>
            {(users ?? []).map((u) => (
              <option key={u.id} value={u.id}>
                {u.name}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="label">Due date</label>
          <input
            type="date"
            className="input"
            value={form.dueDate}
            onChange={(e) => setForm({ ...form, dueDate: e.target.value })}
          />
        </div>
      </div>

      {create.error ? <ErrorNote error={create.error} /> : null}

      <button className="btn-primary w-full" disabled={create.isPending}>
        {create.isPending ? 'Saving…' : 'Issue recommendation'}
      </button>
    </form>
  );
}
