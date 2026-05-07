export interface QueueTask<T> {
  id: string;
  run: () => Promise<T>;
  priority: number;
  addedAt: number;
}

export interface QueueState {
  pending: number;
  running: number;
  completed: number;
  failed: number;
}

export interface Queue<T> {
  enqueue: (task: Omit<QueueTask<T>, 'addedAt'>) => Promise<T>;
  getState: () => QueueState;
  clear: () => void;
  drain: () => Promise<void>;
}

export function createQueue<T>(concurrency = 1): Queue<T> {
  const pending: Array<QueueTask<T> & { resolve: (v: T) => void; reject: (e: unknown) => void }> = [];
  let running = 0;
  let completed = 0;
  let failed = 0;

  function getState(): QueueState {
    return { pending: pending.length, running, completed, failed };
  }

  function clear(): void {
    pending.length = 0;
  }

  async function drain(): Promise<void> {
    while (pending.length > 0 || running > 0) {
      await new Promise<void>(r => setTimeout(r, 10));
    }
  }

  function tick(): void {
    while (running < concurrency && pending.length > 0) {
      pending.sort((a, b) => b.priority - a.priority || a.addedAt - b.addedAt);
      const task = pending.shift()!;
      running++;
      task
        .run()
        .then(result => {
          completed++;
          task.resolve(result);
        })
        .catch(err => {
          failed++;
          task.reject(err);
        })
        .finally(() => {
          running--;
          tick();
        });
    }
  }

  function enqueue(task: Omit<QueueTask<T>, 'addedAt'>): Promise<T> {
    return new Promise<T>((resolve, reject) => {
      pending.push({ ...task, addedAt: Date.now(), resolve, reject });
      tick();
    });
  }

  return { enqueue, getState, clear, drain };
}
