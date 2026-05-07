export interface RequestDefaults {
  baseUrl: string;
  headers: Record<string, string>;
  timeoutMs: number;
  cacheTtl: number;
}

export const defaultRequestDefaults: RequestDefaults = {
  baseUrl: '',
  headers: {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  },
  timeoutMs: 10_000,
  cacheTtl: 60_000,
};

export function buildRequestDefaults(
  overrides: Partial<RequestDefaults> = {}
): RequestDefaults {
  return {
    ...defaultRequestDefaults,
    ...overrides,
    headers: {
      ...defaultRequestDefaults.headers,
      ...(overrides.headers ?? {}),
    },
  };
}

/**
 * Combines a base URL and a path segment into a single URL string.
 * Normalises slashes so there is exactly one separator between the two parts.
 *
 * @param baseUrl - The root URL (may be empty, in which case `path` is returned as-is).
 * @param path    - The path to append to `baseUrl`.
 * @returns The resolved URL string.
 *
 * @example
 * resolveUrl('https://api.example.com/', '/users') // 'https://api.example.com/users'
 * resolveUrl('', '/users')                         // '/users'
 */
export function resolveUrl(baseUrl: string, path: string): string {
  if (!baseUrl) return path;
  return `${baseUrl.replace(/\/$/, '')}/${path.replace(/^\//, '')}`;
}
