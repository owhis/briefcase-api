export interface TraceSpan {
  id: string;
  name: string;
  startedAt: number;
  endedAt?: number;
  duration?: number;
  tags: Record<string, string | number | boolean>;
  error?: string;
}

export interface TraceState {
  spans: TraceSpan[];
  active: number;
  completed: number;
}

let _counter = 0;
function nextId(): string {
  return `span-${Date.now()}-${++_counter}`;
}

export function createTrace() {
  const spans: Map<string, TraceSpan> = new Map();

  function start(name: string, tags: Record<string, string | number | boolean> = {}): string {
    const id = nextId();
    spans.set(id, { id, name, startedAt: Date.now(), tags });
    return id;
  }

  function end(id: string, error?: string): TraceSpan | undefined {
    const span = spans.get(id);
    if (!span) return undefined;
    const endedAt = Date.now();
    const completed: TraceSpan = {
      ...span,
      endedAt,
      duration: endedAt - span.startedAt,
      ...(error ? { error } : {}),
    };
    spans.set(id, completed);
    return completed;
  }

  function tag(id: string, key: string, value: string | number | boolean): void {
    const span = spans.get(id);
    if (span) span.tags[key] = value;
  }

  function getSpan(id: string): TraceSpan | undefined {
    return spans.get(id);
  }

  function getState(): TraceState {
    const all = Array.from(spans.values());
    return {
      spans: all,
      active: all.filter((s) => s.endedAt === undefined).length,
      completed: all.filter((s) => s.endedAt !== undefined).length,
    };
  }

  function reset(): void {
    spans.clear();
  }

  return { start, end, tag, getSpan, getState, reset };
}
