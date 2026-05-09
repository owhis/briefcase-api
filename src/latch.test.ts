import { createLatch } from './latch';

describe('createLatch', () => {
  it('resolves immediately when created open', async () => {
    const latch = createLatch(true);
    await expect(latch.wait()).resolves.toBeUndefined();
  });

  it('blocks waiters when created closed', async () => {
    const latch = createLatch(false);
    let resolved = false;
    const p = latch.wait().then(() => { resolved = true; });
    await Promise.resolve();
    expect(resolved).toBe(false);
    latch.open();
    await p;
    expect(resolved).toBe(true);
  });

  it('resolves multiple waiters on open', async () => {
    const latch = createLatch();
    const results: number[] = [];
    const waiters = [1, 2, 3].map((n) =>
      latch.wait().then(() => results.push(n))
    );
    latch.open();
    await Promise.all(waiters);
    expect(results).toEqual([1, 2, 3]);
  });

  it('calling open twice is idempotent', async () => {
    const latch = createLatch();
    latch.open();
    latch.open();
    await expect(latch.wait()).resolves.toBeUndefined();
  });

  it('isOpen reflects state correctly', () => {
    const latch = createLatch();
    expect(latch.isOpen()).toBe(false);
    latch.open();
    expect(latch.isOpen()).toBe(true);
  });

  it('close resets the latch so future waiters block again', async () => {
    const latch = createLatch(true);
    latch.close();
    expect(latch.isOpen()).toBe(false);
    let resolved = false;
    const p = latch.wait().then(() => { resolved = true; });
    await Promise.resolve();
    expect(resolved).toBe(false);
    latch.open();
    await p;
    expect(resolved).toBe(true);
  });

  it('calling close on an already-closed latch is a no-op', () => {
    const latch = createLatch();
    expect(() => { latch.close(); latch.close(); }).not.toThrow();
  });
});
