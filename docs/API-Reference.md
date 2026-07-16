# API Reference

`env-drift-check` exports functions for programmatic use in Node.js applications. This enables fail-fast startup validation, CI integrations, and custom tooling.

## Installation

```bash
npm install env-drift-check
```

## Usage

```javascript
const { checkDrift, loadConfig, parseEnv, report } = require('env-drift-check');
// or
import { checkDrift, loadConfig, parseEnv, report } from 'env-drift-check';
```

---

## Functions

### `loadConfig()`

Loads configuration from `envwise.config.json` or `envwise.config.js` in the current working directory. Resolves `extends` inheritance chains and merges with defaults.

```typescript
function loadConfig(): Config
```

**Returns:** `Config` — the merged configuration object.

---

### `loadConfigFrom(dir)`

Same as `loadConfig()` but reads config from a specific directory. Used by the monorepo command to load per-package configs.

```typescript
function loadConfigFrom(dir: string): Config
```

- **`dir`** — Absolute path to the directory containing `envwise.config.json` / `envwise.config.js`.

**Returns:** `Config`.

---

### `parseEnv(filePath)`

Parses a `.env` file from disk into a key-value map.

```typescript
function parseEnv(filePath: string): Record<string, string>
```

- **`filePath`** — Absolute path to the `.env` file.

**Returns:** `Record<string, string>` — parsed key-value pairs.

**Throws** if the file does not exist.

---

### `checkDrift(base, target, config)`

Compares two environment sets and applies all schema validation rules.

```typescript
function checkDrift(
  base: Record<string, string>,
  target: Record<string, string>,
  config: Config
): DriftResult
```

- **`base`** — Template key-value map (e.g., from `.env.example`).
- **`target`** — Actual environment key-value map (e.g., from `.env`).
- **`config`** — Configuration object from `loadConfig()`.

**Returns:** `DriftResult`.

---

### `report(result)`

Prints a formatted drift report to the console.

```typescript
function report(result: DriftResult): void
```

- **`result`** — `DriftResult` from `checkDrift()`.

---

## Types

### `Config`

```typescript
interface Config {
  baseEnv?: string;
  rules?: Record<string, Rule>;
  includeSystemEnv?: boolean;
  framework?: "nextjs" | "vite" | "cra" | "auto" | "none";
  extends?: string;
}
```

### `Rule`

```typescript
interface Rule {
  type: "string" | "number" | "boolean" | "enum" | "email" | "url" | "regex";
  values?: string[];
  regex?: string;
  min?: number;
  max?: number;
  description?: string;
  required?: boolean;
  requiredIf?: Record<string, string>;
  default?: string;
  mustBeFalseIn?: string;
  mustBeTrueIn?: string;
  checkSecretStrength?: boolean;
  deprecated?: boolean | string;
}
```

### `DriftResult`

```typescript
interface DriftResult {
  missing: string[];
  extra: string[];
  errors: { key: string; message: string }[];
  warnings: string[];
  mismatches: ValueMismatch[];
}

interface ValueMismatch {
  key: string;
  expected: string;
  actual: string;
}
```

---

## Example: Fail-Fast Bootstrap

Validate the environment before any application logic runs:

```javascript
const { checkDrift, parseEnv, loadConfig, report } = require('env-drift-check');
const path = require('path');

function bootstrap() {
  const config = loadConfig();
  const base = parseEnv(path.resolve(__dirname, '../.env.example'));

  let target;
  try {
    target = parseEnv(path.resolve(__dirname, '../.env'));
  } catch {
    console.error('❌ .env file is missing. Run: npx env-drift-check -i');
    process.exit(1);
  }

  const result = checkDrift(base, target, config);

  if (result.missing.length || result.errors.length) {
    report(result);
    process.exit(1);
  }
}

module.exports = bootstrap;
```

---

## Example: Monorepo Per-Package Validation

```javascript
const { loadConfigFrom, parseEnv, checkDrift } = require('env-drift-check');
const path = require('path');

function validatePackage(pkgDir) {
  const config = loadConfigFrom(pkgDir);
  const base = parseEnv(path.join(pkgDir, config.baseEnv || '.env.example'));
  const target = parseEnv(path.join(pkgDir, '.env'));
  return checkDrift(base, target, config);
}
```

---

See [src/types.ts](../src/types.ts) for the authoritative TypeScript source of all interfaces.
