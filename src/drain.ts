/**
 * drain.ts — Utility for draining a paginated async source into a collected result.
 */

export interface DrainOptions<T> {
  maxPages?: number;
  maxItems?: number;
  signal?: AbortSignal;
  onPage?: (items: T[], page: number) => void;
}

export interface DrainResult<T> {
  items: T[];
  pages: number;
  aborted: boolean;
}

export type PageFetcher<T> = (cursor: string | null) => Promise<{
  items: T[];
  nextCursor: string | null;
}>;

export async function drain<T>(
  fetcher: PageFetcher<T>,
  options: DrainOptions<T> = {}
): Promise<DrainResult<T>> {
  const { maxPages = Infinity, maxItems = Infinity, signal, onPage } = options;

  const collected: T[] = [];
  let cursor: string | null = null;
  let page = 0;
  let aborted = false;

  while (page < maxPages) {
    if (signal?.aborted) {
      aborted = true;
      break;
    }

    const { items, nextCursor } = await fetcher(cursor);

    const remaining = maxItems - collected.length;
    const slice = items.slice(0, remaining);
    collected.push(...slice);
    page++;

    onPage?.(slice, page);

    if (!nextCursor || collected.length >= maxItems) {
      break;
    }

    cursor = nextCursor;
  }

  return { items: collected, pages: page, aborted };
}

export function createDrain<T>(fetcher: PageFetcher<T>) {
  return (options?: DrainOptions<T>) => drain(fetcher, options);
}
