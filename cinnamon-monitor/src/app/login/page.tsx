'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { Suspense, useState } from 'react';
import { post } from '@/lib/client';
import { useAuth } from '@/app/providers';

const DEMO_ACCOUNTS = [
  { label: 'Top Management', email: 'admin@lalanrubbers.lk' },
  { label: 'Group GM (Mahaoya)', email: 'gm.mahaoya@lalanrubbers.lk' },
  { label: 'Estate Manager (Galagama)', email: 'em.galagama@lalanrubbers.lk' },
  { label: 'Division Manager', email: 'dm.notinghill@lalanrubbers.lk' },
  { label: 'Field Officer', email: 'fo.deaela@lalanrubbers.lk' },
];

function LoginForm() {
  const router = useRouter();
  const params = useSearchParams();
  const { refresh } = useAuth();
  const [email, setEmail] = useState('admin@lalanrubbers.lk');
  const [password, setPassword] = useState('Cinnamon@123');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      await post('/api/auth/login', { email, password });
      refresh();
      router.replace(params.get('next') || '/dashboard');
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Sign in failed');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="min-h-dvh bg-forest-600 px-4 py-10">
      <div className="mx-auto w-full max-w-sm">
        <div className="mb-6 text-center text-white">
          <div className="mx-auto mb-3 grid h-14 w-14 place-items-center rounded-2xl bg-cinnamon-300 text-2xl font-black text-forest-700">
            C
          </div>
          <h1 className="text-xl font-bold">Cinnamon Plantation Monitor</h1>
          <p className="mt-1 text-sm text-forest-100">Lalan Rubbers Pvt Ltd — Agri Division</p>
        </div>

        <form onSubmit={submit} className="card card-pad space-y-4">
          <div>
            <label className="label" htmlFor="email">
              Email
            </label>
            <input
              id="email"
              type="email"
              className="input"
              value={email}
              autoComplete="username"
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <div>
            <label className="label" htmlFor="password">
              Password
            </label>
            <input
              id="password"
              type="password"
              className="input"
              value={password}
              autoComplete="current-password"
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          {error ? (
            <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>
          ) : null}

          <button type="submit" className="btn-primary w-full" disabled={busy}>
            {busy ? 'Signing in…' : 'Sign in'}
          </button>
        </form>

        <div className="mt-5 rounded-xl bg-forest-700/60 p-4 text-forest-50">
          <p className="text-xs font-bold uppercase tracking-wide">Demo accounts</p>
          <p className="mt-1 text-[11px] text-forest-100">Password for all: Cinnamon@123</p>
          <div className="mt-3 grid gap-1.5">
            {DEMO_ACCOUNTS.map((a) => (
              <button
                key={a.email}
                type="button"
                onClick={() => setEmail(a.email)}
                className="flex items-center justify-between rounded-lg bg-forest-600 px-3 py-2 text-left text-xs"
              >
                <span className="font-semibold">{a.label}</span>
                <span className="text-forest-100">{a.email.split('@')[0]}</span>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  );
}
