import { APP_CONSTANTS } from '../constants/app.constants.js';

export interface PaginationResult {
  page: number;
  limit: number;
  skip: number;
}

export function getPagination(
  page?: number,
  limit?: number,
): PaginationResult {
  const safePage = Math.max(
    1,
    page ?? APP_CONSTANTS.DEFAULT_PAGE,
  );

  const safeLimit = Math.min(
    APP_CONSTANTS.MAX_PAGE_LIMIT,
    Math.max(
      1,
      limit ?? APP_CONSTANTS.DEFAULT_LIMIT,
    ),
  );

  return {
    page: safePage,
    limit: safeLimit,
    skip: (safePage - 1) * safeLimit,
  };
}