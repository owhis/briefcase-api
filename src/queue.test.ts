import { createQueue } from './queue';

const delay = (ms: number) => new Promise<void>(r => setTimeout(r, ms));
const makeTask = <T>(value: T, ms = 0) => () => delay(ms).then(() => value);
const makeFailingTask = (msg = 'fail') => () => Promise.reject(new Error(msg));

describe('createQueue', () => {
  it('executes a single task and returns its result', async () => {
    const queue = createQueue<number>(1);
    const result = await queue.enqueue({ id: 't1', run: makeTask(42), priority: 0 });
    expect(result).toBe(42);
  });

  it('respects concurrency limit', async () => {
    const queue = createQueue<number>(2);
    let active = 0;
    let maxActive = 0;
    const task = () =>
      new Promise<number>(r => {
        active++;
        maxActive = Math.max(maxActive, active);
        setTimeout(() => { active--; r(1); }, 30);
      });
    await Promise.all([
      queue.enqueue({ id: 'a', run: task, priority: 0 }),
      queue.enqueue({ id: 'b', run: task, priority: 0 }),
      queue.enqueue({ id: 'c', run: task, priority: 0 }),
    ]);
    expect(maxActive).toBe(2);
  });

  it('runs higher-priority tasks first', async () => {
    const queue = createQueue<string>(1);
    const order: string[] = [];
    const blocker = queue.enqueue({ id: 'block', run: () => delay(20).then(() => 'x'), priority: 0 });
    const low = queue.enqueue({ id: 'low', run: () => Promise.resolve(order.push('low') as unknown as string), priority: 1 });
    const high = queue.enqueue({ id: 'high', run: () => Promise.resolve(order.push('high') as unknown as string), priority: 10 });
    await Promise.all([blocker, low, high]);
    expect(order).toEqual(['high', 'low']);
  });

  it('rejects the promise when a task throws', async () => {
    const queue = createQueue<never>(1);
    await expect(
      queue.enqueue({ id: 'bad', run: makeFailingTask('boom'), priority: 0 })
    ).rejects.toThrow('boom');
    expect(queue.getState().failed).toBe(1);
  });

  it('tracks state correctly', async () => {
    const queue = createQueue<number>(1);
    const p = queue.enqueue({ id: 'x', run: makeTask(1, 30), priority: 0 });
    expect(queue.getState().running).toBe(1);
    await p;
    expect(queue.getState().completed).toBe(1);
    expect(queue.getState().running).toBe(0);
  });

  it('clear removes pending tasks (in-flight tasks still complete)', async () => {
    const queue = createQueue<number>(1);
    const first = queue.enqueue({ id: 'f', run: makeTask(1, 40), priority: 0 });
    queue.enqueue({ id: 's', run: makeTask(2), priority: 0 });
    queue.clear();
    expect(queue.getState().pending).toBe(0);
    await expect(first).resolves.toBe(1);
  });

  it('drain resolves when queue is empty', async () => {
    const queue = createQueue<number>(2);
    queue.enqueue({ id: 'a', run: makeTask(1, 20), priority: 0 });
    queue.enqueue({ id: 'b', run: makeTask(2, 20), priority: 0 });
    await queue.drain();
    const state = queue.getState();
    expect(state.pending).toBe(0);
    expect(state.running).toBe(0);
  });
});
