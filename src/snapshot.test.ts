import {
  createMemoryStore,
  captureSnapshot,
  isExpired,
  resolveSnapshot,
} from "./snapshot";
import {
  buildSnapshotOptions,
  buildSnapshotKey,
  validateSnapshotOptions,
  getSnapshotPreset,
} from "./snapshot.config";

describe("createMemoryStore", () => {
  it("saves and loads a snapshot", () => {
    const store = createMemoryStore<string>();
    const snap = captureSnapshot("k1", "hello");
    store.save(snap);
    expect(store.load("k1")).toEqual(snap);
  });

  it("returns undefined for missing keys", () => {
    const store = createMemoryStore<number>();
    expect(store.load("missing")).toBeUndefined();
  });

  it("removes a snapshot", () => {
    const store = createMemoryStore<boolean>();
    const snap = captureSnapshot("k2", true);
    store.save(snap);
    store.remove("k2");
    expect(store.load("k2")).toBeUndefined();
  });

  it("clears all snapshots", () => {
    const store = createMemoryStore<number>();
    store.save(captureSnapshot("a", 1));
    store.save(captureSnapshot("b", 2));
    store.clear();
    expect(store.keys()).toHaveLength(0);
  });
});

describe("captureSnapshot", () => {
  it("sets expiresAt when ttlMs provided", () => {
    const before = Date.now();
    const snap = captureSnapshot("x", 42, 5000);
    expect(snap.expiresAt).toBeGreaterThanOrEqual(before + 5000);
  });

  it("sets expiresAt to null when no ttl", () => {
    const snap = captureSnapshot("y", 42);
    expect(snap.expiresAt).toBeNull();
  });
});

describe("isExpired", () => {
  it("returns false for non-expiring snapshots", () => {
    const snap = captureSnapshot("z", "data", null);
    expect(isExpired(snap)).toBe(false);
  });

  it("returns true for expired snapshots", () => {
    const snap = captureSnapshot("z", "data", -1000);
    expect(isExpired(snap)).toBe(true);
  });

  it("returns false for snapshots that have not yet expired", () => {
    const snap = captureSnapshot("z", "data", 60_000);
    expect(isExpired(snap)).toBe(false);
  });
});

describe("resolveSnapshot", () => {
  it("returns data for valid snapshot", () => {
    const store = createMemoryStore<string>();
    store.save(captureSnapshot("r1", "value", 60_000));
    expect(resolveSnapshot(store, "r1")).toBe("value");
  });

  it("removes and returns undefined for expired snapshot", () => {
    const store = createMemoryStore<string>();
    store.save(captureSnapshot("r2", "old", -1));
    expect(resolveSnapshot(store, "r2")).toBeUndefined();
    expect(store.load("r2")).toBeUndefined();
  });

  it("returns undefined for missing key", () => {
    const store = createMemoryStore<string>();
    expect(resolveSnapshot(store, "nonexistent")).toBeUndefined();
  });
});

describe("snapshot.config", () => {
  it("builds options with defaults", () => {
    const opts = buildSnapshotOptions();
    expect(opts.ttlMs).toBe(30_000);
    expect(opts.keyPrefix).toBe("snap");
    expect(opts.store).toBeDefined();
  });

  it("merges preset overrides", () => {
    const opts = buildSnapshotOptions({ preset: "session", keyPrefix: "my" });
    expect(opts.ttlMs).toBe(300_000);
    expect(opts.keyPrefix).toBe("my");
  });

  it("builds snapshot key from parts", () => {
    expect(buildSnapshotKey("snap", "users", "page-1")).toBe("snap:users:page-1");
  });

  it("validates and throws on bad ttlMs", () => {
    expect(() => validateSnapshotOptions({ ttlMs: -1 })).toThrow();
  });

  it("validates and throws on empty keyPrefix", () => {
    expect(() => validateSnapshotOptions({ keyPrefix: "" })).toThrow();
  });

  it("returns a known preset by name", () => {
    const preset = getSnapshotPreset("session");
    expect(preset).toBeDefined();
    expect(preset.ttlMs).toBe(300_000);
  });
});
