/**
 * cursor.ts — Cursor-based pagination tracker for stateful API traversal.
 */

export interface CursorState<TCursor = string> {
  current: TCursor | null;
  previous: TCursor[];
  hasMore: boolean;
  pagesFetched: number;
}

export interface CursorOptions<TCursor = string> {
  initialCursor?: TCursor | null;
  extractNext: (response: unknown) => TCursor | null;
  extractHasMore?: (response: unknown, next: TCursor | null) => boolean;
  maxPages?: number;
}

export function createCursor<TCursor = string>(
  options: CursorOptions<TCursor>
): {
  getState: () => CursorState<TCursor>;
  advance: (response: unknown) => boolean;
  reset: () => void;
  isDone: () => boolean;
} {
  let state: CursorState<TCursor> = {
    current: options.initialCursor ?? null,
    previous: [],
    hasMore: true,
    pagesFetched: 0,
  };

  function getState(): CursorState<TCursor> {
    return { ...state, previous: [...state.previous] };
  }

  function advance(response: unknown): boolean {
    const next = options.extractNext(response);
    const hasMore =
      options.extractHasMore
        ? options.extractHasMore(response, next)
        : next !== null && next !== undefined;

    if (state.current !== null) {
      state.previous = [...state.previous, state.current];
    }

    state.current = next;
    state.hasMore = hasMore;
    state.pagesFetched += 1;

    if (options.maxPages !== undefined && state.pagesFetched >= options.maxPages) {
      state.hasMore = false;
    }

    return state.hasMore;
  }

  function reset(): void {
    state = {
      current: options.initialCursor ?? null,
      previous: [],
      hasMore: true,
      pagesFetched: 0,
    };
  }

  function isDone(): boolean {
    return !state.hasMore;
  }

  return { getState, advance, reset, isDone };
}
