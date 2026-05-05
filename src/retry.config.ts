import { RetryOptions } from './retry';

/**
 * Default retry configuration for standard REST API usage.
 * Retries on network errors and server-side (5xx) or rate-limit (429) responses.
 */
export const defaultRetryConfig: RetryOptions = {
  maxAttempts: 3,
  baseDelayMs: 300,
  maxDelayMs: 10000,
  shouldRetry(error: unknown, attempt: number): boolean {
    if (attempt >= (this.maxAttempts ?? 3)) return false;

    if (typeof error === 'object' && error !== null && 'status' in error) {
      const status = (error as { status: number }).status;
      return status === 429 || status >= 500;
    }

    // Retry on generic network-level errors (e.g. fetch failures)
    if (error instanceof TypeError) {
      return true;
    }

    return false;
  },
};

/**
 * Aggressive retry config for idempotent read operations.
 */
export const aggressiveRetryConfig: RetryOptions = {
  maxAttempts: 5,
  baseDelayMs: 100,
  maxDelayMs: 8000,
  shouldRetry(error: unknown, attempt: number): boolean {
    if (attempt >= (this.maxAttempts ?? 5)) return false;
    if (error instanceof TypeError) return true;
    if (typeof error === 'object' && error !== null && 'status' in error) {
      const status = (error as { status: number }).status;
      return status === 429 || status >= 500;
    }
    return false;
  },
};

/**
 * No-retry config — useful for non-idempotent or write operations.
 */
export const noRetryConfig: RetryOptions = {
  maxAttempts: 1,
  shouldRetry: () => false,
};
