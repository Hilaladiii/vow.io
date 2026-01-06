import { PaginationResult } from '../types/pagination.type';
import { Prisma } from 'generated/prisma/client';

export function pagination(page: string, per_page: string) {
  const currentPage = parseInt(page, 10) || 1;
  const itemsPerPage = parseInt(per_page, 10) || 10;
  const skip = (currentPage - 1) * itemsPerPage;

  return { currentPage, itemsPerPage, skip };
}

export async function responsePaginate(
  countFn: Prisma.PrismaPromise<number>,
  itemsFn: Prisma.PrismaPromise<any>,
  pagination: PaginationResult,
) {
  const [total, items] = await Promise.all([countFn, itemsFn]);

  const totalPage = Math.ceil(total / pagination.itemsPerPage);

  return {
    items,
    meta: {
      page: pagination.currentPage,
      per_page: pagination.itemsPerPage,
      total,
      total_page: totalPage,
    },
  };
}
