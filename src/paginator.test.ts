import { Paginator, PageResult } from './paginator';
import { buildQueryParams, getPreset } from './paginator.config';

function makeFetchPage<T>(pages: T[][]): (page: number, pageSize: number) => Promise<PageResult<T>> {
  return async (page: number, pageSize: number): Promise<PageResult<T>> => {
    const index = page - 1;
    const data = pages[index] ?? [];
    return {
      data,
      page,
      pageSize,
      hasNextPage: index < pages.length - 1,
      totalPages: pages.length,
      totalItems: pages.flat().length,
    };
  };
}

describe('Paginator', () => {
  const mockPages = [['a', 'b'], ['c', 'd'], ['e']];

  it('fetches the current page', async () => {
    const paginator = new Paginator({ fetchPage: makeFetchPage(mockPages) });
    const result = await paginator.fetchCurrent();
    expect(result.data).toEqual(['a', 'b']);
    expect(result.page).toBe(1);
    expect(result.hasNextPage).toBe(true);
  });

  it('fetches the next page and advances cursor', async () => {
    const paginator = new Paginator({ fetchPage: makeFetchPage(mockPages) });
    const result = await paginator.fetchNext();
    expect(result?.data).toEqual(['c', 'd']);
    expect(paginator.getCurrentPage()).toBe(2);
  });

  it('returns null when no next page exists', async () => {
    const paginator = new Paginator({ fetchPage: makeFetchPage([['only']]) });
    const result = await paginator.fetchNext();
    expect(result).toBeNull();
  });

  it('iterates over all pages with async iterator', async () => {
    const paginator = new Paginator({ fetchPage: makeFetchPage(mockPages) });
    const collected: string[][] = [];
    for await (const page of paginator) {
      collected.push(page.data);
    }
    expect(collected).toEqual(mockPages);
  });

  it('fetches all items flattened', async () => {
    const paginator = new Paginator({ fetchPage: makeFetchPage(mockPages) });
    const all = await paginator.fetchAll();
    expect(all).toEqual(['a', 'b', 'c', 'd', 'e']);
  });

  it('resets the current page', async () => {
    const paginator = new Paginator({ fetchPage: makeFetchPage(mockPages) });
    await paginator.fetchNext();
    paginator.reset();
    expect(paginator.getCurrentPage()).toBe(1);
  });

  it('respects a custom startPage option', async () => {
    const paginator = new Paginator({
      fetchPage: makeFetchPage(mockPages),
      startPage: 2,
    });
    const result = await paginator.fetchCurrent();
    expect(result.data).toEqual(['c', 'd']);
    expect(paginator.getCurrentPage()).toBe(2);
  });
});

describe('buildQueryParams', () => {
  it('builds default query params', () => {
    const params = buildQueryParams(2, 10);
    expect(params).toEqual({ page: 2, pageSize: 10 });
  });

  it('uses custom param names from options', () => {
    const params = buildQueryParams(0, 25, { pageParam: 'cursor', pageSizeParam: 'limit' });
    expect(params).toEqual({ cursor: 0, limit: 25 });
  });
});

describe('getPreset', () => {
  it('returns a known preset', () => {
    const preset = getPreset('zeroBased');
    expect(preset.options.startPage).toBe(0);
    expect(preset.options.pageSizeParam).toBe('limit');
  });

  it('throws for unknown preset', () => {
    expect(() => getPreset('unknown')).toThrow('Unknown pagination preset');
  });
});
