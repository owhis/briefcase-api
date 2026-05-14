/**
 * slot.ts — A named reservation slot with expiry and claim logic.
 * Useful for coordinating exclusive access to a resource across async operations.
 */

export interface SlotOptions {
  ttl: number; // ms until an unclaimed slot expires
  maxClaims: number;
}

export interface SlotState {
  name: string;
  claims: number;
  maxClaims: number;
  expiresAt: number | null;
  expired: boolean;
  available: boolean;
}

export interface Slot {
  claim(): boolean;
  release(): void;
  reset(): void;
  isAvailable(): boolean;
  getState(): SlotState;
}

export function createSlot(name: string, options: SlotOptions): Slot {
  const { ttl, maxClaims } = options;

  let claims = 0;
  let expiresAt: number | null = null;

  function isExpired(): boolean {
    return expiresAt !== null && Date.now() > expiresAt;
  }

  function claim(): boolean {
    if (isExpired()) {
      claims = 0;
      expiresAt = null;
    }
    if (claims >= maxClaims) return false;
    claims++;
    if (expiresAt === null) {
      expiresAt = Date.now() + ttl;
    }
    return true;
  }

  function release(): void {
    if (claims > 0) claims--;
    if (claims === 0) expiresAt = null;
  }

  function reset(): void {
    claims = 0;
    expiresAt = null;
  }

  function isAvailable(): boolean {
    if (isExpired()) {
      claims = 0;
      expiresAt = null;
    }
    return claims < maxClaims;
  }

  function getState(): SlotState {
    const expired = isExpired();
    return {
      name,
      claims: expired ? 0 : claims,
      maxClaims,
      expiresAt: expired ? null : expiresAt,
      expired,
      available: expired || claims < maxClaims,
    };
  }

  return { claim, release, reset, isAvailable, getState };
}
