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

export function resolveUrl(baseUrl: string, path: string): string {
  if (!baseUrl) return path;
  return `${baseUrl.replace(/\/$/, '')}/${path.replace(/^\//, '')}`;
}
