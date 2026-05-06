# Snapshot

The **snapshot** module lets you capture, store, and restore API responses for offline support, testing, and performance optimisation.

## Concepts

| Term | Description |
|------|-------------|
| `Snapshot<T>` | A captured response with metadata (key, data, timestamps) |
| `SnapshotStore<T>` | Interface for pluggable storage backends |
| `captureSnapshot` | Creates a snapshot from raw data with optional TTL |
| `resolveSnapshot` | Loads a snapshot, evicting it if expired |

## Quick Start

```ts
import { createMemoryStore, captureSnapshot, resolveSnapshot } from "briefcase-api/snapshot";
import { buildSnapshotOptions, buildSnapshotKey } from "briefcase-api/snapshot.config";

const opts = buildSnapshotOptions({ preset: "session" });
const key = buildSnapshotKey(opts.keyPrefix, "users", "page-1");

// Capture
const snap = captureSnapshot(key, responseData, opts.ttlMs);
opts.store.save(snap);

// Restore
const cached = resolveSnapshot(opts.store, key);
if (cached) {
  console.log("Serving from snapshot", cached);
}
```

## Presets

| Preset | TTL | Use case |
|--------|-----|----------|
| `ephemeral` | 30 s | Short-lived UI caching |
| `session` | 5 min | Per-session API caching |
| `persistent` | none | Offline / test fixtures |

## Custom Store

Implement `SnapshotStore<T>` to back snapshots with `localStorage`, a database, or any other medium:

```ts
const store: SnapshotStore<MyData> = {
  save(snapshot) { localStorage.setItem(snapshot.key, JSON.stringify(snapshot)); },
  load(key) { const raw = localStorage.getItem(key); return raw ? JSON.parse(raw) : undefined; },
  remove(key) { localStorage.removeItem(key); },
  clear() { localStorage.clear(); },
  keys() { return Object.keys(localStorage); },
};
```
