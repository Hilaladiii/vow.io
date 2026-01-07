import { Prisma } from 'generated/prisma/client';

export function whereClauseContains(
  field: string,
  value: string | undefined | null,
) {
  return value
    ? {
        [field]: {
          contains: value,
          mode: 'insensitive',
        },
      }
    : {};
}

export function generateOrderBy(sortBy: string, sortOrder: 'asc' | 'desc') {
  return {
    [sortBy]: sortOrder,
  };
}

export function searchContains(value: string | undefined) {
  return value
    ? { contains: value, mode: 'insensitive' as Prisma.QueryMode }
    : undefined;
}
