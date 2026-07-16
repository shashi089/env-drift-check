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

**Options:**

| Flag | Default | Description |
|---|---|---|
| `--base <path>` | `.env.example` | Template file to compare against |
| `--target <path>` | `.env` | Target env file to validate |
| `--strict` | off | Exit code 1 on any missing key or validation error |
| `--interactive`, `-i` | off | Prompt for missing keys and write them to the target file |
| `--watch`, `-w` | off | Re-validate on every file save (300 ms debounce) |
| `--format <fmt>` | `text` | Output format: `text`, `json`, or `sarif` |
| `--system-env` | off | Fall back to `process.env` as the validation target |
| `--all` | off | Show all keys including those that pass |

**Examples:**

```bash
# Basic check
npx env-drift-check

# CI/CD strict mode
npx env-drift-check --strict

# Watch mode during development
npx env-drift-check --watch

# SARIF output for GitHub Security tab
npx env-drift-check --format sarif > results.sarif

# JSON output for custom tooling
npx env-drift-check --format json
```

---

### `diff`

Side-by-side comparison of two `.env` files. Shows added (`+`), removed (`-`), and changed (`~`) keys.

```bash
npx env-drift-check diff <file1> <file2>
```

**Example:**

```bash
npx env-drift-check diff .env.staging .env.production
```

---

### `audit`

Checks every `.env*` file in the project for git safety issues:
- Not listed in `.gitignore`
- Currently tracked by git
- Found in git history (leaked in a past commit)

```bash
npx env-drift-check audit
```

---

### `scan`

Scans JS/TS source files for `process.env.KEY`, `process.env['KEY']`, destructuring, and `import.meta.env.*` references. Reports how many unique environment variable references exist in the codebase — even when no `.env` or `.env.example` is present.

```bash
npx env-drift-check scan [options]
```

**Options:**

| Flag | Default | Description |
|---|---|---|
| `--base <path>` | `.env.example` | Reference file to compare against |
| `--fix` | off | Append missing keys to `.env.example`; creates the file if it doesn't exist |

**Examples:**

```bash
# Scan codebase and report env references
npx env-drift-check scan

# Auto-populate .env.example with all found keys
npx env-drift-check scan --fix
```

---

### `gen-example`

Generates or updates `.env.example` from an existing `.env`, stripping secret values while preserving comments, blank lines, and key order.

```bash
npx env-drift-check gen-example [options]
```

**Options:**

| Flag | Default | Description |
|---|---|---|
| `--source <path>` | `.env` | Source env file |
| `--output <path>` | `.env.example` | Output example file |

---

### `gen-configmap`

Splits a `.env` file into a Kubernetes `ConfigMap` YAML (safe keys) and a `Secret` YAML (sensitive keys). Ready to apply with `kubectl apply -f`.

```bash
npx env-drift-check gen-configmap [options]
```

**Options:**

| Flag | Default | Description |
|---|---|---|
| `--source <path>` | `.env` | Source env file |
| `--name <name>` | `app-config` | Kubernetes resource name |
| `--namespace <ns>` | `default` | Kubernetes namespace |

**Example:**

```bash
npx env-drift-check gen-configmap --name my-app --namespace production
```

---

### `validate-compose`

Parses a `docker-compose.yml` file and validates all `environment:` blocks against the active schema. Reports missing keys and type errors per service.

```bash
npx env-drift-check validate-compose [options]
```

**Options:**

| Flag | Default | Description |
|---|---|---|
| `--file <path>` | `docker-compose.yml` | Docker Compose file to validate |
| `--strict` | off | Exit code 1 on any error |

---

### `monorepo`

Validates `.env` files across all packages in a monorepo. Expands glob patterns, loads per-package config if present, and prints a pass/fail summary.

```bash
npx env-drift-check monorepo [options]
```

**Options:**

| Flag | Default | Description |
|---|---|---|
| `--packages <patterns>` | `packages/*,apps/*` | Comma-separated glob patterns for package directories |
| `--strict` | off | Exit code 1 if any package fails |
| `--format <fmt>` | `text` | Output format: `text` or `json` |

**Example:**

```bash
npx env-drift-check monorepo --packages "packages/*,services/*" --strict
```

---

## Global Options

| Flag | Description |
|---|---|
| `--version`, `-V` | Print version number |
| `--help`, `-h` | Show help |
