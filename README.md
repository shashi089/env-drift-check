# env-drift-check

<div align="center">

**Detect `.env` drift, enforce schema validation, scan your codebase, diff environments, and audit git safety — zero config required.**

[![npm version](https://img.shields.io/npm/v/env-drift-check.svg?style=flat-square)](https://npmjs.org/package/env-drift-check)
[![npm downloads](https://img.shields.io/npm/dm/env-drift-check.svg?style=flat-square)](https://npm-stat.com/charts.html?package=env-drift-check)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg?style=flat-square)](https://opensource.org/licenses/MIT)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-blue?style=flat-square&logo=typescript)](https://www.typescriptlang.org/)
[![Node.js](https://img.shields.io/badge/Node.js-%3E%3D16-green?style=flat-square&logo=node.js)](https://nodejs.org/)
[![Tests](https://img.shields.io/badge/tests-66%20passing-brightgreen?style=flat-square)](#)

</div>

<div align="center">
  <img src="https://github.com/shashi089/env-drift-check/raw/main/assets/env-drift-check.png" alt="env-drift-check CLI output" width="800" />
</div>

---

```bash
npx env-drift-check

✔ Loaded: .env
✔ Base: .env.example

✖ Missing keys:
  - DATABASE_URL
  - STRIPE_SECRET_KEY

⚠ Unused keys:
  - OLD_API_KEY

❌ Validation failed: PORT must be a number
```

Fix interactively:

```bash
npx env-drift-check -i
```

---

Missing environment variables crash apps in production. Wrong types create silent bugs. Leaked `.env` files in git history are a permanent problem. `env-drift-check` catches all of this from the CLI — without touching your application code.

- Compares `.env` against `.env.example` and reports missing, extra, and mismatched keys
- Validates values against a schema (type, range, pattern, enum, email, URL)
- Scans JS/TS source for `process.env.*` references — works even without a `.env` file
- Flags low-entropy secrets using Shannon entropy math
- Warns when `NEXT_PUBLIC_`, `VITE_`, or `REACT_APP_` prefixed variables look like server secrets
- Checks `.env` files against `.gitignore`, git tracking, and full git history
- Splits `.env` into Kubernetes ConfigMap + Secret YAML
- Validates `docker-compose.yml` environment blocks against your schema
- Validates across all packages in a monorepo with per-package config

---

## Installation

```bash
npm install --save-dev env-drift-check
```

Works with any Node.js ≥ 16 project.

---

## Commands

```bash
npx env-drift-check                          # compare .env against .env.example
npx env-drift-check --strict                 # exit 1 on any issue (CI/CD)
npx env-drift-check --system-env --strict    # validate process.env (containers/serverless)
npx env-drift-check --watch                  # re-validate on file save
npx env-drift-check --format json            # JSON output
npx env-drift-check --format sarif           # SARIF for GitHub Security tab
npx env-drift-check -i                       # interactive setup wizard

npx env-drift-check scan                     # report env references vs .env.example
npx env-drift-check scan --fix               # create/update .env.example from found keys

npx env-drift-check diff .env.staging .env.production    # side-by-side diff of two .env files
npx env-drift-check audit                                # check .env files for git tracking/history leaks
npx env-drift-check gen-example                          # generate .env.example from .env (strips values)
npx env-drift-check gen-configmap                        # split .env into K8s ConfigMap + Secret YAML
npx env-drift-check validate-compose                     # validate docker-compose.yml env blocks
npx env-drift-check monorepo --packages "packages/*"     # validate across all packages, aggregate results
npx env-drift-check init                                 # scaffold envwise.config.json + .env.example
```

---

## Configuration

`envwise.config.json` is optional. Add it when you need type validation or custom rules:

```json
{
  "baseEnv": ".env.example",
  "rules": {
    "PORT":         { "type": "number",  "min": 1024, "max": 65535 },
    "NODE_ENV":     { "type": "enum",    "values": ["development", "staging", "production"] },
    "DEBUG_MODE":   { "type": "boolean", "mustBeFalseIn": "production" },
    "DATABASE_URL": { "type": "url",     "required": true },
    "ADMIN_EMAIL":  { "type": "email" },
    "API_KEY":      { "type": "regex",   "regex": "^sk_(test|live)_[0-9a-zA-Z]{24}$" },
    "JWT_SECRET":   { "type": "string",  "checkSecretStrength": true },
    "OLD_KEY":      { "type": "string",  "deprecated": "Use NEW_KEY instead." }
  }
}
```

### Validation types

| Type | Options | Notes |
|---|---|---|
| `string` | `min`, `max`, `checkSecretStrength` | Entropy check auto-enabled for keys named `*SECRET*`, `*PASSWORD*` |
| `number` | `min`, `max` | |
| `boolean` | `mustBeFalseIn`, `mustBeTrueIn` | Enforce flags per environment |
| `enum` | `values: []` | |
| `email`, `url`, `regex` | `regex` for regex type | |

### Rule options

| Option | Description |
|---|---|
| `required` | Defaults to `true`. Set `false` to make optional. |
| `default` | Fallback value — key is never reported missing. |
| `requiredIf` | Required only when another key matches a value: `{ "STORAGE": "s3" }` |
| `deprecated` | Emits a warning. Pass a string for a migration message. |
| `description` | Shown in interactive prompts. |

### Config inheritance

```json
{
  "extends": "../base.config.json",
  "rules": {
    "DATABASE_URL": { "type": "url", "required": true }
  }
}
```

Child rules override parent on conflict. Circular references exit with an error.

---

## CI/CD

A ready-to-use workflow is at [`.github/workflows/env-check.yml`](.github/workflows/env-check.yml).

```yaml
- name: Check environment drift
  run: npx env-drift-check --system-env --strict
  env:
    DATABASE_URL: ${{ secrets.DATABASE_URL }}
    API_SECRET_KEY: ${{ secrets.API_SECRET_KEY }}
```

Or use the marketplace action:

```yaml
- uses: shashi089/env-drift-check@v1
  with:
    command: check
    strict: 'true'
```

### Pre-commit hook

```bash
npm install --save-dev husky
npx husky init
echo "npx env-drift-check --strict" > .husky/pre-commit
```

With lint-staged (only runs when `.env.example` or the config changes):

```json
{
  "lint-staged": {
    ".env.example": "npx env-drift-check --strict",
    "envwise.config.json": "npx env-drift-check --strict"
  }
}
```

---

## Programmatic usage

```typescript
import { checkDrift, loadConfig, parseEnv, report } from 'env-drift-check';

const config = loadConfig();
const base = parseEnv('.env.example');
const target = parseEnv('.env');

const result = checkDrift(base, target, config);
if (result.missing.length || result.errors.length) {
  report(result);
  process.exit(1);
}
```

See the [API reference](docs/API-Reference.md) for all exports. [examples/demo-app](https://github.com/shashi089/env-drift-check/tree/main/examples/demo-app) has a real-world integration.

---

## vs. similar tools

| Feature | `dotenv-safe` | `envalid` | `dotenv-linter` | `dotenvx` | **`env-drift-check`** |
| :--- | :---: | :---: | :---: | :---: | :---: |
| Missing key detection | ✅ | ✅ | ✅ | ⚠️ basic | ✅ |
| Runtime library | ✅ | ✅ | ❌ | ✅ | ⚠️ secondary |
| CI/CD friendly | ✅ | ✅ | ✅ | ✅ | ✅ |
| Encryption | ❌ | ❌ | ❌ | ✅ | ❌ |
| Standalone CLI | ❌ | ❌ | ✅ | ✅ | ✅ |
| Schema validation (no code changes) | ❌ | ❌ | ❌ | ❌ | ✅ |
| Interactive fix wizard | ❌ | ❌ | ❌ | ❌ | ✅ |
| Codebase scanner | ❌ | ❌ | ❌ | ❌ | ✅ |
| Entropy-based secret scoring | ❌ | ❌ | ❌ | ❌ | ✅ |
| Git safety audit | ❌ | ❌ | ❌ | ❌ | ✅ |
| Environment diff | ❌ | ❌ | ✅ | ❌ | ✅ |
| Framework prefix safety | ❌ | ❌ | ❌ | ❌ | ✅ |
| Docker / Kubernetes support | ❌ | ❌ | ❌ | ❌ | ✅ |

---

## Examples

- [Basic usage](https://github.com/shashi089/env-drift-check/tree/main/examples/basic-usage)
- [Demo app](https://github.com/shashi089/env-drift-check/tree/main/examples/demo-app)

---

[CHANGELOG](CHANGELOG.md) · [ROADMAP](ROADMAP.md) · [MIT License](LICENSE) · [Issues](https://github.com/shashi089/env-drift-check/issues)

---

If this saved you time, a ⭐ on GitHub helps others find it.
