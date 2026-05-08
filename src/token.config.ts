import { TokenOptions } from './token';

export type TokenPreset = 'default' | 'strict' | 'relaxed' | 'burst';

const PRESETS: Record<TokenPreset, TokenOptions> = {
  default: { capacity: 10, refillRate: 10 / 1000 },       // 10 tokens, 10/s
  strict:  { capacity: 5,  refillRate: 1  / 1000 },       // 5 tokens, 1/s
  relaxed: { capacity: 50, refillRate: 50 / 1000 },       // 50 tokens, 50/s
  burst:   { capacity: 100, refillRate: 10 / 1000 },      // 100 burst, 10/s refill
};

export function getTokenPreset(name: TokenPreset): TokenOptions {
  const preset = PRESETS[name];
  if (!preset) throw new Error(`Unknown token preset: "${name}"`);
  return { ...preset };
}

export function buildTokenOptions(overrides: Partial<TokenOptions> & { preset?: TokenPreset } = {}): TokenOptions {
  const { preset = 'default', ...rest } = overrides;
  return { ...getTokenPreset(preset), ...rest };
}

export function validateTokenOptions(options: TokenOptions): void {
  if (options.capacity <= 0) throw new Error('Token bucket capacity must be > 0');
  if (options.refillRate <= 0) throw new Error('Token bucket refillRate must be > 0');
  if (options.initialTokens !== undefined && options.initialTokens < 0) {
    throw new Error('Token bucket initialTokens must be >= 0');
  }
}

export function describeTokenBucket(options: TokenOptions): string {
  const rps = (options.refillRate * 1000).toFixed(2);
  return `capacity=${options.capacity}, refillRate=${rps} tokens/s`;
}

export function listTokenPresets(): TokenPreset[] {
  return Object.keys(PRESETS) as TokenPreset[];
}
