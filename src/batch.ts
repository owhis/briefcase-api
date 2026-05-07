/**
 * batch.ts — Utility for grouping multiple API requests into batched chunks
 * and executing them with concurrency control.
 */

export interface BatchOptions {
  chunkSize: number;
  concurrency: number;
  delayBetweenChunks?: number;
  onChunkComplete?: (chunkIndex: number, total: number) => void;
}

export interface BatchResult<T> {
  results: T[];
  errors: Array<{ index: number; error: unknown }>;
  totalRequested: number;
  totalSucceeded: number;
}

async function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function runWithConcurrency<T>(
  tasks: Array<() => Promise<T>>,
  concurrency: number
): Promise<Array<{ value?: T; error?: unknown; index: number }>> {
  const results: Array<{ value?: T; error?: unknown; index: number }> = [];
  let currentIndex = 0;

  async function worker() {
    while (currentIndex < tasks.length) {
      const taskIndex = currentIndex++;
      try {
        const value = await tasks[taskIndex]();
        results.push({ value, index: taskIndex });
      } catch (error) {
        results.push({ error, index: taskIndex });
      }
    }
  }

  const workers = Array.from({ length: Math.min(concurrency, tasks.length) }, worker);
  await Promise.all(workers);
  return results;
}

export async function runBatch<T>(
  items: Array<() => Promise<T>>,
  options: BatchOptions
): Promise<BatchResult<T>> {
  const { chunkSize, concurrency, delayBetweenChunks = 0, onChunkComplete } = options;
  const allResults: T[] = [];
  const allErrors: Array<{ index: number; error: unknown }> = [];

  const chunks: Array<Array<{ task: () => Promise<T>; originalIndex: number }>> = [];
  for (let i = 0; i < items.length; i += chunkSize) {
    chunks.push(
      items.slice(i, i + chunkSize).map((task, j) => ({ task, originalIndex: i + j }))
    );
  }

  for (let ci = 0; ci < chunks.length; ci++) {
    const chunk = chunks[ci];
    const tasks = chunk.map(({ task }) => task);
    const chunkResults = await runWithConcurrency(tasks, concurrency);

    for (const res of chunkResults) {
      const originalIndex = chunk[res.index].originalIndex;
      if (res.error !== undefined) {
        allErrors.push({ index: originalIndex, error: res.error });
      } else {
        allResults.push(res.value as T);
      }
    }

    onChunkComplete?.(ci, chunks.length);

    if (delayBetweenChunks > 0 && ci < chunks.length - 1) {
      await sleep(delayBetweenChunks);
    }
  }

  return {
    results: allResults,
    errors: allErrors,
    totalRequested: items.length,
    totalSucceeded: allResults.length,
  };
}
