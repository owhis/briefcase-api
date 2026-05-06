/**
 * normalize.ts
 * Utilities for normalizing API response shapes into consistent structures.
 */

export interface NormalizeOptions<TRaw, TNorm> {
  transform: (raw: TRaw) => TNorm;
  fallback?: TNorm | null;
  strict?: boolean;
}

export interface NormalizeResult<TNorm> {
  data: TNorm | null;
  ok: boolean;
  error?: string;
}

/**
 * Normalize a single raw API response item.
 */
export function normalizeItem<TRaw, TNorm>(
  raw: TRaw,
  options: NormalizeOptions<TRaw, TNorm>
): NormalizeResult<TNorm> {
  const { transform, fallback = null, strict = false } = options;

  if (raw === null || raw === undefined) {
    if (strict) {
      return { data: null, ok: false, error: "Received null or undefined input" };
    }
    return { data: fallback as TNorm | null, ok: false, error: "Missing input" };
  }

  try {
    const data = transform(raw);
    return { data, ok: true };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    if (strict) throw err;
    return { data: fallback as TNorm | null, ok: false, error: message };
  }
}

/**
 * Normalize an array of raw API response items, skipping failed entries.
 */
export function normalizeList<TRaw, TNorm>(
  items: TRaw[],
  options: NormalizeOptions<TRaw, TNorm>
): { results: TNorm[]; errors: string[]; total: number; failed: number } {
  const results: TNorm[] = [];
  const errors: string[] = [];

  for (const item of items) {
    const result = normalizeItem(item, { ...options, strict: false });
    if (result.ok && result.data !== null) {
      results.push(result.data);
    } else {
      errors.push(result.error ?? "Unknown error");
    }
  }

  return {
    results,
    errors,
    total: items.length,
    failed: errors.length,
  };
}

/**
 * Create a reusable normalizer bound to a specific transform.
 */
export function createNormalizer<TRaw, TNorm>(
  transform: (raw: TRaw) => TNorm,
  defaults?: Partial<Omit<NormalizeOptions<TRaw, TNorm>, "transform">>
) {
  return {
    one: (raw: TRaw) => normalizeItem(raw, { transform, ...defaults }),
    many: (items: TRaw[]) => normalizeList(items, { transform, ...defaults }),
  };
}
