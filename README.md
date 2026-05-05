# briefcase-api

> Lightweight wrapper library for managing paginated REST API requests with retry and caching logic.

---

## Installation

```bash
npm install briefcase-api
```

---

## Usage

```typescript
import { BriefcaseClient } from 'briefcase-api';

const client = new BriefcaseClient({
  baseUrl: 'https://api.example.com',
  retry: { attempts: 3, delay: 500 },
  cache: { ttl: 60000 },
});

// Fetch all pages automatically
const results = await client.fetchAll<User>('/users', {
  pageParam: 'page',
  limitParam: 'limit',
  limit: 50,
});

console.log(results); // Flattened array of all paginated results
```

### Options

| Option | Type | Description |
|---|---|---|
| `baseUrl` | `string` | Base URL for all requests |
| `retry.attempts` | `number` | Number of retry attempts on failure |
| `retry.delay` | `number` | Delay in ms between retries |
| `cache.ttl` | `number` | Cache time-to-live in milliseconds |

---

## Features

- 📄 Automatic pagination handling
- 🔁 Configurable retry logic with exponential backoff
- ⚡ Built-in response caching
- 🔒 Fully typed with TypeScript

---

## License

[MIT](./LICENSE)