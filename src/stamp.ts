/**
 * stamp.ts — Lightweight timestamping utility for tracking event timing and durations.
 */

export interface StampEntry {
  label: string;
  ts: number;
}

export interface StampState {
  entries: StampEntry[];
  startedAt: number | null;
}

export interface Stamp {
  mark: (label: string) => void;
  elapsed: (from?: string, to?: string) => number | null;
  getState: () => StampState;
  reset: () => void;
  toLog: () => string[];
}

export function createStamp(): Stamp {
  let entries: StampEntry[] = [];
  let startedAt: number | null = null;

  function mark(label: string): void {
    const ts = Date.now();
    if (startedAt === null) {
      startedAt = ts;
    }
    entries.push({ label, ts });
  }

  function elapsed(from?: string, to?: string): number | null {
    if (entries.length === 0) return null;

    const fromEntry = from
      ? entries.find((e) => e.label === from)
      : entries[0];
    const toEntry = to
      ? entries.find((e) => e.label === to)
      : entries[entries.length - 1];

    if (!fromEntry || !toEntry) return null;
    return toEntry.ts - fromEntry.ts;
  }

  function getState(): StampState {
    return { entries: [...entries], startedAt };
  }

  function reset(): void {
    entries = [];
    startedAt = null;
  }

  function toLog(): string[] {
    return entries.map((e, i) => {
      const prev = i > 0 ? entries[i - 1].ts : e.ts;
      const delta = e.ts - prev;
      return `[${e.label}] +${delta}ms (t=${e.ts})`;
    });
  }

  return { mark, elapsed, getState, reset, toLog };
}
