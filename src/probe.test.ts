import { createProbe, Probe } from "./probe";

// Minimal fetch stub
function stubFetch(ok: boolean, delayMs = 10): typeof fetch {
  return async (_url, opts) => {
    await new Promise<void>((resolve) => setTimeout(resolve, delayMs));
    if ((opts?.signal as AbortSignal | undefined)?.aborted) {
      throw new DOMException("Aborted", "AbortError");
    }
    return { ok, status: ok ? 200 : 503 } as Response;
  };
}

const URL = "https://api.example.com/health";

describe("createProbe", () => {
  let origFetch: typeof fetch;

  beforeEach(() => {
    origFetch = global.fetch;
  });

  afterEach(() => {
    global.fetch = origFetch;
  });

  it("returns a healthy state with no samples", () => {
    const probe = createProbe();
    const state = probe.getState();
    expect(state.healthy).toBe(true);
    expect(state.totalChecks).toBe(0);
    expect(state.lastCheckedAt).toBeNull();
  });

  it("records a successful sample", async () => {
    global.fetch = stubFetch(true);
    const probe = createProbe();
    const sample = await probe.check(URL);
    expect(sample.ok).toBe(true);
    expect(sample.latencyMs).toBeGreaterThanOrEqual(0);
    expect(probe.getState().totalChecks).toBe(1);
    expect(probe.getState().healthy).toBe(true);
  });

  it("records a failed sample", async () => {
    global.fetch = stubFetch(false);
    const probe = createProbe({ failureThreshold: 1 });
    await probe.check(URL);
    const state = probe.getState();
    expect(state.healthy).toBe(false);
    expect(state.failureCount).toBe(1);
  });

  it("respects windowSize and prunes old samples", async () => {
    global.fetch = stubFetch(true);
    const probe = createProbe({ windowSize: 3 });
    for (let i = 0; i < 5; i++) await probe.check(URL);
    expect(probe.getSamples().length).toBe(3);
    expect(probe.getState().totalChecks).toBe(5);
  });

  it("marks unhealthy when failures exceed threshold", async () => {
    const probe = createProbe({ failureThreshold: 2, windowSize: 5 });
    global.fetch = stubFetch(false);
    await probe.check(URL);
    await probe.check(URL);
    expect(probe.getState().healthy).toBe(false);
  });

  it("reset clears all samples", async () => {
    global.fetch = stubFetch(true);
    const probe = createProbe();
    await probe.check(URL);
    probe.reset();
    expect(probe.getSamples()).toHaveLength(0);
    expect(probe.getState().totalChecks).toBe(0);
  });

  it("handles fetch throwing (network error) gracefully", async () => {
    global.fetch = async () => { throw new Error("Network error"); };
    const probe = createProbe();
    const sample = await probe.check(URL);
    expect(sample.ok).toBe(false);
  });
});
