# barrier

A **Barrier** is a synchronization primitive that blocks all callers until a fixed number of parties (`target`) have called `arrive()`. Once the target is reached every waiting promise resolves simultaneously and the barrier resets for the next generation.

## Usage

```ts
import { createBarrier } from './barrier';

const barrier = createBarrier(3);

async function worker(id: number) {
  console.log(`worker ${id} ready`);
  await barrier.arrive(); // blocks until all 3 workers arrive
  console.log(`worker ${id} proceeding`);
}

await Promise.all([worker(1), worker(2), worker(3)]);
```

## API

### `createBarrier(target: number): Barrier`

Creates a new barrier that waits for `target` parties.

| Method | Description |
|---|---|
| `arrive()` | Signals arrival; resolves when all parties have arrived |
| `remaining()` | Returns how many more parties are needed |
| `getState()` | Returns `{ count, target, generation, released }` |
| `reset()` | Forcibly releases all waiting parties and resets count |

## Presets

```ts
import { getBarrierPreset, buildBarrierOptions } from './barrier.config';

const opts = getBarrierPreset('quorum'); // target: 5
const custom = buildBarrierOptions({ target: 7, label: 'my-barrier' });
```

Available presets: `pair`, `trio`, `quorum`, `batch`.
