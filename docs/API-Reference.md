# API Reference

`env-drift-check` exports functions for programmatic use in Node.js applications.

## Usage

```javascript
const { checkDrift, loadConfig, parseEnv, report } = require('env-drift-check');
// or
import { checkDrift, loadConfig, parseEnv, report } from 'env-drift-check';
```

---

## Functions

### `loadConfig()`

Loads `envwise.config.json` or `envwise.config.js` from the current working directory. Resolves `extends` chains and merges with defaults. Synchronous.

```typescript
function loadConfig(): Config
```

### `loadConfigFrom(dir)`

Same as `loadConfig()` but reads config from a specific directory. Used by the monorepo command for per-package configs.

```typescript
function loadConfigFrom(dir: string): Config
```

### `parseEnv(filePath)`

Parses a `.env` file from disk into a key-value map. Throws if the file does not exist.

```typescript
function parseEnv(filePath: string): Record<string, string>
```

### `checkDrift(base, target, config)`

Compares two environment sets and applies all schema validation rules.

```typescript
function checkDrift(
  base: Record<string, string>,
  target: Record<string, string>,
  config: Config
): DriftResult
```

### `report(result)`

Prints a formatted drift report to the console.

```typescript
function report(result: DriftResult): void
```

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
```

---

## Example: Fail-Fast Bootstrap

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

See [src/types.ts](../src/types.ts) for the authoritative TypeScript source.
