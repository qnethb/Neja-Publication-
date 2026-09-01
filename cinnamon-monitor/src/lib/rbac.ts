import { prisma } from './prisma';
import type { SessionUser } from './auth';
import type { Role } from './domain';

// Role capability matrix. Read scope is resolved separately because it depends
// on the Group -> Estate -> Division tree, not only on the role.
const CAN_CREATE_RECOMMENDATION: Role[] = ['GROUP_GM', 'TOP_MANAGEMENT'];
const CAN_LOG_OPERATION: Role[] = [
  'FIELD_OFFICER',
  'DIVISION_MANAGER',
  'ESTATE_MANAGER',
  'GROUP_GM',
  'TOP_MANAGEMENT',
];
const CAN_UPDATE_RECOMMENDATION: Role[] = [
  'DIVISION_MANAGER',
  'ESTATE_MANAGER',
  'GROUP_GM',
  'TOP_MANAGEMENT',
];

export function isGlobal(user: SessionUser): boolean {
  return user.role === 'TOP_MANAGEMENT';
}

/**
 * Field officers and division managers see only the divisions assigned to them
 * — never the rest of the estate those divisions belong to.
 */
export function isDivisionScoped(user: SessionUser): boolean {
  return user.role === 'FIELD_OFFICER' || user.role === 'DIVISION_MANAGER';
}

export function canCreateRecommendation(user: SessionUser): boolean {
  return CAN_CREATE_RECOMMENDATION.includes(user.role);
}

export function canLogOperation(user: SessionUser): boolean {
  return CAN_LOG_OPERATION.includes(user.role);
}

export function canUpdateRecommendation(user: SessionUser): boolean {
  return CAN_UPDATE_RECOMMENDATION.includes(user.role);
}

/** Estate ids the user may read. `null` means "every estate". */
export async function accessibleEstateIds(user: SessionUser): Promise<string[] | null> {
  if (isGlobal(user)) return null;
  // A division assignment grants access to that division, not to its estate.
  if (isDivisionScoped(user)) return [];

  const ids = new Set(user.estateIds);

  if (user.groupIds.length > 0) {
    const estates = await prisma.estate.findMany({
      where: { groupId: { in: user.groupIds } },
      select: { id: true },
    });
    estates.forEach((e) => ids.add(e.id));
  }

  return Array.from(ids);
}

/** Division ids the user may read. `null` means "every division". */
export async function accessibleDivisionIds(user: SessionUser): Promise<string[] | null> {
  if (isGlobal(user)) return null;
  if (isDivisionScoped(user)) return [...user.divisionIds];

  const estateIds = await accessibleEstateIds(user);
  if (estateIds === null) return null;
  if (estateIds.length === 0) return [];

  const divisions = await prisma.division.findMany({
    where: { estateId: { in: estateIds } },
    select: { id: true },
  });
  return divisions.map((d) => d.id);
}

export async function canViewEstate(user: SessionUser, estateId: string): Promise<boolean> {
  const ids = await accessibleEstateIds(user);
  return ids === null || ids.includes(estateId);
}

export async function canViewDivision(user: SessionUser, divisionId: string): Promise<boolean> {
  if (isGlobal(user)) return true;
  if (user.divisionIds.includes(divisionId)) return true;
  if (isDivisionScoped(user)) return false;

  const division = await prisma.division.findUnique({
    where: { id: divisionId },
    select: { estateId: true },
  });
  if (!division) return false;
  return canViewEstate(user, division.estateId);
}

/**
 * Division-level write access. Field officers and division managers only reach
 * divisions explicitly assigned to them; higher roles inherit estate/group scope.
 */
export async function canWriteDivision(user: SessionUser, divisionId: string): Promise<boolean> {
  if (!canLogOperation(user)) return false;
  if (isDivisionScoped(user)) return user.divisionIds.includes(divisionId);
  return canViewDivision(user, divisionId);
}

/** Group ids the user may read. `null` means "every group". */
export async function accessibleGroupIds(user: SessionUser): Promise<string[] | null> {
  if (isGlobal(user)) return null;
  const ids = new Set(isDivisionScoped(user) ? [] : user.groupIds);
  const estateIds = await accessibleEstateIds(user);
  if (estateIds && estateIds.length > 0) {
    const estates = await prisma.estate.findMany({
      where: { id: { in: estateIds } },
      select: { groupId: true },
    });
    estates.forEach((e) => ids.add(e.groupId));
  }
  return Array.from(ids);
}
