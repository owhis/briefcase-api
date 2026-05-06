import { createCircuitBreaker } from './circuit';
import { buildCircuitOptions, validateCircuitOptions, getCircuitPreset } from './circuit.config';

const succeed = <T>(value: T) => () => Promise.resolve(value);
const fail = (msg = 'boom') => () => Promise.reject(new Error(msg));

describe('createCircuitBreaker', () => {
  it('starts in closed state', () => {
    const cb = createCircuitBreaker(buildCircuitOptions());
    expect(cb.getState()).toBe('closed');
  });

  it('passes through successful calls', async () => {
    const cb = createCircuitBreaker(buildCircuitOptions());
    const result = await cb.call(succeed(42));
    expect(result).toBe(42);
  });

  it('opens after reaching failure threshold', async () => {
    const cb = createCircuitBreaker(buildCircuitOptions({ threshold: 3 }));
    for (let i = 0; i < 3; i++) {
      await expect(cb.call(fail())).rejects.toThrow('boom');
    }
    expect(cb.getState()).toBe('open');
  });

  it('blocks calls when open', async () => {
    const cb = createCircuitBreaker(buildCircuitOptions({ threshold: 1 }));
    await expect(cb.call(fail())).rejects.toThrow();
    await expect(cb.call(succeed(1))).rejects.toThrow('circuit is open');
  });

  it('transitions to half-open after resetTimeout', async () => {
    const cb = createCircuitBreaker(buildCircuitOptions({ threshold: 1, resetTimeout: 0 }));
    await expect(cb.call(fail())).rejects.toThrow();
    await new Promise(r => setTimeout(r, 10));
    expect(cb.getState()).toBe('half-open');
  });

  it('closes again after successful half-open call', async () => {
    const cb = createCircuitBreaker(buildCircuitOptions({ threshold: 1, resetTimeout: 0 }));
    await expect(cb.call(fail())).rejects.toThrow();
    await new Promise(r => setTimeout(r, 10));
    await cb.call(succeed('ok'));
    expect(cb.getState()).toBe('closed');
  });

  it('calls onStateChange when transitioning', async () => {
    const changes: string[] = [];
    const cb = createCircuitBreaker(
      buildCircuitOptions({ threshold: 1, onStateChange: (p, n) => changes.push(`${p}->${n}`) })
    );
    await expect(cb.call(fail())).rejects.toThrow();
    expect(changes).toContain('closed->open');
  });

  it('reset restores closed state', async () => {
    const cb = createCircuitBreaker(buildCircuitOptions({ threshold: 1 }));
    await expect(cb.call(fail())).rejects.toThrow();
    cb.reset();
    expect(cb.getState()).toBe('closed');
    expect(cb.failures).toBe(0);
  });
});

describe('getCircuitPreset', () => {
  it('returns correct threshold for strict preset', () => {
    expect(getCircuitPreset('strict').threshold).toBe(2);
  });
});

describe('validateCircuitOptions', () => {
  it('throws on non-positive threshold', () => {
    expect(() => validateCircuitOptions({ threshold: 0, resetTimeout: 1000 })).toThrow(RangeError);
  });

  it('throws on negative resetTimeout', () => {
    expect(() => validateCircuitOptions({ threshold: 3, resetTimeout: -1 })).toThrow(RangeError);
  });

  it('passes for valid options', () => {
    expect(() => validateCircuitOptions({ threshold: 5, resetTimeout: 10_000 })).not.toThrow();
  });
});
