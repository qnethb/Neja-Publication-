'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useState, type ReactNode } from 'react';
import { useAuth } from '@/app/providers';
import { post } from '@/lib/client';
import { ROLE_LABELS } from '@/lib/domain';

export function AppShell({ children }: { children: ReactNode }) {
  const { me } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);

  const user = me?.user;

  async function logout() {
    await post('/api/auth/logout', {});
    router.replace('/login');
    router.refresh();
  }

  const links = [
    { href: '/dashboard', label: 'Dashboard' },
    ...(user?.role === 'TOP_MANAGEMENT' ? [{ href: '/admin', label: 'Admin' }] : []),
  ];

  return (
    <div className="min-h-dvh pb-10">
      <header className="sticky top-0 z-20 bg-forest-600 text-white shadow-md">
        <div className="mx-auto flex max-w-5xl items-center gap-3 px-4 py-3">
          <Link href="/dashboard" className="flex min-w-0 items-center gap-2">
            <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-cinnamon-300 text-base font-black text-forest-700">
              C
            </span>
            <span className="min-w-0">
              <span className="block truncate text-sm font-bold leading-tight">Cinnamon Monitor</span>
              <span className="block truncate text-[11px] leading-tight text-forest-100">
                Lalan Rubbers — Agri Division
              </span>
            </span>
          </Link>

          <button
            onClick={() => setMenuOpen((v) => !v)}
            aria-expanded={menuOpen}
            aria-label="Account menu"
            className="ml-auto grid h-10 w-10 place-items-center rounded-lg bg-forest-700 text-sm font-bold"
          >
            {initials(user?.name)}
          </button>
        </div>

        {menuOpen ? (
          <div className="border-t border-forest-700 bg-forest-700">
            <div className="mx-auto max-w-5xl px-4 py-3 text-sm">
              <p className="font-semibold">{user?.name}</p>
              <p className="text-[12px] text-forest-100">
                {user ? ROLE_LABELS[user.role] : ''} · {user?.email}
              </p>
              <nav className="mt-3 flex flex-wrap gap-2">
                {links.map((link) => (
                  <Link
                    key={link.href}
                    href={link.href}
                    onClick={() => setMenuOpen(false)}
                    className={`rounded-lg px-3 py-2 text-sm font-semibold ${
                      pathname === link.href ? 'bg-white text-forest-700' : 'bg-forest-600 text-white'
                    }`}
                  >
                    {link.label}
                  </Link>
                ))}
                <button
                  onClick={logout}
                  className="rounded-lg bg-cinnamon-400 px-3 py-2 text-sm font-semibold text-white"
                >
                  Sign out
                </button>
              </nav>
            </div>
          </div>
        ) : null}
      </header>

      <main className="mx-auto max-w-5xl px-4 py-4">{children}</main>
    </div>
  );
}

function initials(name?: string): string {
  if (!name) return '··';
  return name
    .split(' ')
    .slice(0, 2)
    .map((p) => p[0])
    .join('')
    .toUpperCase();
}
