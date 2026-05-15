import { describe, it, expect, beforeEach } from "vitest";
import { createRelay, Relay } from "./relay";

describe("createRelay", () => {
  it("throws when no targets provided", () => {
    expect(() => createRelay([])).toThrow("at least one target");
  });

  it("throws when all targets are disabled", () => {
    expect(() =>
      createRelay([{ baseUrl: "https://a.example.com", disabled: true }])
    ).toThrow("all targets are disabled");
  });

  it("resolves the first active target initially", () => {
    const relay = createRelay([
      { baseUrl: "https://a.example.com" },
      { baseUrl: "https://b.example.com" },
    ]);
    expect(relay.resolve()).toBe("https://a.example.com");
  });

  it("skips disabled targets", () => {
    const relay = createRelay([
      { baseUrl: "https://a.example.com", disabled: true },
      { baseUrl: "https://b.example.com" },
    ]);
    expect(relay.resolve()).toBe("https://b.example.com");
  });

  it("advances to next target on fail()", () => {
    const relay = createRelay([
      { baseUrl: "https://a.example.com" },
      { baseUrl: "https://b.example.com" },
    ]);
    relay.fail();
    expect(relay.resolve()).toBe("https://b.example.com");
  });

  it("returns null when all targets exhausted", () => {
    const relay = createRelay([{ baseUrl: "https://a.example.com" }]);
    relay.fail();
    expect(relay.resolve()).toBeNull();
  });

  it("tracks attempts across failures", () => {
    const relay = createRelay([
      { baseUrl: "https://a.example.com" },
      { baseUrl: "https://b.example.com" },
    ]);
    relay.fail();
    relay.fail();
    expect(relay.getState().attempts).toBe(2);
  });

  it("reports exhausted state correctly", () => {
    const relay = createRelay([{ baseUrl: "https://a.example.com" }]);
    expect(relay.getState().exhausted).toBe(false);
    relay.fail();
    expect(relay.getState().exhausted).toBe(true);
  });

  it("resets state back to initial", () => {
    const relay = createRelay([
      { baseUrl: "https://a.example.com" },
      { baseUrl: "https://b.example.com" },
    ]);
    relay.fail();
    relay.reset();
    const state = relay.getState();
    expect(state.current).toBe(0);
    expect(state.attempts).toBe(0);
    expect(state.exhausted).toBe(false);
    expect(relay.resolve()).toBe("https://a.example.com");
  });
});
