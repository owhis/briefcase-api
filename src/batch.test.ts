import { describe, it, expect, vi } from "vitest";
import { runBatch, BatchOptions } from "./batch";

function makeTask<T>(value: T, delay = 0): () => Promise<T> {
  return () =>
    new Promise((resolve) => setTimeout(() => resolve(value), delay));
}

function makeFailingTask(error: string, delay = 0): () => Promise<never> {
  return () =>
    new Promise((_, reject) => setTimeout(() => reject(new Error(error)), delay));
}

describe("runBatch", () => {
  const baseOptions: BatchOptions = { chunkSize: 3, concurrency: 2 };

  it("resolves all successful tasks", async () => {
    const tasks = [1, 2, 3, 4, 5].map((n) => makeTask(n));
    const result = await runBatch(tasks, baseOptions);
    expect(result.totalRequested).toBe(5);
    expect(result.totalSucceeded).toBe(5);
    expect(result.errors).toHaveLength(0);
    expect(result.results.sort((a, b) => a - b)).toEqual([1, 2, 3, 4, 5]);
  });

  it("collects errors without stopping execution", async () => {
    const tasks = [
      makeTask("ok1"),
      makeFailingTask("boom"),
      makeTask("ok2"),
    ];
    const result = await runBatch(tasks, { chunkSize: 3, concurrency: 3 });
    expect(result.totalRequested).toBe(3);
    expect(result.totalSucceeded).toBe(2);
    expect(result.errors).toHaveLength(1);
    expect((result.errors[0].error as Error).message).toBe("boom");
  });

  it("respects chunkSize by processing in groups", async () => {
    const order: number[] = [];
    const tasks = [1, 2, 3, 4, 5, 6].map((n) =>
      () => Promise.resolve(order.push(n)).then(() => n)
    );
    const onChunkComplete = vi.fn();
    await runBatch(tasks, { chunkSize: 2, concurrency: 1, onChunkComplete });
    expect(onChunkComplete).toHaveBeenCalledTimes(3);
  });

  it("calls onChunkComplete with correct indices", async () => {
    const calls: [number, number][] = [];
    const tasks = [1, 2, 3, 4].map((n) => makeTask(n));
    await runBatch(tasks, {
      chunkSize: 2,
      concurrency: 2,
      onChunkComplete: (ci, total) => calls.push([ci, total]),
    });
    expect(calls).toEqual([[0, 2], [1, 2]]);
  });

  it("handles empty task list", async () => {
    const result = await runBatch([], baseOptions);
    expect(result.totalRequested).toBe(0);
    expect(result.totalSucceeded).toBe(0);
    expect(result.results).toHaveLength(0);
    expect(result.errors).toHaveLength(0);
  });

  it("applies delayBetweenChunks between chunks", async () => {
    vi.useFakeTimers();
    const tasks = [1, 2, 3, 4].map((n) => makeTask(n));
    const promise = runBatch(tasks, {
      chunkSize: 2,
      concurrency: 2,
      delayBetweenChunks: 100,
    });
    await vi.runAllTimersAsync();
    const result = await promise;
    expect(result.totalSucceeded).toBe(4);
    vi.useRealTimers();
  });
});
