/**
 * scatter.ts — Fan-out requests across multiple endpoints and collect results.
 */

export interface ScatterOptions<T> {
  targets: string[];
  fetch: (url: string) => Promise<T>;
  concurrency?: number;
  timeout?: number;
  continueOnError?: boolean;
}

export interface ScatterResult<T> {
  url: string;
  value?: T;
  error?: Error;
  durationMs: number;
}

export interface ScatterState<T> {
  results: ScatterResult<T>[];
  succeeded: number;
  failed: number;
  totalMs: number;
}

export function createScatter<T>(options: ScatterOptions<T>) {
  const { targets, fetch, concurrency = targets.length, timeout = 0, continueOnError = true } = options;

  async function run(): Promise<ScatterState<T>> {
    const start = Date.now();
    const results: ScatterResult<T>[] = [];
    const queue = [...targets];
    let active = 0;

    await new Promise<void>((resolve, reject) => {
      function next() {
        if (queue.length === 0 && active === 0) {
          resolve();
          return;
        }
        while (active < concurrency && queue.length > 0) {
          const url = queue.shift()!;
          active++;
          const taskStart = Date.now();

          let fetchPromise = fetch(url);
          if (timeout > 0) {
            const timer = new Promise<never>((_, r) =>
              setTimeout(() => r(new Error(`Timeout after ${timeout}ms`)), timeout)
            );
            fetchPromise = Promise.race([fetchPromise, timer]);
          }

          fetchPromise.then(
            (value) => {
              results.push({ url, value, durationMs: Date.now() - taskStart });
              active--;
              next();
            },
            (err) => {
              results.push({ url, error: err instanceof Error ? err : new Error(String(err)), durationMs: Date.now() - taskStart });
              active--;
              if (!continueOnError) { reject(err); return; }
              next();
            }
          );
        }
      }
      next();
    });

    return {
      results,
      succeeded: results.filter((r) => r.error == null).length,
      failed: results.filter((r) => r.error != null).length,
      totalMs: Date.now() - start,
    };
  }

  return { run };
}
