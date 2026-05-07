# hedge

A **hedged request** strategy that fires a speculative duplicate request if the primary doesn't respond within a configurable delay, returning whichever resolves first.

## Usage

```ts
import { createHedge } from './hedge';
import { buildHedgeOptions } from './hedge.config';

const opts = buildHedgeOptions({ delayMs: 100 });

const handle = createHedge(
  () => fetch('/api/data').then((r) => r.json()),
  opts.delayMs
);

const data = await handle.result;
console.log(handle.state()); // { attempts: 1 | 2, hedged: boolean, winner: 'primary' | 'hedge' }
```

## API

### `createHedge<T>(fn, delayMs)`

| Param | Type | Description |
|-------|------|-------------|
| `fn` | `() => Promise<T>` | The request factory (called once or twice) |
| `delayMs` | `number` | Milliseconds before the hedge fires |

Returns a `HedgeHandle<T>` with:
- **`result`** — `Promise<T>` that resolves as soon as either attempt succeeds.
- **`state()`** — Snapshot of `{ attempts, hedged, winner }`.

## Presets

| Name | `delayMs` |
|------|-----------|
| `fast` | 50 ms |
| `balanced` | 150 ms |
| `conservative` | 400 ms |

## When to use

Hedging is useful when tail latencies (p99) are high but the median is acceptable. It trades a small increase in total requests for a significant reduction in worst-case response time.
