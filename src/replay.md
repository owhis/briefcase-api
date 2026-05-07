# replay

Record and replay HTTP request/response pairs. Useful for offline development, deterministic testing, and golden-file workflows.

## Modes

| Mode | Behaviour |
|---|---|
| `record` | Captures responses into the in-memory store |
| `replay` | Returns stored responses; throws if a key is missing |
| `passthrough` | Does nothing — requests flow through normally |

## Basic usage

```ts
import { createReplay, record, replay } from "briefcase-api/replay";
import { buildReplayKey } from "briefcase-api/replay.config";

const store = createReplay<User[]>("record");
const key = buildReplayKey("/api/users", "GET", "test");

// During recording:
const users = await fetchUsers();
record(store, key, { url: "/api/users", method: "GET" }, users);

// During replay:
const cached = replay(store, key); // User[] | undefined
```

## Configuration

```ts
import { buildReplayOptions, getReplayPreset } from "briefcase-api/replay.config";

const opts = getReplayPreset("test");
// { mode: "replay", keyPrefix: "test", maxEntries: 500 }

const custom = buildReplayOptions({ mode: "record", maxEntries: 100 });
```

## API

- `createReplay(mode?)` — create a new store
- `record(store, key, request, response)` — save an entry
- `replay(store, key)` — retrieve a saved response
- `hasEntry(store, key)` — check existence
- `clearEntry(store, key)` — remove one entry
- `clearAll(store)` — remove all entries
- `listEntries(store)` — enumerate all entries
