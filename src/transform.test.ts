import {
  createTransform,
  composeTransforms,
  mapItems,
  filterItems,
} from "./transform";
import {
  buildTransformOptions,
  validateTransformOptions,
  getTransformPreset,
} from "./transform.config";

describe("createTransform", () => {
  it("applies the transform function", async () => {
    const double = createTransform({ fn: (n: number) => n * 2 });
    expect(await double(5)).toBe(10);
  });

  it("handles async transform functions", async () => {
    const asyncFn = createTransform({
      fn: async (s: string) => s.toUpperCase(),
    });
    expect(await asyncFn("hello")).toBe("HELLO");
  });

  it("calls onError when transform throws", async () => {
    const t = createTransform<number, string>({
      fn: () => { throw new Error("fail"); },
      onError: (_err, data) => `fallback:${data}`,
    });
    expect(await t(42)).toBe("fallback:42");
  });

  it("rethrows when no onError provided", async () => {
    const t = createTransform<number, number>({
      fn: () => { throw new Error("boom"); },
    });
    await expect(t(1)).rejects.toThrow("boom");
  });
});

describe("composeTransforms", () => {
  it("chains multiple transforms in order", async () => {
    const composed = composeTransforms<number>(
      (n) => n + 1,
      (n) => n * 3
    );
    expect(await composed(2)).toBe(9);
  });
});

describe("mapItems", () => {
  it("maps a transform over an array", async () => {
    const double = mapItems((n: number) => n * 2);
    expect(await double([1, 2, 3])).toEqual([2, 4, 6]);
  });
});

describe("filterItems", () => {
  it("filters items using a predicate", async () => {
    const evens = filterItems((n: number) => n % 2 === 0);
    expect(await evens([1, 2, 3, 4])).toEqual([2, 4]);
  });
});

describe("getTransformPreset", () => {
  it("passthrough returns data unchanged", async () => {
    const fn = getTransformPreset("passthrough");
    expect(await fn({ a: 1 })).toEqual({ a: 1 });
  });

  it("camel converts snake_case keys", async () => {
    const fn = getTransformPreset("camel");
    expect(await fn({ foo_bar: 1, nested: { baz_qux: 2 } })).toEqual({
      fooBar: 1,
      nested: { bazQux: 2 },
    });
  });

  it("throws for unknown preset", () => {
    expect(() => getTransformPreset("unknown" as any)).toThrow();
  });
});

describe("buildTransformOptions", () => {
  it("uses provided fn", () => {
    const fn = (x: number) => x;
    const opts = buildTransformOptions({ fn });
    expect(opts.fn).toBe(fn);
  });

  it("falls back to preset when no fn provided", async () => {
    const opts = buildTransformOptions({ preset: "camel" });
    expect(await opts.fn({ foo_bar: 1 })).toEqual({ fooBar: 1 });
  });
});

describe("validateTransformOptions", () => {
  it("does not throw for valid options", () => {
    expect(() => validateTransformOptions({ fn: (x: any) => x })).not.toThrow();
  });

  it("throws when fn is not a function", () => {
    expect(() => validateTransformOptions({ fn: 42 as any })).toThrow();
  });
});
