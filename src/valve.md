# valve

A **valve** controls whether async tasks are allowed to proceed. When the valve is **closed**, tasks queue up and wait. When it is **opened**, all waiting tasks are released in order.

## Usage

```ts
import { createValve } from "./valve";

const valve = createValve(false); // start closed

// Tasks will wait until the valve opens
valve.pass(() => fetch("/api/data")).then(console.log);

// Later — open the valve to let tasks through
valve.open();
```

## API

### `createValve(initiallyOpen?: boolean): Valve`

Creates a new valve instance.

| Method | Description |
|---|---|
| `open()` | Opens the valve; releases all waiting tasks |
| `close()` | Closes the valve; new tasks will wait |
| `isOpen()` | Returns current open state |
| `pass<T>(fn)` | Runs `fn` once the valve is open |
| `getState()` | Returns `{ open, waiting, processed }` |
| `drain()` | Resolves when the valve is open |

## Configuration

Use `buildValveOptions` and presets from `valve.config.ts`:

```ts
import { getValvePreset, buildValveOptions } from "./valve.config";

const opts = getValvePreset("gated");
const valve = createValve(opts.initiallyOpen);
```

### Presets

| Name | `initiallyOpen` |
|---|---|
| `default` | `true` |
| `paused` | `false` |
| `gated` | `false` |
