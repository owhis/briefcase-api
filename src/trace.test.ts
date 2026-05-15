import { describe, it, expect, beforeEach } from "vitest";
import { createTrace } from "./trace";
import {
  buildTraceOptions,
  validateTraceOptions,
  describeTrace,
  listTracePresets,
  getTracePreset,
} from "./trace.config";

describe("createTrace", () => {
  let trace: ReturnType<typeof createTrace>;

  beforeEach(() => {
    trace = createTrace();
  });

  it("starts a span and returns an id", () => {
    const id = trace.start("fetch");
    expect(typeof id).toBe("string");
    expect(id.startsWith("span-")).toBe(true);
  });

  it("ends a span and records duration", () => {
    const id = trace.start("fetch");
    const span = trace.end(id);
    expect(span).toBeDefined();
    expect(span!.duration).toBeGreaterThanOrEqual(0);
    expect(span!.endedAt).toBeDefined();
  });

  it("returns undefined when ending unknown span", () => {
    expect(trace.end("nonexistent")).toBeUndefined();
  });

  it("records error on end", () => {
    const id = trace.start("fetch");
    const span = trace.end(id, "timeout");
    expect(span!.error).toBe("timeout");
  });

  it("tags a span", () => {
    const id = trace.start("fetch");
    trace.tag(id, "status", 200);
    const span = trace.getSpan(id);
    expect(span!.tags["status"]).toBe(200);
  });

  it("reports active and completed counts", () => {
    const a = trace.start("a");
    trace.start("b");
    trace.end(a);
    const state = trace.getState();
    expect(state.active).toBe(1);
    expect(state.completed).toBe(1);
    expect(state.spans).toHaveLength(2);
  });

  it("resets all spans", () => {
    trace.start("x");
    trace.reset();
    expect(trace.getState().spans).toHaveLength(0);
  });
});

describe("trace.config", () => {
  it("builds default options", () => {
    const opts = buildTraceOptions();
    expect(opts.maxSpans).toBe(500);
    expect(opts.autoTag).toBe(true);
  });

  it("merges overrides", () => {
    const opts = buildTraceOptions({ maxSpans: 10 });
    expect(opts.maxSpans).toBe(10);
  });

  it("validates maxSpans", () => {
    expect(() => validateTraceOptions(buildTraceOptions({ maxSpans: 0 }))).toThrow();
  });

  it("describes trace options", () => {
    const desc = describeTrace(buildTraceOptions());
    expect(desc).toContain("maxSpans=500");
  });

  it("lists presets", () => {
    expect(listTracePresets()).toContain("verbose");
  });

  it("throws on unknown preset", () => {
    expect(() => getTracePreset("unknown" as any)).toThrow();
  });
});
