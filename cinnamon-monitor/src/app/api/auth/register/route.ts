import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser, hashPassword, setSessionCookie, signSession } from '@/lib/auth';
import { assert, handler, ok } from '@/lib/http';
import { ROLES, type Role } from '@/lib/domain';

export const runtime = 'nodejs';

/**
 * Bootstrap endpoint. Open only while the database has no users (first admin);
 * afterwards it requires an authenticated TOP_MANAGEMENT session.
 */
export const POST = handler(async (req: NextRequest) => {
  const body = (await req.json()) as {
    name?: string;
    email?: string;
    password?: string;
    role?: Role;
  };
  assert(body.name && body.email && body.password, 400, 'Name, email and password are required');
  assert(body.password.length >= 8, 400, 'Password must be at least 8 characters');

  const userCount = await prisma.user.count();
  const isBootstrap = userCount === 0;
  if (!isBootstrap) {
    const current = await getCurrentUser();
    assert(current?.role === 'TOP_MANAGEMENT', 403, 'Only Top Management can create users');
  }

  const role: Role = isBootstrap ? 'TOP_MANAGEMENT' : (body.role ?? 'FIELD_OFFICER');
  assert(ROLES.includes(role), 400, 'Unknown role');

  const email = body.email.toLowerCase().trim();
  assert(!(await prisma.user.findUnique({ where: { email } })), 409, 'Email already registered');

  const user = await prisma.user.create({
    data: { name: body.name, email, role, passwordHash: hashPassword(body.password) },
  });

  if (isBootstrap) setSessionCookie(signSession(user.id));
  return ok({ id: user.id, name: user.name, email: user.email, role: user.role }, { status: 201 });
});
