# Env-Drift-Check

**Env-Drift-Check** (formerly EnvWise) is a smart environment drift checker designed to keep your `.env` files in sync with your reference templates (like `.env.example`). It ensures that your local environment is always valid, type-safe, and ready for production.

## Why Env-Drift-Check?

Managing environment variables is often the most fragile part of the development lifecycle. As projects grow, `.env` files become a source of silent failures, inconsistent local setups, and production risks. **Env-Drift-Check** acts as a guardian for your environment integrity.

###  Impact on Development
- **Eliminate "It Works on My Machine"**: Ensure total parity across all developer environments.
- **Reduce Debugging Time**: Catch configuration errors (wrong types, missing keys) at the source rather than deep in your application logs.
- **Confidence in Deployments**: Prevent shipping invalid configurations to production.

###  Key Use Cases
- **Seamless Onboarding**: New developers run one command to sync their local `.env` with the project's current requirements.
- **CI/CD Guardrails**: Use **Strict Mode** in pipelines to fail builds if the environment isn't production-ready.
- **Production Safety**: Enforce rules like disabling `DEBUG` mode in production environments automatically.

## Quick Start

```bash
# Install as a dev dependency
npm install --save-dev env-drift-check

# Run the checker
npx env-drift-check
```

## Features

-   ** Structural Diffing**: Instantly identifies missing keys in your `.env` or extra keys that aren't in your template.
-   ** Value Sync**: Compares values between files to ensure shared configurations are consistent.
-   ** Type Validation**: Enforces types for your variables (`number`, `boolean`, `enum`).
-   ** Environment Rules**: Define custom rules based on your `NODE_ENV` (e.g., `DEBUG` must be `false` in production).
-   ** Auto-Fix**: Run with `--fix` to automatically synchronize missing keys and mismatched values.
-   ** Strict Mode**: Perfect for CI/CD pipelines to fail builds if environment drift is detected.

## Installation

### Local Installation (Recommended)
Add it to your project to ensure all teammates can use it:
```bash
npm install --save-dev env-drift-check
```

### Global Installation
```bash
npm install -g env-drift-check
```

## Configuration

Custom rules are defined in `envwise.config.json` at the root of your project:

```json
{
  "baseEnv": ".env.example",
  "rules": {
    "PORT": { "type": "number" },
    "NODE_ENV": { "type": "enum", "values": ["development", "production", "test"] },
    "DEBUG": { "type": "boolean", "mustBeFalseIn": "production" }
  }
}
```

### Rule Options
| Rule Type | Description | Options |
| :--- | :--- | :--- |
| `number` | Ensures the value is a valid number. | N/A |
| `enum` | Restricts value to a specific set. | `values: string[]` |
| `boolean` | Checks for "true"/"false" strings. | `mustBeFalseIn: string` (e.g., "production") |

## Usage

### Check for drift (Default: .env)
```bash
npx env-drift-check
```

### Check a specific environment file
```bash
npx env-drift-check .env.staging
```

### Check ALL environment files in the project
Automatically detects all `.env*` files and validates them against the reference.
```bash
npx env-drift-check --all
```

### Apply automatic fixes
Syncs missing keys and mismatched values to the target file(s).
```bash
npx env-drift-check --fix
# or
npx env-drift-check .env.production --fix
```

### CI/CD Strict Mode
Exits with code `1` if any errors, missing keys, or mismatches are found.
```bash
npx env-drift-check --strict
```

## Development

If you're contributing to the project:

```bash
# Clone the repository
git clone https://github.com/shashi089/env-drift-check.git
cd env-drift-check

# Install dependencies
npm install

# Build
npm run build

# Run in dev mode
npm run dev
```

## License
MIT
