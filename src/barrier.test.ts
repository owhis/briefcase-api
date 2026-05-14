import { createBarrier } from './barrier';

describe('createBarrier', () => {
  it('throws for target < 1', () => {
    expect(() => createBarrier(0)).toThrow(RangeError);
  });

  it('resolves immediately when target is 1', async () => {
    const b = createBarrier(1);
    await expect(b.arrive()).resolves.toBeUndefined();
  });

  it('blocks until all parties arrive', async () => {
    const b = createBarrier(3);
    const order: number[] = [];

    const p1 = b.arrive().then(() => order.push(1));
    const p2 = b.arrive().then(() => order.push(2));
    const p3 = b.arrive().then(() => order.push(3));

    await Promise.all([p1, p2, p3]);
    expect(order).toHaveLength(3);
  });

  it('tracks remaining count correctly', () => {
    const b = createBarrier(3);
    expect(b.remaining()).toBe(3);
    b.arrive();
    expect(b.remaining()).toBe(2);
  });

  it('increments generation after each cycle', async () => {
    const b = createBarrier(2);
    expect(b.getState().generation).toBe(0);
    await Promise.all([b.arrive(), b.arrive()]);
    expect(b.getState().generation).toBe(1);
    await Promise.all([b.arrive(), b.arrive()]);
    expect(b.getState().generation).toBe(2);
  });

  it('reset unblocks waiting parties', async () => {
    const b = createBarrier(3);
    const settled: boolean[] = [];

    const p1 = b.arrive().then(() => settled.push(true));
    const p2 = b.arrive().then(() => settled.push(true));

    b.reset();
    await Promise.all([p1, p2]);
    expect(settled).toHaveLength(2);
  });

  it('resets count to 0 after a full cycle', async () => {
    const b = createBarrier(2);
    await Promise.all([b.arrive(), b.arrive()]);
    expect(b.getState().count).toBe(0);
  });

  it('getState reflects current count and target', () => {
    const b = createBarrier(4);
    b.arrive();
    b.arrive();
    const s = b.getState();
    expect(s.count).toBe(2);
    expect(s.target).toBe(4);
    expect(s.released).toBe(false);
  });
});
