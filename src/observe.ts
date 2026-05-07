export type ObserverEvent = "request" | "response" | "error" | "retry" | "cache-hit" | "cache-miss";

export interface ObserverPayload {
  event: ObserverEvent;
  url: string;
  timestamp: number;
  meta?: Record<string, unknown>;
}

export type ObserverHandler = (payload: ObserverPayload) => void;

export interface Observer {
  on(event: ObserverEvent, handler: ObserverHandler): void;
  off(event: ObserverEvent, handler: ObserverHandler): void;
  emit(event: ObserverEvent, url: string, meta?: Record<string, unknown>): void;
  clear(): void;
  listenerCount(event: ObserverEvent): number;
}

export function createObserver(): Observer {
  const listeners = new Map<ObserverEvent, Set<ObserverHandler>>();

  function getSet(event: ObserverEvent): Set<ObserverHandler> {
    if (!listeners.has(event)) listeners.set(event, new Set());
    return listeners.get(event)!;
  }

  return {
    on(event, handler) {
      getSet(event).add(handler);
    },
    off(event, handler) {
      getSet(event).delete(handler);
    },
    emit(event, url, meta) {
      const payload: ObserverPayload = { event, url, timestamp: Date.now(), meta };
      for (const handler of getSet(event)) {
        try {
          handler(payload);
        } catch {
          // handlers must not throw
        }
      }
    },
    clear() {
      listeners.clear();
    },
    listenerCount(event) {
      return listeners.get(event)?.size ?? 0;
    },
  };
}
