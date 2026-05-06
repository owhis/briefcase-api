/**
 * Rate limiter — tracks request counts within a sliding window
 * and enforces a maximum number of requests per interval.
 */

export interface RateLimitState {
  timestamps: number[];
  windowMs: number;
  maxRequests: number;
}

export interface RateLimitOptions {
  windowMs: number;
  maxRequests: number;
}

export function createRateLimit(options: RateLimitOptions): RateLimitState {
  return {
    timestamps: [],
    windowMs: options.windowMs,
    maxRequests: options.maxRequests,
  };
}

export function pruneWindow(state: RateLimitState, now: number): void {
  const cutoff = now - state.windowMs;
  state.timestamps = state.timestamps.filter((t) => t > cutoff);
}

export function isAllowed(state: RateLimitState, now: number = Date.now()): boolean {
  pruneWindow(state, now);
  return state.timestamps.length < state.maxRequests;
}

export function record(state: RateLimitState, now: number = Date.now()): void {
  pruneWindow(state, now);
  state.timestamps.push(now);
}

export function retryAfterMs(state: RateLimitState, now: number = Date.now()): number {
  pruneWindow(state, now);
  if (state.timestamps.length < state.maxRequests) return 0;
  const oldest = state.timestamps[0];
  return Math.max(0, oldest + state.windowMs - now);
}

export function getCount(state: RateLimitState, now: number = Date.now()): number {
  pruneWindow(state, now);
  return state.timestamps.length;
}

export function resetRateLimit(state: RateLimitState): void {
  state.timestamps = [];
}
