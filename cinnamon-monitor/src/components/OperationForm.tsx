'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { ErrorNote } from '@/components/ui';
import { post } from '@/lib/client';
import { OPERATION_TYPES } from '@/lib/domain';
import { titleCase } from '@/lib/format';

const today = () => new Date().toISOString().slice(0, 10);

export function OperationForm({ divisionId, onDone }: { divisionId: string; onDone?: () => void }) {
  const queryClient = useQueryClient();
  const [form, setForm] = useState({
    date: today(),
    operationType: 'WEEDING',
    inputProduct: '',
    rate: '',
    costLkr: '',
    laborHours: '',
    weatherNotes: '',
  });

  const create = useMutation({
    mutationFn: () => post(`/api/divisions/${divisionId}/operations`, form),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['operations', divisionId] });
      queryClient.invalidateQueries({ queryKey: ['division-metrics', divisionId] });
      setForm({ ...form, inputProduct: '', rate: '', costLkr: '', laborHours: '', weatherNotes: '' });
      onDone?.();
    },
  });

  return (
    <form
      className="space-y-3"
      onSubmit={(e) => {
        e.preventDefault();
        create.mutate();
      }}
    >
      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <label className="label">Date</label>
          <input
            type="date"
            className="input"
            value={form.date}
            max={today()}
            onChange={(e) => setForm({ ...form, date: e.target.value })}
            required
          />
        </div>
        <div>
          <label className="label">Operation</label>
          <select
            className="input"
            value={form.operationType}
            onChange={(e) => setForm({ ...form, operationType: e.target.value })}
          >
            {OPERATION_TYPES.map((t) => (
              <option key={t} value={t}>
                {titleCase(t)}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="label">Input / product</label>
          <input
            className="input"
            placeholder="e.g. Urea + MOP"
            value={form.inputProduct}
            onChange={(e) => setForm({ ...form, inputProduct: e.target.value })}
          />
        </div>
        <div>
          <label className="label">Rate</label>
          <input
            className="input"
            placeholder="e.g. 250 kg/ha"
            value={form.rate}
            onChange={(e) => setForm({ ...form, rate: e.target.value })}
          />
        </div>
        <div>
          <label className="label">Cost (LKR)</label>
          <input
            type="number"
            inputMode="decimal"
            min="0"
            className="input"
            value={form.costLkr}
            onChange={(e) => setForm({ ...form, costLkr: e.target.value })}
          />
        </div>
        <div>
          <label className="label">Labour hours</label>
          <input
            type="number"
            inputMode="decimal"
            min="0"
            step="0.5"
            className="input"
            value={form.laborHours}
            onChange={(e) => setForm({ ...form, laborHours: e.target.value })}
          />
        </div>
      </div>

      <div>
        <label className="label">Weather notes</label>
        <input
          className="input"
          placeholder="e.g. Light showers in the afternoon"
          value={form.weatherNotes}
          onChange={(e) => setForm({ ...form, weatherNotes: e.target.value })}
        />
      </div>

      {create.error ? <ErrorNote error={create.error} /> : null}

      <button className="btn-primary w-full" disabled={create.isPending}>
        {create.isPending ? 'Saving…' : 'Save operation'}
      </button>
    </form>
  );
}
