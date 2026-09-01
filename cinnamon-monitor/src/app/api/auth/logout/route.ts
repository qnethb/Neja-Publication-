import { clearSessionCookie } from '@/lib/auth';
import { handler, ok } from '@/lib/http';

export const runtime = 'nodejs';

export const POST = handler(async () => {
  clearSessionCookie();
  return ok({ ok: true });
});
