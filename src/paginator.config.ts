import { PaginationOptions } from './paginator';

export interface PaginatorPreset {
  name: string;
  options: PaginationOptions;
}

export const PAGINATION_PRESETS: Record<string, PaginatorPreset> = {
  default: {
    name: 'default',
    options: {
      pageParam: 'page',
      pageSizeParam: 'pageSize',
      defaultPageSize: 20,
      startPage: 1,
    },
  },
  zeroBased: {
    name: 'zeroBased',
    options: {
      pageParam: 'page',
      pageSizeParam: 'limit',
      defaultPageSize: 25,
      startPage: 0,
    },
  },
  cursor: {
    name: 'cursor',
    options: {
      pageParam: 'cursor',
      pageSizeParam: 'count',
      defaultPageSize: 50,
      startPage: 1,
    },
  },
};

export function buildQueryParams(
  page: number,
  pageSize: number,
  options: PaginationOptions = {}
): Record<string, string | number> {
  const merged = {
    pageParam: 'page',
    pageSizeParam: 'pageSize',
    ...options,
  };

  return {
    [merged.pageParam]: page,
    [merged.pageSizeParam]: pageSize,
  };
}

export function getPreset(name: string): PaginatorPreset {
  const preset = PAGINATION_PRESETS[name];
  if (!preset) {
    throw new Error(`Unknown pagination preset: "${name}". Available: ${Object.keys(PAGINATION_PRESETS).join(', ')}`);
  }
  return preset;
}
