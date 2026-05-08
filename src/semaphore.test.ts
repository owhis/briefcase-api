import { createSemaphore } from "./semaphore";
import {
  buildSemaphoreOptions,
  describeSemaphore,
  getSemaphorePreset,
  listSemaphorePresets,
  validateSemaphoreOptions,
} from "./semaphore.config";

const delay = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));

describe("createSemaphore", () => {
  it("throws when capacity < 1", () => {
    expect(() => createSemaphore(0)).toThrow(RangeError);
  });

  it("allows up to capacity concurrent acquires immediately", async () => {
    const sem = createSemaphore(3);
    const releases = await Promise.all([sem.acquire(), sem.acquire(), sem.acquire()]);
    expect(sem.getState()).toEqual({ capacity: 3, active: 3, queued: 0 });
    releases.forEach((r) => r());
  });

  it("queues acquires beyond capacity", async () => {
    const sem = createSemaphore(1);
    const r1 = await sem.acquire();
    let r2Resolved = false;
    sem.acquire().then((r) => { r2Resolved = true; r(); });
    await delay(10);
    expect(r2Resolved).toBe(false);
    expect(sem.getState().queued).toBe(1);
    r1();
    await delay(10);
    expect(r2Resolved).toBe(true);
  });

  it("decrements active on release", async () => {
    const sem = createSemaphore(2);
    const r1 = await sem.acquire();
    const r2 = await sem.acquire();
    r1();
    expect(sem.getState().active).toBe(1);
    r2();
    expect(sem.getState().active).toBe(0);
  });

  it("drain resolves when idle", async () => {
    const sem = createSemaphore(2);
    const r1 = await sem.acquire();
    const drained = sem.drain();
    r1();
    await expect(drained).resolves.toBeUndefined();
  });
});

describe("semaphore.config", () => {
  it("getSemaphorePreset returns known preset", () => {
    const p = getSemaphorePreset("low");
    expect(p.capacity).toBe(3);
  });

  it("getSemaphorePreset throws on unknown preset", () => {
    expect(() => getSemaphorePreset("unknown")).toThrow();
  });

  it("buildSemaphoreOptions merges overrides", () => {
    const opts = buildSemaphoreOptions({ capacity: 5, label: "test" });
    expect(opts.capacity).toBe(5);
    expect(opts.label).toBe("test");
  });

  it("validateSemaphoreOptions throws on bad capacity", () => {
    expect(() => validateSemaphoreOptions({ capacity: 0 })).toThrow(RangeError);
    expect(() => validateSemaphoreOptions({ capacity: 1.5 })).toThrow(TypeError);
  });

  it("describeSemaphore formats correctly", () => {
    expect(describeSemaphore({ capacity: 10, label: "medium" })).toBe("Semaphore (medium): capacity=10");
    expect(describeSemaphore({ capacity: 5 })).toBe("Semaphore: capacity=5");
  });

  it("listSemaphorePresets returns all preset names", () => {
    expect(listSemaphorePresets()).toEqual(expect.arrayContaining(["single", "low", "medium", "high"]));
  });
});
