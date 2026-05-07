/**
 * hedge.ts — Hedged request strategy: fire a second request if the first
 * doesn't respond within a speculative delay, return whichever resolves first.
 */

export interface HedgeState {
  attempts: number;
  hedged: boolean;
  winner: 'primary' | 'hedge' | null;
}

export interface HedgeHandle<T> {
  result: Promise<T>;
  state: () => HedgeState;
}

const state = new WeakMap<object, HedgeState>();

export function createHedge<T>(
  fn: () => Promise<T>,
  delayMs: number
): HedgeHandle<T> {
  const token = {};
  const s: HedgeState = { attempts: 0, hedged: false, winner: null };
  state.set(token, s);

  const result = new Promise<T>((resolve, reject) => {
    let settled = false;

    function settle(value: T, source: 'primary' | 'hedge') {
      if (settled) return;
      settled = true;
      s.winner = source;
      resolve(value);
    }

    function run(source: 'primary' | 'hedge') {
      s.attempts++;
      if (source === 'hedge') s.hedged = true;
      fn().then(
        (v) => settle(v, source),
        (err) => {
          if (source === 'primary' && !s.hedged) reject(err);
          else if (settled === false && s.attempts <= 1) reject(err);
        }
      );
    }

    run('primary');

    const timer = setTimeout(() => {
      if (!settled) run('hedge');
    }, delayMs);

    // Ensure timer doesn't block process exit
    if (typeof timer === 'object' && (timer as any).unref) {
      (timer as any).unref();
    }
  });

  return {
    result,
    state: () => ({ ...s }),
  };
}
