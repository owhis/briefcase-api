// lease.ts — Time-bounded exclusive ownership of a resource key

export interface LeaseState {
  key: string;
  owner: string;
  expiresAt: number;
  renewals: number;
  active: boolean;
}

export interface Lease {
  acquire(key: string, owner: string): boolean;
  renew(key: string, owner: string): boolean;
  release(key: string, owner: string): boolean;
  isHeld(key: string, owner?: string): boolean;
  getState(key: string): LeaseState | undefined;
  prune(): void;
}

const store = new Map<string, LeaseState>();

function isExpired(state: LeaseState): boolean {
  return Date.now() > state.expiresAt;
}

export function createLease(ttlMs: number): Lease {
  function acquire(key: string, owner: string): boolean {
    const existing = store.get(key);
    if (existing && !isExpired(existing)) return false;
    store.set(key, {
      key,
      owner,
      expiresAt: Date.now() + ttlMs,
      renewals: 0,
      active: true,
    });
    return true;
  }

  function renew(key: string, owner: string): boolean {
    const state = store.get(key);
    if (!state || state.owner !== owner || isExpired(state)) return false;
    state.expiresAt = Date.now() + ttlMs;
    state.renewals += 1;
    return true;
  }

  function release(key: string, owner: string): boolean {
    const state = store.get(key);
    if (!state || state.owner !== owner) return false;
    store.delete(key);
    return true;
  }

  function isHeld(key: string, owner?: string): boolean {
    const state = store.get(key);
    if (!state || isExpired(state)) return false;
    return owner === undefined ? true : state.owner === owner;
  }

  function getState(key: string): LeaseState | undefined {
    const state = store.get(key);
    if (!state) return undefined;
    return { ...state, active: !isExpired(state) };
  }

  function prune(): void {
    for (const [key, state] of store.entries()) {
      if (isExpired(state)) store.delete(key);
    }
  }

  return { acquire, renew, release, isHeld, getState, prune };
}
