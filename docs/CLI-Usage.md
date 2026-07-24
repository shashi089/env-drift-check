# CLI Usage Guide

`env-drift-check` is a zero-config CLI tool for detecting environment variable drift, enforcing schema validation, and auditing git safety.

## Basic Syntax

```bash
npx env-drift-check [command] [options]
```

---

## Commands

### `check` (default)

Compares your `.env` against `.env.example` and validates against schema rules.

```bash
npx env-drift-check
npx env-drift-check check
```

| Flag | Default | Description |
|---|---|---|
| `--base <path>` | `.env.example` | Template file to compare against |
| `--target <path>` | `.env` | Target env file to validate |
| `--strict` | off | Exit code 1 on any missing key or validation error |
| `--interactive`, `-i` | off | Prompt for missing keys and write them to the target file |
| `--watch`, `-w` | off | Re-validate on every file save (300 ms debounce) |
| `--format <fmt>` | `text` | Output format: `text`, `json`, or `sarif` |
| `--system-env` | off | Fall back to `process.env` as the validation target |
| `--all` | off | Check all `.env*` files in the directory |

```bash
npx env-drift-check --strict
npx env-drift-check --watch
npx env-drift-check --format sarif > results.sarif
npx env-drift-check --format json
```

---

### `diff`

Side-by-side comparison of two `.env` files. Shows added (`+`), removed (`-`), and changed (`~`) keys.

```bash
npx env-drift-check diff .env.staging .env.production
```

---

### `audit`

Checks every `.env*` file for git safety: not in `.gitignore`, currently tracked, or found in git history.

```bash
npx env-drift-check audit
```

---

### `scan`

Scans JS/TS source files for `process.env.KEY`, destructuring, and `import.meta.env.*` references. Works even when no `.env` or `.env.example` exists.

```bash
npx env-drift-check scan [options]
```

| Flag | Default | Description |
|---|---|---|
| `--base <path>` | `.env.example` | Reference file to compare against |
| `--fix` | off | Append missing keys to `.env.example`; creates the file if it doesn't exist |

```bash
npx env-drift-check scan
npx env-drift-check scan --fix
```

---

### `gen-example`

Generates or updates `.env.example` from an existing `.env`, stripping values while preserving comments and formatting.

```bash
npx env-drift-check gen-example
```

---

### `gen-configmap`

Splits a `.env` file into a Kubernetes `ConfigMap` YAML (safe keys) and a `Secret` YAML (sensitive keys).

```bash
npx env-drift-check gen-configmap [options]
```

| Flag | Default | Description |
|---|---|---|
| `--source <path>` | `.env` | Source env file |
| `--name <name>` | `app-config` | Kubernetes resource name |
| `--namespace <ns>` | `default` | Kubernetes namespace |

---

### `validate-compose`

Parses a `docker-compose.yml` and validates all `environment:` blocks against the active schema.

```bash
npx env-drift-check validate-compose [options]
```

| Flag | Default | Description |
|---|---|---|
| `--file <path>` | `docker-compose.yml` | Compose file to validate |
| `--strict` | off | Exit code 1 on any error |

---

### `monorepo`

Validates `.env` files across all packages in a monorepo. Loads per-package config if present, aggregates pass/fail.

```bash
npx env-drift-check monorepo [options]
```

| Flag | Default | Description |
|---|---|---|
| `--packages <patterns>` | `packages/*,apps/*` | Comma-separated glob patterns |
| `--strict` | off | Exit code 1 if any package fails |
| `--format <fmt>` | `text` | Output format: `text` or `json` |

```bash
npx env-drift-check monorepo --packages "packages/*,services/*" --strict
```

### `init`

Scaffolds a starter `envwise.config.json` and `.env.example` in the current directory. Skips each file if it already exists.

```bash
npx env-drift-check init
```

---

## Global Options

| Flag | Description |
|---|---|
| `--version`, `-V` | Print version number |
| `--help`, `-h` | Show help |
