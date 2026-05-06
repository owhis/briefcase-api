/**
 * Configuration helpers for request deduplication.
 */

export interface DedupOptions {
  /** Custom key prefix to namespace dedup entries (e.g. per-user or per-session). */
  namespace?: string;
  /** Whether deduplication is enabled. Defaults to true. */
  enabled?: boolean;
}

const DEFAULT_DEDUP_OPTIONS: Required<DedupOptions> = {
  namespace: "default",
  enabled: true,
};

/**
 * Merges caller-supplied options with defaults.
 */
export function buildDedupOptions(opts?: DedupOptions): Required<DedupOptions> {
  return { ...DEFAULT_DEDUP_OPTIONS, ...opts };
}

/**
 * Builds a canonical dedup key from a namespace, URL, and optional
 * query-parameter map so that identical requests share the same slot.
 */
export function buildDedupKey(
  url: string,
  params?: Record<string, string | number>,
  options?: DedupOptions
): string {
  const { namespace } = buildDedupOptions(options);
  const base = url.split("?")[0];
  const sortedParams = params
    ? Object.entries(params)
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([k, v]) => `${k}=${v}`)
        .join("&")
    : "";
  return `${namespace}::${base}${sortedParams ? `?${sortedParams}` : ""}`;
}

/**
 * Validates dedup options and throws on invalid configuration.
 */
export function validateDedupOptions(opts: DedupOptions): void {
  if (opts.namespace !== undefined && opts.namespace.trim() === "") {
    throw new Error("DedupOptions.namespace must be a non-empty string.");
  }
}
