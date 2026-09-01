import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { assert, requireUser, handler, ok } from '@/lib/http';
import { hashPassword } from '@/lib/auth';
import { ROLES, type Role } from '@/lib/domain';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export const GET = handler(async (req: NextRequest) => {
  const user = await requireUser();
  const estateId = req.nextUrl.searchParams.get('estateId');

  const users = await prisma.user.findMany({
    where: estateId
      ? {
          OR: [
            { estates: { some: { id: estateId } } },
            { managerOfEstates: { some: { id: estateId } } },
            { assistantOfEstates: { some: { id: estateId } } },
            { divisions: { some: { estateId } } },
          ],
        }
      : {},
    orderBy: { name: 'asc' },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      active: true,
      ...(user.role === 'TOP_MANAGEMENT'
        ? {
            groups: { select: { id: true, name: true } },
            estates: { select: { id: true, name: true } },
            divisions: { select: { id: true, name: true } },
          }
        : {}),
    },
  });

  return ok(users);
});

export const POST = handler(async (req: NextRequest) => {
  const user = await requireUser();
  assert(user.role === 'TOP_MANAGEMENT', 403, 'Only Top Management can create users');

  const body = await req.json();
  assert(body.name && body.email && body.password, 400, 'Name, email and password are required');
  assert(String(body.password).length >= 8, 400, 'Password must be at least 8 characters');
  const role: Role = body.role ?? 'FIELD_OFFICER';
  assert(ROLES.includes(role), 400, 'Unknown role');

  const email = String(body.email).toLowerCase().trim();
  assert(!(await prisma.user.findUnique({ where: { email } })), 409, 'Email already registered');

  const created = await prisma.user.create({
    data: {
      name: body.name,
      email,
      role,
      passwordHash: hashPassword(body.password),
      ...(body.estateIds?.length ? { estates: { connect: body.estateIds.map((id: string) => ({ id })) } } : {}),
      ...(body.groupIds?.length ? { groups: { connect: body.groupIds.map((id: string) => ({ id })) } } : {}),
      ...(body.divisionIds?.length
        ? { divisions: { connect: body.divisionIds.map((id: string) => ({ id })) } }
        : {}),
    },
    select: { id: true, name: true, email: true, role: true },
  });

  return ok(created, { status: 201 });
});
