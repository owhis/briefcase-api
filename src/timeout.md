# timeout

Lightweight per-request timeout utility for `briefcase-api`.

## Overview

Provides `withTimeout` to race any promise against a deadline, and `createTimeout` for manual control. Integrates with middleware and circuit-breaker layers.

## API

### `withTimeout<T>(promise, ms)`

Races `promise` against a timer of `ms` milliseconds. Cancels the timer automatically on resolution or non-timeout rejection.

```ts
const data = await withTimeout(fetch('/api/items'), 5_000);
```

### `createTimeout(ms)`

Returns a `Promise<never>` that rejects with `TimeoutError` after `ms` ms. Exposes `.cancel()` for cleanup.

### `TimeoutError`

Extends `Error` with `name = 'TimeoutError'`. Use `instanceof TimeoutError` to distinguish timeout failures from other errors.

### `getTimeoutState()` / `resetTimeoutState()`

Inspect or reset the module-level counters (`active`, `cancelled`, `expired`) — useful in tests.

## Configuration

```ts
import { buildTimeoutOptions } from './timeout.config';

const opts = buildTimeoutOptions('strict');  // { ms: 1_000 }
const opts2 = buildTimeoutOptions({ ms: 8_000 });
```

### Presets

| Name      | ms      |
|-----------|---------|
| `strict`  | 1 000   |
| `default` | 5 000   |
| `relaxed` | 15 000  |
| `long`    | 30 000  |
