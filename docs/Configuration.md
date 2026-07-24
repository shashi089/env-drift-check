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
| `framework` | `string` | `"auto"` | Framework for prefix-safety: `"auto"`, `"nextjs"`, `"vite"`, `"cra"`, or `"none"` |
| `includeSystemEnv` | `boolean` | `false` | Fall back to `process.env` for container/serverless environments |
| `extends` | `string` | — | Path to a parent config to inherit from. Child rules override parent on conflict. |

### Config Inheritance (`extends`)

```json
// base.config.json
{
  "rules": {
    "NODE_ENV": { "type": "enum", "values": ["development", "staging", "production"] },
    "LOG_LEVEL": { "type": "enum", "values": ["debug", "info", "warn", "error"] }
  }
}
```

```json
// production.config.json
{
  "extends": "./base.config.json",
  "rules": {
    "DATABASE_URL": { "type": "url", "required": true },
    "PORT": { "type": "number", "min": 1024, "max": 65535 }
  }
}
```

`production.config.json` inherits `NODE_ENV` and `LOG_LEVEL` from the base and adds its own rules. Circular references are detected and exit with an error.

---

## Rule Options

| Option | Type | Description |
|---|---|---|
| `type` | `string` | Validation type (see below) |
| `required` | `boolean` | Whether the key must be present. Default: `true` |
| `requiredIf` | `object` | Make the key required only when another key has a specific value |
| `default` | `string` | Default value — key is never reported missing if a default is set |
| `description` | `string` | Shown during interactive setup (`-i`) |
| `deprecated` | `boolean \| string` | Emits a deprecation warning. Pass a string for a migration message |
| `checkSecretStrength` | `boolean` | Enforces entropy-based secret strength. Auto-enabled for keys matching `*SECRET*`, `*PASSWORD*` |

---

## Validation Types

### `string`
- `min` — Minimum character length
- `max` — Maximum character length

### `number`
- `min` — Minimum numeric value
- `max` — Maximum numeric value

### `boolean`
- `mustBeFalseIn` — Environment name where this must be `false` (e.g. `"production"`)
- `mustBeTrueIn` — Environment name where this must be `true` (e.g. `"production"`)

### `enum`
- `values` — Array of allowed strings (required)

### `email`
Standard email format.

### `url`
Standard URL/URI structure.

### `regex`
- `regex` — Regular expression string (required)

---

## Examples

### Conditional rules (`requiredIf`)

```json
{
  "rules": {
    "AUTH_TYPE": { "type": "enum", "values": ["local", "oauth"] },
    "OAUTH_CLIENT_ID": {
      "type": "string",
      "required": false,
      "requiredIf": { "AUTH_TYPE": "oauth" }
    }
  }
}
```

### Default values

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
    "DEBUG": { "type": "boolean", "mustBeFalseIn": "production" },
    "ENABLE_HTTPS": { "type": "boolean", "mustBeTrueIn": "production" }
  }
}
```

### Deprecation warning

```json
{
  "rules": {
    "OLD_API_KEY": {
      "type": "string",
      "deprecated": "Migrate to NEW_API_KEY."
    }
  }
}
```

---

## JS Config (`envwise.config.js`)

Use a `.js` config for comments or dynamic values:

```js
module.exports = {
  baseEnv: ".env.example",
  rules: {
    PORT: { type: "number", min: 1024, default: "3000" },
    NODE_ENV: { type: "enum", values: ["development", "staging", "production"] }
  }
};
```

JSON takes priority over JS when both files exist.
