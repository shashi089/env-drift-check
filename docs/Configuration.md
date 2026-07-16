# Configuration Guide

Define validation rules, defaults, and tool behavior in `envwise.config.json` (or `envwise.config.js` for dynamic configs).

The config file is optional — `env-drift-check` works with zero configuration.

---

## Top-Level Fields

```json
{
  "baseEnv": ".env.example",
  "framework": "auto",
  "includeSystemEnv": false,
  "extends": "../base.config.json",
  "rules": {}
}
```

| Field | Type | Default | Description |
|---|---|---|---|
| `baseEnv` | `string` | `.env.example` | Template file to compare against |
| `framework` | `string` | `"auto"` | Framework for prefix-safety warnings: `"auto"`, `"nextjs"`, `"vite"`, `"cra"`, or `"none"` |
| `includeSystemEnv` | `boolean` | `false` | Fall back to `process.env` for container/serverless environments |
| `extends` | `string` | — | Path to a parent config to inherit from. Child rules override parent rules on conflict. |

### Config Inheritance (`extends`)

```json
// base.config.json
{
  "rules": {
    "PORT": { "type": "number", "min": 1024 },
    "LOG_LEVEL": { "type": "enum", "values": ["debug", "info", "warn", "error"] }
  }
}
```

```json
// production.config.json
{
  "extends": "./base.config.json",
  "rules": {
    "PORT": { "type": "number", "min": 1024, "max": 65535 },
    "DATABASE_URL": { "type": "url", "required": true }
  }
}
```

Rules are deep-merged: `production.config.json` inherits `LOG_LEVEL` from the base and overrides `PORT` with stricter bounds. Circular references are detected and exit with an error.

---

## Rule Options

Each key in `"rules"` maps to a rule object:

```json
{
  "rules": {
    "KEY_NAME": {
      "type": "string",
      "required": true,
      "description": "Short explanation"
    }
  }
}
```

### Common Options

| Option | Type | Description |
|---|---|---|
| `type` | `string` | Validation type (see below) |
| `required` | `boolean` | Whether the key must be present. Default: `true` |
| `requiredIf` | `object` | Make the key required only when another key has a specific value |
| `default` | `string` | Default value — key is never reported missing if a default is set |
| `description` | `string` | Shown during interactive setup (`-i`) |
| `deprecated` | `boolean \| string` | Emits a deprecation warning. Pass a string for a migration message |
| `checkSecretStrength` | `boolean` | Enforces entropy-based secret strength. Auto-enabled for keys matching `*SECRET*`, `*PASSWORD*`, etc. |

---

## Validation Types

### `string`
Validates the value is a non-empty string.
- `min` — Minimum character length
- `max` — Maximum character length

### `number`
Validates the value parses as a finite number.
- `min` — Minimum numeric value
- `max` — Maximum numeric value

### `boolean`
Validates the value is exactly `"true"` or `"false"`.
- `mustBeFalseIn` — Environment name (`NODE_ENV`) where this must be `false` (e.g., `"production"`)
- `mustBeTrueIn` — Environment name where this must be `true` (e.g., `"production"`)

### `enum`
Restricts the value to a predefined set.
- `values` — Array of allowed strings (required)

### `email`
Validates standard email format.

### `url`
Validates standard URL/URI structure.

### `regex`
Custom pattern matching.
- `regex` — Regular expression string (required)

---

## Advanced Examples

### Conditional rules (`requiredIf`)

Makes a key required only when another key has a specific value:

```json
{
  "rules": {
    "AUTH_TYPE": { "type": "enum", "values": ["local", "oauth"] },
    "OAUTH_CLIENT_ID": {
      "type": "string",
      "required": false,
      "requiredIf": { "AUTH_TYPE": "oauth" }
    },
    "OAUTH_CLIENT_SECRET": {
      "type": "string",
      "required": false,
      "requiredIf": { "AUTH_TYPE": "oauth" }
    }
  }
}
```

### Default values

Keys with a `default` are never reported as missing. The default is validated against all other rules:

```json
{
  "rules": {
    "PORT": { "type": "number", "min": 1024, "max": 65535, "default": "3000" },
    "LOG_LEVEL": { "type": "enum", "values": ["debug", "info", "warn"], "default": "info" }
  }
}
```

### Environment-gated boolean flags

```json
{
  "rules": {
    "DEBUG": {
      "type": "boolean",
      "mustBeFalseIn": "production"
    },
    "ENABLE_HTTPS": {
      "type": "boolean",
      "mustBeTrueIn": "production"
    }
  }
}
```

### Secret strength enforcement

```json
{
  "rules": {
    "API_SECRET": {
      "type": "string",
      "checkSecretStrength": true,
      "description": "Must be high-entropy — run: openssl rand -base64 32"
    }
  }
}
```

### Deprecation warnings

```json
{
  "rules": {
    "OLD_API_KEY": {
      "type": "string",
      "deprecated": "Migrate to NEW_API_KEY. See migration guide: https://docs.example.com/migrate"
    }
  }
}
```

---

## JS Config (`envwise.config.js`)

Use a `.js` config when you need comments or dynamic values:

```js
// envwise.config.js
module.exports = {
  baseEnv: ".env.example",
  rules: {
    PORT: { type: "number", min: 1024, default: process.env.PORT || "3000" },
    NODE_ENV: { type: "enum", values: ["development", "staging", "production"] }
  }
};
```

JSON takes priority over JS when both files exist.
