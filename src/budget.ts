/**
 * budget.ts — Track and enforce request cost budgets (e.g. token, credit, or call limits).
 */

export interface BudgetState {
  used: number;
  limit: number;
  remaining: number;
  exhausted: boolean;
}

export interface Budget {
  consume(cost?: number): boolean;
  refund(cost?: number): void;
  reset(): void;
  getState(): BudgetState;
}

export interface BudgetOptions {
  limit: number;
  initial?: number;
}

export function createBudget(options: BudgetOptions): Budget {
  const { limit, initial = 0 } = options;

  if (limit <= 0) throw new Error("Budget limit must be greater than zero");

  let used = initial;

  function getState(): BudgetState {
    return {
      used,
      limit,
      remaining: Math.max(0, limit - used),
      exhausted: used >= limit,
    };
  }

  function consume(cost = 1): boolean {
    if (used + cost > limit) return false;
    used += cost;
    return true;
  }

  function refund(cost = 1): void {
    used = Math.max(0, used - cost);
  }

  function reset(): void {
    used = 0;
  }

  return { consume, refund, reset, getState };
}
