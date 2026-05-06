# Fallback Module

The `fallback` module provides a lightweight mechanism to recover from failed async operations by supplying a static value or a dynamic fallback function.

## Usage

```typescript
import { createFallback } from './fallback';
import { buildFallbackOptions } from './fallback.config';

const opts = buildFallbackOptions({ fallbackValue: [] }, 'verbose');
const fb = createFallback(opts);

const state = await fb.run(() => fetch('/api/items').then(r => r.json()));
const items = fb.resolve(state); // [] if request failed
```

## API

### `createFallback<T>(options)`

Returns `{ run, resolve }`.

- **`run(primary)`** — Executes `primary()`. On failure, evaluates fallback eligibility and returns a `FallbackState<T>`.
- **`resolve(state)`** — Extracts the resolved value from a `FallbackState<T>`.

### `FallbackOptions<T>`

| Option | Type | Description |
|---|---|---|
| `fallbackValue` | `T` | Static value returned on failure |
| `fallbackFn` | `(err) => T \| Promise<T>` | Dynamic fallback (mutually exclusive with `fallbackValue`) |
| `onFallback` | `(err) => void` | Called when fallback is triggered |
| `shouldFallback` | `(err) => boolean` | Controls whether fallback is eligible |

## Presets

| Name | Description |
|---|---|
| `silent` | Always falls back, suppresses logging |
| `strict` | Only falls back on `NetworkError` messages |
| `verbose` | Always falls back, logs a warning via `console.warn` |
