import { describe, it, expect, beforeEach } from "vitest";
import { createShard, Shard } from "./shard";
import { buildShardOptions, validateShardOptions, describeShard, listShardPresets, getShardPreset } from "./shard.config";

describe("createShard", () => {
  let shard: Shard;

  beforeEach(() => {
    shard = createShard({ buckets: 8 });
  });

  it("assigns a key to a bucket in range [0, buckets)", () => {
    const b = shard.assign("hello");
    expect(b).toBeGreaterThanOrEqual(0);
    expect(b).toBeLessThan(8);
  });

  it("returns the same bucket for the same key", () => {
    expect(shard.assign("stable")).toBe(shard.assign("stable"));
  });

  it("lookup returns undefined for unknown key", () => {
    expect(shard.lookup("unknown")).toBeUndefined();
  });

  it("lookup returns bucket after assign", () => {
    const b = shard.assign("foo");
    expect(shard.lookup("foo")).toBe(b);
  });

  it("getState reflects assigned keys", () => {
    shard.assign("a");
    shard.assign("b");
    const state = shard.getState();
    expect(state.assigned.size).toBe(2);
    expect(state.buckets).toBe(8);
  });

  it("clear removes all assignments", () => {
    shard.assign("x");
    shard.clear();
    expect(shard.getState().assigned.size).toBe(0);
  });

  it("throws when buckets < 1", () => {
    expect(() => createShard({ buckets: 0 })).toThrow(RangeError);
  });

  it("respects a custom hash function", () => {
    const fixed = createShard({ buckets: 4, hash: () => 2 });
    expect(fixed.assign("any")).toBe(2);
  });

  it("assign is idempotent — reassigning the same key returns the same bucket", () => {
    const first = shard.assign("idempotent");
    const second = shard.assign("idempotent");
    expect(second).toBe(first);
    // Ensure the key is only tracked once in state
    expect(shard.getState().assigned.size).toBe(1);
  });
});

describe("shard.config", () => {
  it("getShardPreset returns options for known preset", () => {
    const opts = getShardPreset("large");
    expect(opts.buckets).toBe(64);
  });

  it("buildShardOptions merges overrides", () => {
    const opts = buildShardOptions({ buckets: 32 }, "small");
    expect(opts.buckets).toBe(32);
  });

  it("validateShardOptions throws on invalid buckets", () => {
    expect(() => validateShardOptions({ buckets: -1 })).toThrow(RangeError);
  });

  it("describeShard returns a readable string", () => {
    expect(describeShard({ buckets: 16 })).toContain("16");
  });

  it("listShardPresets returns all preset names", () => {
    expect(listShardPresets()).toEqual(expect.arrayContaining(["small", "medium", "large", "xlarge"]));
  });
});
