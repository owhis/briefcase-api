import { createScatter } from './scatter';

const delay = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));

function makeTarget(url: string, value: string, ms = 0): [string, () => Promise<string>] {
  return [url, async () => { await delay(ms); return value; }];
}

describe('createScatter', () => {
  it('collects results from all targets', async () => {
    const [u1, f1] = makeTarget('http://a', 'A');
    const [u2, f2] = makeTarget('http://b', 'B');
    const map: Record<string, () => Promise<string>> = { [u1]: f1, [u2]: f2 };
    const scatter = createScatter({ targets: [u1, u2], fetch: (url) => map[url]() });
    const state = await scatter.run();
    expect(state.succeeded).toBe(2);
    expect(state.failed).toBe(0);
    expect(state.results.map((r) => r.value).sort()).toEqual(['A', 'B']);
  });

  it('records errors without stopping when continueOnError=true', async () => {
    const targets = ['http://ok', 'http://fail'];
    const scatter = createScatter({
      targets,
      fetch: async (url) => { if (url.includes('fail')) throw new Error('boom'); return 'ok'; },
      continueOnError: true,
    });
    const state = await scatter.run();
    expect(state.succeeded).toBe(1);
    expect(state.failed).toBe(1);
    expect(state.results.find((r) => r.url === 'http://fail')?.error?.message).toBe('boom');
  });

  it('respects concurrency limit', async () => {
    let concurrent = 0;
    let maxConcurrent = 0;
    const targets = ['a', 'b', 'c', 'd'];
    const scatter = createScatter({
      targets,
      concurrency: 2,
      fetch: async () => {
        concurrent++;
        maxConcurrent = Math.max(maxConcurrent, concurrent);
        await delay(20);
        concurrent--;
        return 'x';
      },
    });
    await scatter.run();
    expect(maxConcurrent).toBeLessThanOrEqual(2);
  });

  it('times out slow targets', async () => {
    const scatter = createScatter({
      targets: ['http://slow'],
      fetch: async () => { await delay(200); return 'late'; },
      timeout: 30,
    });
    const state = await scatter.run();
    expect(state.failed).toBe(1);
    expect(state.results[0].error?.message).toMatch(/Timeout/);
  });

  it('includes durationMs for each result', async () => {
    const scatter = createScatter({
      targets: ['http://x'],
      fetch: async () => { await delay(10); return 'v'; },
    });
    const state = await scatter.run();
    expect(state.results[0].durationMs).toBeGreaterThanOrEqual(10);
  });
});
