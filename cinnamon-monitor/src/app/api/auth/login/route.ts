import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { setSessionCookie, signSession, verifyPassword } from '@/lib/auth';
import { assert, handler, ok } from '@/lib/http';

export const runtime = 'nodejs';

export const POST = handler(async (req: NextRequest) => {
  const { email, password } = (await req.json()) as { email?: string; password?: string };
  assert(email && password, 400, 'Email and password are required');

  const user = await prisma.user.findUnique({ where: { email: email.toLowerCase().trim() } });
  assert(user && user.active, 401, 'Invalid email or password');
  assert(verifyPassword(password, user.passwordHash), 401, 'Invalid email or password');

  setSessionCookie(signSession(user.id));
  return ok({ id: user.id, name: user.name, email: user.email, role: user.role });
});
