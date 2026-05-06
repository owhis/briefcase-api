import { dedup, pendingCount, clearPending } from "./dedup";
import { buildDedupKey, buildDedupOptions, validateDedupOptions } from "./dedup.config";

beforeEach(() => clearPending());

// ---------------------------------------------------------------------------
// dedup()
// ---------------------------------------------------------------------------
describe("dedup", () => {
  it("calls fn once and resolves all waiters with the same value", async () => {
    let callCount = 0;
    const fn = () => new Promise<number>((r) => setTimeout(() => { callCount++; r(42); }, 10));

    const [a, b, c] = await Promise.all([dedup("k", fn), dedup("k", fn), dedup("k", fn)]);

    expect(callCount).toBe(1);
    expect(a).toBe(42);
    expect(b).toBe(42);
    expect(c).toBe(42);
  });

  it("removes the key after resolution", async () => {
    await dedup("k", () => Promise.resolve(1));
    expect(pendingCount()).toBe(0);
  });

  it("propagates rejection to all waiters", async () => {
    const err = new Error("boom");
    const fn = () => new Promise<never>((_, reject) => setTimeout(() => reject(err), 10));

    const results = await Promise.allSettled([dedup("k", fn), dedup("k", fn)]);

    results.forEach((r) => {
      expect(r.status).toBe("rejected");
      if (r.status === "rejected") expect(r.reason).toBe(err);
    });
  });

  it("removes the key after rejection", async () => {
    await dedup("k", () => Promise.reject(new Error("x"))).catch(() => {});
    expect(pendingCount()).toBe(0);
  });

  it("allows a new request after the previous one settles", async () => {
    let callCount = 0;
    const fn = () => new Promise<number>((r) => { callCount++; r(callCount); });

    const first = await dedup("k", fn);
    const second = await dedup("k", fn);

    expect(first).toBe(1);
    expect(second).toBe(2);
  });
});

// ---------------------------------------------------------------------------
// buildDedupKey()
// ---------------------------------------------------------------------------
describe("buildDedupKey", () => {
  it("returns a namespaced key without params", () => {
    expect(buildDedupKey("/api/items")).toBe("default::/api/items");
  });

  it("appends sorted query params", () => {
    const key = buildDedupKey("/api/items", { page: 2, limit: 10 });
    expect(key).toBe("default::/api/items?limit=10&page=2");
  });

  it("respects a custom namespace", () => {
    const key = buildDedupKey("/api/items", undefined, { namespace: "user-1" });
    expect(key).toBe("user-1::/api/items");
  });
});

// ---------------------------------------------------------------------------
// validateDedupOptions()
// ---------------------------------------------------------------------------
describe("validateDedupOptions", () => {
  it("throws when namespace is an empty string", () => {
    expect(() => validateDedupOptions({ namespace: "  " })).toThrow();
  });

  it("does not throw for valid options", () => {
    expect(() => validateDedupOptions({ namespace: "ns", enabled: false })).not.toThrow();
  });
});

// ---------------------------------------------------------------------------
// buildDedupOptions()
// ---------------------------------------------------------------------------
describe("buildDedupOptions", () => {
  it("fills in defaults when called with no arguments", () => {
    const opts = buildDedupOptions();
    expect(opts.namespace).toBe("default");
    expect(opts.enabled).toBe(true);
  });

  it("overrides individual fields", () => {
    const opts = buildDedupOptions({ enabled: false });
    expect(opts.enabled).toBe(false);
    expect(opts.namespace).toBe("default");
  });
});
