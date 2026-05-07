# Budget

The **budget** module lets you cap the total cost of requests made through the library. Cost can represent API credits, tokens, call counts, or any other numeric unit.

## Usage

```ts
import { createBudget } from "briefcase-api";

const budget = createBudget({ limit: 500 });

// Before each request, attempt to consume cost units
if (!budget.consume(10)) {
  throw new Error("Budget exhausted");
}

// Refund on failure or cancellation
budget.refund(10);

// Inspect state at any time
const { used, remaining, exhausted } = budget.getState();
```

## Options

| Option    | Type     | Default | Description                          |
|-----------|----------|---------|--------------------------------------|
| `limit`   | `number` | —       | Maximum total cost allowed           |
| `initial` | `number` | `0`     | Pre-consumed cost at creation time   |

## Presets

Use `buildBudgetOptions` with a named preset for quick setup:

```ts
import { buildBudgetOptions } from "briefcase-api";

const opts = buildBudgetOptions({ preset: "small" });   // limit: 100
const opts = buildBudgetOptions({ preset: "medium" });  // limit: 1 000
const opts = buildBudgetOptions({ preset: "large" });   // limit: 10 000
```

## API

- `consume(cost?: number): boolean` — Deduct cost; returns `false` if it would exceed the limit.
- `refund(cost?: number): void` — Return cost units (floors at 0).
- `reset(): void` — Clear all usage.
- `getState(): BudgetState` — Return `{ used, limit, remaining, exhausted }`.
