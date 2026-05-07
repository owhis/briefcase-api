import { describe, it, expect } from 'vitest';
import {
  getTimeoutPreset,
  buildTimeoutOptions,
  validateTimeoutOptions,
  describeTimeoutState,
} from './timeout.config';

describe('getTimeoutPreset', () => {
  it('returns known preset by name', () => {
    expect(getTimeoutPreset('default').ms).toBe(5_000);
    expect(getTimeoutPreset('strict').ms).toBe(1_000);
    expect(getTimeoutPreset('long').ms).toBe(30_000);
  });

  it('throws for unknown preset', () => {
    expect(() => getTimeoutPreset('unknown')).toThrow('Unknown timeout preset');
  });
});

describe('buildTimeoutOptions', () => {
  it('uses default preset when called with no args', () => {
    expect(buildTimeoutOptions().ms).toBe(5_000);
  });

  it('merges partial options over default preset', () => {
    const opts = buildTimeoutOptions({ ms: 2_500 });
    expect(opts.ms).toBe(2_500);
  });

  it('accepts a preset name string', () => {
    expect(buildTimeoutOptions('relaxed').ms).toBe(15_000);
  });
});

describe('validateTimeoutOptions', () => {
  it('passes for valid options', () => {
    expect(() => validateTimeoutOptions({ ms: 1000 })).not.toThrow();
  });

  it('throws when ms is zero', () => {
    expect(() => validateTimeoutOptions({ ms: 0 })).toThrow();
  });

  it('throws when ms is negative', () => {
    expect(() => validateTimeoutOptions({ ms: -1 })).toThrow();
  });

  it('throws when onExpire is not a function', () => {
    expect(() => validateTimeoutOptions({ ms: 100, onExpire: 'bad' as any })).toThrow();
  });
});

describe('describeTimeoutState', () => {
  it('formats state as readable string', () => {
    const result = describeTimeoutState({ active: 2, cancelled: 1, expired: 3 });
    expect(result).toBe('active=2 cancelled=1 expired=3');
  });
});
