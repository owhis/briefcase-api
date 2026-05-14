# shard

Distributes arbitrary string keys across a fixed number of buckets using a configurable hash function. Useful for partitioning cache namespaces, routing requests to worker pools, or sharding database connections.

## Usage

```ts
import { createShard } from "./shard";
import { buildShardOptions } from "./shard.config";

const shard = createShard(buildShardOptions({}, "medium"));

const bucket = shard.assign("user:42"); // e.g. 7
console.log(shard.lookup("user:42"));   // 7 (cached)
```

## API

### `createShard(options: ShardOptions): Shard`

| Option    | Type                        | Default         | Description                          |
|-----------|-----------------------------|-----------------|--------------------------------------|
| `buckets` | `number`                    | —               | Number of buckets (must be ≥ 1).     |
| `hash`    | `(key: string) => number`   | FNV-style hash  | Custom hash function (optional).     |

### Methods

- **`assign(key)`** — Map key to a bucket; subsequent calls return the same bucket.
- **`lookup(key)`** — Return the assigned bucket, or `undefined` if not yet assigned.
- **`getState()`** — Return a snapshot of current bucket count and all assignments.
- **`clear()`** — Remove all cached assignments.

## Presets

| Preset   | Buckets |
|----------|---------|
| `small`  | 4       |
| `medium` | 16      |
| `large`  | 64      |
| `xlarge` | 256     |
