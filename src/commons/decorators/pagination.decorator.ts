import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { pagination } from '../utils/pagination';
import { PaginationResult } from '../types/pagination.type';

export const Pagination = createParamDecorator(
  (data: unknown, ctx: ExecutionContext): PaginationResult => {
    const request = ctx.switchToHttp().getRequest();
    const query = request.query;

    const page = query?.page;
    const perPage = query?.per_page;

    return pagination(page, perPage);
  },
);
