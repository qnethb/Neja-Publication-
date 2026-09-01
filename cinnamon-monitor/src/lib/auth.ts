import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { cookies } from 'next/headers';
import { prisma } from './prisma';
import type { Role } from './domain';

export const SESSION_COOKIE = 'cpm_session';

const SESSION_DAYS = Number(process.env.SESSION_DAYS ?? 7);

function secret(): string {
  const value = process.env.JWT_SECRET;
  if (!value) throw new Error('JWT_SECRET is not set. Copy .env.example to .env.');
  return value;
}

export function hashPassword(plain: string): string {
  return bcrypt.hashSync(plain, 10);
}

export function verifyPassword(plain: string, hash: string): boolean {
  return bcrypt.compareSync(plain, hash);
}

export function signSession(userId: string): string {
  return jwt.sign({ sub: userId }, secret(), { expiresIn: `${SESSION_DAYS}d` });
}

export function setSessionCookie(token: string) {
  cookies().set(SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: SESSION_DAYS * 24 * 60 * 60,
  });
}

export function clearSessionCookie() {
  cookies().set(SESSION_COOKIE, '', { httpOnly: true, path: '/', maxAge: 0 });
}

export type SessionUser = {
  id: string;
  name: string;
  email: string;
  role: Role;
  groupIds: string[];
  estateIds: string[];
  divisionIds: string[];
};

export async function getCurrentUser(): Promise<SessionUser | null> {
  const token = cookies().get(SESSION_COOKIE)?.value;
  if (!token) return null;

  let userId: string;
  try {
    const payload = jwt.verify(token, secret()) as { sub?: string };
    if (!payload.sub) return null;
    userId = payload.sub;
  } catch {
    return null;
  }

  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: {
      groups: { select: { id: true } },
      estates: { select: { id: true } },
      divisions: { select: { id: true } },
      gmOfGroups: { select: { id: true } },
      managerOfEstates: { select: { id: true } },
      assistantOfEstates: { select: { id: true } },
    },
  });
  if (!user || !user.active) return null;

  const groupIds = unique([...user.groups, ...user.gmOfGroups].map((g) => g.id));
  const estateIds = unique(
    [...user.estates, ...user.managerOfEstates, ...user.assistantOfEstates].map((e) => e.id),
  );

  return {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role as Role,
    groupIds,
    estateIds,
    divisionIds: user.divisions.map((d) => d.id),
  };
}

function unique(values: string[]): string[] {
  return Array.from(new Set(values));
}
