# CLI Usage Guide

`env-drift-check` is a powerful CLI tool to manage environment variable drift.

## Basic Syntax

```bash
npx env-drift-check [options]
```

## Options

### `--interactive`, `-i`
Runs the setup wizard. If any keys are missing from your `.env` but present in `.env.example`, the CLI will prompt you for values and automatically update your `.env` file.

### `--strict`
Strict mode for CI/CD. The process will exit with a non-zero code if:
- Keys are missing from the target env file.
- Validation rules (type, regex, etc.) fail.

### `--base <path>`
Specify the base template file. Default is `.env.example`.

### `--target <path>`
Specify the target environment file. Default is `.env`.

### `--config <path>`
Path to a custom configuration file. Default is `envwise.config.json`.

## Examples

**Run a simple check:**
```bash
npx env-drift-check
```

**Fill in missing keys interactively:**
```bash
npx env-drift-check -i
```

**Using strict mode in CI:**
```bash
npx env-drift-check --strict
```
