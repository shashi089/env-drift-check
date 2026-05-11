# Basic Usage Example

This example demonstrates how to use `env-drift-check` to synchronize your `.env` file with a template.

## Files in this example:
- `.env.example`: The template file defining required variables.
- `envwise.config.json`: Configuration for schema validation.
- `.env`: (Initially missing) Your local environment file.

## How to run:

1. **Install dependencies** (from the root of this repo):
   ```bash
   npm install
   npm run build
   ```

2. **Run the check** (using the local build):
   ```bash
   node ../../dist/cli.js check --base .env.example
   ```

3. **Run interactive fix**:
   ```bash
   node ../../dist/cli.js check --base .env.example -i
   ```

Observe how `.env` is created/updated while preserving any comments you might add manually!
