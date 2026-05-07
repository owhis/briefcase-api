import {
  createReplay,
  record,
  replay,
  hasEntry,
  clearEntry,
  clearAll,
  getEntryCount,
  listEntries,
} from "./replay";

const req = { url: "/api/items", method: "GET" };

describe("createReplay", () => {
  it("defaults to passthrough mode", () => {
    const store = createReplay();
    expect(store.mode).toBe("passthrough");
    expect(store.entries.size).toBe(0);
  });

  it("accepts explicit mode", () => {
    const store = createReplay("record");
    expect(store.mode).toBe("record");
  });
});

describe("record / replay", () => {
  it("stores and retrieves a response", () => {
    const store = createReplay<string[]>("record");
    record(store, "k1", req, ["a", "b"]);
    expect(replay(store, "k1")).toEqual(["a", "b"]);
  });

  it("returns undefined for missing key", () => {
    const store = createReplay();
    expect(replay(store, "missing")).toBeUndefined();
  });

  it("overwrites existing entry with same key", () => {
    const store = createReplay<number>("record");
    record(store, "k", req, 1);
    record(store, "k", req, 2);
    expect(replay(store, "k")).toBe(2);
  });
});

describe("hasEntry", () => {
  it("returns true when entry exists", () => {
    const store = createReplay<string>("record");
    record(store, "k", req, "hello");
    expect(hasEntry(store, "k")).toBe(true);
  });

  it("returns false when entry is absent", () => {
    expect(hasEntry(createReplay(), "nope")).toBe(false);
  });
});

describe("clearEntry / clearAll", () => {
  it("removes a single entry", () => {
    const store = createReplay<number>("record");
    record(store, "k", req, 42);
    expect(clearEntry(store, "k")).toBe(true);
    expect(hasEntry(store, "k")).toBe(false);
  });

  it("returns false when key does not exist", () => {
    expect(clearEntry(createReplay(), "ghost")).toBe(false);
  });

  it("clears all entries", () => {
    const store = createReplay<number>("record");
    record(store, "a", req, 1);
    record(store, "b", req, 2);
    clearAll(store);
    expect(getEntryCount(store)).toBe(0);
  });
});

describe("listEntries", () => {
  it("returns all recorded entries", () => {
    const store = createReplay<string>("record");
    record(store, "x", req, "foo");
    record(store, "y", req, "bar");
    const entries = listEntries(store);
    expect(entries).toHaveLength(2);
    expect(entries.map((e) => e.key)).toEqual(expect.arrayContaining(["x", "y"]));
  });
});
