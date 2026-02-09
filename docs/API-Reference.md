# API Reference

`env-drift-check` exports several functions for programmatic use in Node.js applications.

## Usage

```javascript
const { checkDrift, loadConfig, parseEnv } = require('env-drift-check');
// or
import { checkDrift, loadConfig, parseEnv } from 'env-drift-check';
```

## Functions

### `checkDrift(base, target, config)`
Compares two environment sets and applies validation rules.
- **base**: `Record<string, string>` - The template (e.g., from `.env.example`).
- **target**: `Record<string, string>` - The actual environment (e.g., from `.env`).
- **config**: `Config` - The configuration object.

**Returns:** `DriftResult` object containing `missing`, `extra`, `errors`, `warnings`, and `mismatches`.

### `loadConfig(configPath?)`
Loads configuration from `envwise.config.json` or a custom path.
- **configPath**: `string` (optional) - Custom path to config file.

**Returns:** `Promise<Config>`.

### `parseEnv(content)`
Parses a string content of a `.env` file into a key-value object.
- **content**: `string` - Raw `.env` file content.

**Returns:** `Record<string, string>`.

## Types

Refer to [src/types.ts](file:///d:/Personal/env-drift-check/src/types.ts) for detailed TypeScript interfaces.
