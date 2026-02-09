# Examples

Practical examples of how to use `env-drift-check` in various scenarios.

## 1. Simple CLI Check
Quickly see what's missing in your `.env`.
```bash
npx env-drift-check
```

## 2. Interactive Onboarding
Help new developers set up their environment variables.
```bash
npx env-drift-check --interactive
```

## 3. Strict CI Validation
Fail the build if `PROD_DB_URL` is missing or invalid.
```bash
npx env-drift-check --strict
```

## 4. Programmatic Validation
Use it in your server entry point to prevent startup if env is invalid.
```javascript
import { checkDrift, loadConfig, parseEnv } from 'env-drift-check';
import fs from 'fs';

async function startup() {
  const base = parseEnv('.env.example');
  const target = parseEnv('.env');
  const config = loadConfig();
  
  const result = checkDrift(base, target, config);
  
  if (result.missing.length > 0 || result.errors.length > 0) {
    console.error('Environment drift detected! Run: npx env-drift-check -i');
    process.exit(1);
  }
  
  console.log('Environment is healthy!');
}
```

## 5. Complex Rules
Define cross-environment constraints in `envwise.config.json`.
```json
{
  "rules": {
    "ENABLE_DEBUG": {
      "type": "boolean",
      "mustBeFalseIn": "production"
    },
    "API_VERSION": {
      "type": "enum",
      "values": ["v1", "v2"]
    }
  }
}
```
