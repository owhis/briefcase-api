import type { ObserverEvent } from "./observe";

export interface ObserveOptions {
  events: ObserverEvent[];
  includeTimestamp: boolean;
  namespace?: string;
}

const ALL_EVENTS: ObserverEvent[] = [
  "request",
  "response",
  "error",
  "retry",
  "cache-hit",
  "cache-miss",
];

const PRESETS: Record<string, Partial<ObserveOptions>> = {
  full: { events: ALL_EVENTS, includeTimestamp: true },
  errors: { events: ["error", "retry"], includeTimestamp: true },
  cache: { events: ["cache-hit", "cache-miss"], includeTimestamp: false },
  minimal: { events: ["request", "response"], includeTimestamp: false },
};

export function getObservePreset(name: string): Partial<ObserveOptions> {
  return PRESETS[name] ?? PRESETS["full"];
}

export function buildObserveOptions(
  overrides: Partial<ObserveOptions> = {}
): ObserveOptions {
  const base: ObserveOptions = {
    events: ALL_EVENTS,
    includeTimestamp: true,
  };
  return { ...base, ...overrides };
}

export function validateObserveOptions(options: ObserveOptions): void {
  if (!Array.isArray(options.events) || options.events.length === 0) {
    throw new Error("ObserveOptions: events must be a non-empty array");
  }
  const invalid = options.events.filter((e) => !ALL_EVENTS.includes(e));
  if (invalid.length > 0) {
    throw new Error(`ObserveOptions: unknown events: ${invalid.join(", ")}`);
  }
}

export function buildNamespacedEvent(
  event: ObserverEvent,
  namespace?: string
): string {
  return namespace ? `${namespace}:${event}` : event;
}
