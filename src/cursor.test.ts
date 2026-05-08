import { createCursor } from "./cursor";

interface PagedResponse {
  data: string[];
  nextCursor: string | null;
}

function makeResponse(nextCursor: string | null, data: string[] = []): PagedResponse {
  return { data, nextCursor };
}

describe("createCursor", () => {
  const opts = {
    extractNext: (r: unknown) => (r as PagedResponse).nextCursor,
  };

  it("starts with null cursor and hasMore=true", () => {
    const cursor = createCursor(opts);
    const state = cursor.getState();
    expect(state.current).toBeNull();
    expect(state.hasMore).toBe(true);
    expect(state.pagesFetched).toBe(0);
  });

  it("advances cursor and tracks previous values", () => {
    const cursor = createCursor({ ...opts, initialCursor: "page0" });
    cursor.advance(makeResponse("page1"));
    const state = cursor.getState();
    expect(state.current).toBe("page1");
    expect(state.previous).toEqual(["page0"]);
    expect(state.pagesFetched).toBe(1);
  });

  it("marks hasMore=false when next cursor is null", () => {
    const cursor = createCursor(opts);
    const hasMore = cursor.advance(makeResponse(null));
    expect(hasMore).toBe(false);
    expect(cursor.isDone()).toBe(true);
  });

  it("respects maxPages limit", () => {
    const cursor = createCursor({ ...opts, maxPages: 2 });
    cursor.advance(makeResponse("page1"));
    const hasMore = cursor.advance(makeResponse("page2"));
    expect(hasMore).toBe(false);
    expect(cursor.getState().pagesFetched).toBe(2);
  });

  it("uses custom extractHasMore when provided", () => {
    const cursor = createCursor({
      ...opts,
      extractHasMore: (_r, next) => next !== null && next !== "end",
    });
    cursor.advance(makeResponse("end"));
    expect(cursor.isDone()).toBe(true);
  });

  it("resets state back to initial", () => {
    const cursor = createCursor({ ...opts, initialCursor: "start" });
    cursor.advance(makeResponse("page1"));
    cursor.advance(makeResponse(null));
    cursor.reset();
    const state = cursor.getState();
    expect(state.current).toBe("start");
    expect(state.previous).toEqual([]);
    expect(state.hasMore).toBe(true);
    expect(state.pagesFetched).toBe(0);
  });

  it("getState returns a snapshot copy", () => {
    const cursor = createCursor({ ...opts, initialCursor: "a" });
    const state1 = cursor.getState();
    cursor.advance(makeResponse("b"));
    expect(state1.current).toBe("a");
  });

  it("accumulates multiple previous cursors in order", () => {
    const cursor = createCursor({ ...opts, initialCursor: "page0" });
    cursor.advance(makeResponse("page1"));
    cursor.advance(makeResponse("page2"));
    cursor.advance(makeResponse("page3"));
    const state = cursor.getState();
    expect(state.previous).toEqual(["page0", "page1", "page2"]);
    expect(state.current).toBe("page3");
    expect(state.pagesFetched).toBe(3);
  });
});
