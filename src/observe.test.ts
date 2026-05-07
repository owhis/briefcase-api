import { createObserver, ObserverPayload } from "./observe";
import {
  buildObserveOptions,
  validateObserveOptions,
  getObservePreset,
  buildNamespacedEvent,
} from "./observe.config";

describe("createObserver", () => {
  it("calls registered handler on emit", () => {
    const obs = createObserver();
    const received: ObserverPayload[] = [];
    obs.on("request", (p) => received.push(p));
    obs.emit("request", "https://api.example.com/items");
    expect(received).toHaveLength(1);
    expect(received[0].event).toBe("request");
    expect(received[0].url).toBe("https://api.example.com/items");
  });

  it("does not call handler after off()", () => {
    const obs = createObserver();
    const calls: number[] = [];
    const handler = () => calls.push(1);
    obs.on("error", handler);
    obs.off("error", handler);
    obs.emit("error", "/fail");
    expect(calls).toHaveLength(0);
  });

  it("includes meta in payload", () => {
    const obs = createObserver();
    let captured: ObserverPayload | null = null;
    obs.on("cache-hit", (p) => (captured = p));
    obs.emit("cache-hit", "/data", { key: "abc" });
    expect(captured).not.toBeNull();
    expect((captured as any).meta).toEqual({ key: "abc" });
  });

  it("listenerCount returns correct count", () => {
    const obs = createObserver();
    expect(obs.listenerCount("retry")).toBe(0);
    obs.on("retry", () => {});
    obs.on("retry", () => {});
    expect(obs.listenerCount("retry")).toBe(2);
  });

  it("clear() removes all listeners", () => {
    const obs = createObserver();
    const calls: number[] = [];
    obs.on("response", () => calls.push(1));
    obs.clear();
    obs.emit("response", "/ok");
    expect(calls).toHaveLength(0);
  });

  it("swallows errors thrown by handlers", () => {
    const obs = createObserver();
    obs.on("error", () => { throw new Error("boom"); });
    expect(() => obs.emit("error", "/err")).not.toThrow();
  });
});

describe("observe.config", () => {
  it("buildObserveOptions fills defaults", () => {
    const opts = buildObserveOptions();
    expect(opts.includeTimestamp).toBe(true);
    expect(opts.events.length).toBeGreaterThan(0);
  });

  it("validateObserveOptions throws on empty events", () => {
    expect(() =>
      validateObserveOptions({ events: [], includeTimestamp: false })
    ).toThrow();
  });

  it("validateObserveOptions throws on unknown event", () => {
    expect(() =>
      validateObserveOptions({ events: ["unknown" as any], includeTimestamp: false })
    ).toThrow(/unknown events/);
  });

  it("getObservePreset returns errors preset", () => {
    const preset = getObservePreset("errors");
    expect(preset.events).toEqual(["error", "retry"]);
  });

  it("buildNamespacedEvent prefixes with namespace", () => {
    expect(buildNamespacedEvent("request", "api")).toBe("api:request");
    expect(buildNamespacedEvent("response")).toBe("response");
  });
});
