import { drain, createDrain, PageFetcher } from "./drain";
import {
  buildDrainOptions,
  validateDrainOptions,
  describeDrain,
  getDrainPreset,
} from "./drain.config";

function makePager<T>(pages: T[][]): PageFetcher<T> {
  return async (cursor: string | null) => {
    const index = cursor ? parseInt(cursor, 10) : 0;
    return {
      items: pages[index] ?? [],
      nextCursor: index + 1 < pages.length ? String(index + 1) : null,
    };
  };
}

describe("drain", () => {
  it("collects all pages when no limits set", async () => {
    const fetcher = makePager([[1, 2], [3, 4], [5]]);
    const result = await drain(fetcher);
    expect(result.items).toEqual([1, 2, 3, 4, 5]);
    expect(result.pages).toBe(3);
    expect(result.aborted).toBe(false);
  });

  it("respects maxPages", async () => {
    const fetcher = makePager([[1, 2], [3, 4], [5]]);
    const result = await drain(fetcher, { maxPages: 2 });
    expect(result.items).toEqual([1, 2, 3, 4]);
    expect(result.pages).toBe(2);
  });

  it("respects maxItems", async () => {
    const fetcher = makePager([[1, 2, 3], [4, 5, 6]]);
    const result = await drain(fetcher, { maxItems: 4 });
    expect(result.items).toEqual([1, 2, 3, 4]);
  });

  it("calls onPage callback for each page", async () => {
    const fetcher = makePager([["a"], ["b"]]);
    const calls: [string[], number][] = [];
    await drain(fetcher, { onPage: (items, page) => calls.push([items, page]) });
    expect(calls).toEqual([[["a"], 1], [["b"], 2]]);
  });

  it("aborts via AbortSignal", async () => {
    const controller = new AbortController();
    const fetcher: PageFetcher<number> = async () => {
      controller.abort();
      return { items: [1], nextCursor: "1" };
    };
    const result = await drain(fetcher, { signal: controller.signal });
    expect(result.aborted).toBe(true);
  });

  it("createDrain returns a bound drain function", async () => {
    const fetcher = makePager([[10, 20]]);
    const drainAll = createDrain(fetcher);
    const result = await drainAll();
    expect(result.items).toEqual([10, 20]);
  });
});

describe("drain.config", () => {
  it("getDrainPreset returns known preset", () => {
    expect(getDrainPreset("shallow")).toMatchObject({ maxPages: 1 });
  });

  it("getDrainPreset throws for unknown preset", () => {
    expect(() => getDrainPreset("bogus")).toThrow();
  });

  it("buildDrainOptions merges overrides", () => {
    const opts = buildDrainOptions({ maxPages: 5 });
    expect(opts.maxPages).toBe(5);
  });

  it("validateDrainOptions throws for invalid maxPages", () => {
    expect(() => validateDrainOptions({ maxPages: 0 })).toThrow(RangeError);
  });

  it("describeDrain returns readable string", () => {
    expect(describeDrain({ maxPages: 3, maxItems: 50 })).toBe("drain(maxPages=3, maxItems=50)");
  });
});
