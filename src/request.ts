import { RetryConfig, defaultRetryConfig } from './retry.config';
import { defaultShouldRetry, computeDelay } from './retry';
import { Cache } from './cache';

export interface RequestOptions {
  url: string;
  params?: Record<string, string | number | boolean>;
  headers?: Record<string, string>;
  retry?: Partial<RetryConfig>;
  cacheKey?: string;
  cacheTtl?: number;
}

export interface RequestResult<T> {
  data: T;
  status: number;
  fromCache: boolean;
}

const globalCache = new Cache();

export async function makeRequest<T>(
  options: RequestOptions,
  cache: Cache = globalCache
): Promise<RequestResult<T>> {
  const { url, params = {}, headers = {}, cacheKey, cacheTtl } = options;
  const retryConfig: RetryConfig = { ...defaultRetryConfig, ...options.retry };

  if (cacheKey) {
    const cached = cache.get<T>(cacheKey);
    if (cached !== undefined) {
      return { data: cached, status: 200, fromCache: true };
    }
  }

  const queryString = Object.entries(params)
    .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(String(v))}`)
    .join('&');
  const fullUrl = queryString ? `${url}?${queryString}` : url;

  let attempt = 0;
  let lastError: unknown;

  while (attempt <= retryConfig.maxRetries) {
    try {
      const response = await fetch(fullUrl, { headers });

      if (!response.ok) {
        throw Object.assign(new Error(`HTTP ${response.status}`), {
          status: response.status,
        });
      }

      const data: T = await response.json();

      if (cacheKey) {
        cache.set(cacheKey, data, cacheTtl);
      }

      return { data, status: response.status, fromCache: false };
    } catch (err) {
      lastError = err;
      if (!defaultShouldRetry(err, attempt, retryConfig)) break;
      const delay = computeDelay(attempt, retryConfig);
      await new Promise((resolve) => setTimeout(resolve, delay));
      attempt++;
    }
  }

  throw lastError;
}
