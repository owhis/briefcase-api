import { createTicker } from "./ticker";
import {
  buildTickerOptions,
  describeTicker,
  getTickerPreset,
  listTickerPresets,
  validateTickerOptions,
} from "./ticker.config";

function sleep(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}

describe("createTicker", () => {
  it("starts and accumulates ticks", async () => {
    const ticker = createTicker({ intervalMs: 20 });
    ticker.start();
    await sleep(70);
    ticker.stop();
    const { ticks, running } = ticker.getState();
    expect(ticks).toBeGreaterThanOrEqual(2);
    expect(running).toBe(false);
  });

  it("respects maxTicks and stops automatically", async () => {
    const ticker = createTicker({ intervalMs: 20, maxTicks: 2 });
    ticker.start();
    await sleep(100);
    const { ticks, running } = ticker.getState();
    expect(ticks).toBe(2);
    expect(running).toBe(false);
  });

  it("fires leading tick when leading=true", async () => {
    const ticks: number[] = [];
    const ticker = createTicker({ intervalMs: 500, leading: true, onTick: (n) => ticks.push(n) });
    ticker.start();
    await sleep(10);
    ticker.stop();
    expect(ticks[0]).toBe(1);
  });

  it("reset clears state and stops ticker", async () => {
    const ticker = createTicker({ intervalMs: 20 });
    ticker.start();
    await sleep(50);
    ticker.reset();
    const state = ticker.getState();
    expect(state.ticks).toBe(0);
    expect(state.running).toBe(false);
    expect(state.startedAt).toBeNull();
  });

  it("onTick returns an unsubscribe function", async () => {
    const calls: number[] = [];
    const ticker = createTicker({ intervalMs: 20 });
    const unsub = ticker.onTick((n) => calls.push(n));
    ticker.start();
    await sleep(30);
    unsub();
    const before = calls.length;
    await sleep(40);
    ticker.stop();
    expect(calls.length).toBe(before);
  });
});

describe("ticker.config", () => {
  it("getTickerPreset returns a copy of the preset", () => {
    const p = getTickerPreset("fast");
    expect(p.intervalMs).toBe(100);
  });

  it("buildTickerOptions merges and validates", () => {
    const opts = buildTickerOptions({ intervalMs: 200 }, { maxTicks: 5 });
    expect(opts.intervalMs).toBe(200);
    expect(opts.maxTicks).toBe(5);
  });

  it("validateTickerOptions throws on bad intervalMs", () => {
    expect(() => validateTickerOptions({ intervalMs: -1 })).toThrow();
    expect(() => validateTickerOptions({ intervalMs: 0 })).toThrow();
  });

  it("describeTicker returns a readable string", () => {
    const desc = describeTicker({ intervalMs: 1000, maxTicks: 10, leading: true });
    expect(desc).toContain("interval=1000ms");
    expect(desc).toContain("maxTicks=10");
    expect(desc).toContain("leading");
  });

  it("listTickerPresets returns all preset names", () => {
    const presets = listTickerPresets();
    expect(presets).toContain("fast");
    expect(presets).toContain("heartbeat");
  });
});
