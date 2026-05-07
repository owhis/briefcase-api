export interface TimeoutHandle {
  id: ReturnType<typeof setTimeout>;
  cancel: () => void;
  expired: boolean;
}

export interface TimeoutState {
  active: number;
  cancelled: number;
  expired: number;
}

const state: TimeoutState = { active: 0, cancelled: 0, expired: 0 };

export function createTimeout(ms: number): Promise<never> & { cancel: () => void } {
  let cancel!: () => void;

  const promise = new Promise<never>((_, reject) => {
    const id = setTimeout(() => {
      state.active--;
      state.expired++;
      reject(new TimeoutError(`Request timed out after ${ms}ms`));
    }, ms);

    state.active++;

    cancel = () => {
      clearTimeout(id);
      state.active--;
      state.cancelled++;
    };
  }) as Promise<never> & { cancel: () => void };

  promise.cancel = cancel;
  return promise;
}

export function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
  const timeout = createTimeout(ms);
  return Promise.race([promise, timeout]).then(
    (result) => { timeout.cancel(); return result; },
    (err) => { if (!(err instanceof TimeoutError)) timeout.cancel(); throw err; }
  );
}

export function getTimeoutState(): Readonly<TimeoutState> {
  return { ...state };
}

export function resetTimeoutState(): void {
  state.active = 0;
  state.cancelled = 0;
  state.expired = 0;
}

export class TimeoutError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'TimeoutError';
  }
}
