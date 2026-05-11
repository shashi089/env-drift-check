# Demo Project: Professional `env-drift-check` Integration

This project demonstrates a production-grade integration of `env-drift-check` into a Node.js application workflow. It showcases how to automate environment synchronization and enforce configuration health at runtime.

## 📋 The Developer Onboarding Experience

Imagine a new developer just cloned this repository. Without a `.env` file, the application would typically crash with a cryptic "cannot read property of undefined" error. 

**env-drift-check** transforms this experience into a guided setup.

### Step 0: Installation
Install the package as a development dependency:
```bash
npm install --save-dev env-drift-check
```

### Step 1: Initial Attempt to Start
If you try to run the app immediately, it will fail gracefully thanks to our [fail-fast bootstrap](#-programmatic-bootstrap-fail-fast).
```bash
npm start
```
*Output: 🔍 Validating environment... ❌ Error: .env file is missing!*

### Step 2: Interactive Synchronization
Instead of manually hunting for values in `.env.example`, you run the interactive setup:
```bash
npm run setup
```
This triggers `env-drift-check -i`, prompting you for missing keys (PORT, DATABASE_URL, etc.) and validating your inputs in real-time.

### Step 3: Verifying Configuration Health
Ensures no drift has occurred since your last pull. Perfect for CI/CD pipelines.
```bash
npm run validate
```

### Step 4: Successful Application Start
Now that your environment is synchronized and valid, the app starts perfectly.
```bash
npm run dev
```

## 🛠 Integration Architecture

### 1. Unified CLI Scripts
The `package.json` integrates validation into the standard development cycle:

```json
"scripts": {
  "setup": "env-drift-check -i",
  "validate": "env-drift-check --strict",
  "dev": "npm run validate && npm start"
}
```

### 2. Programmatic Bootstrap (Fail-Fast)
We use a `src/bootstrap.js` module to protect the application at runtime. This ensures that even if a developer bypasses the CLI check, the code refuses to execute with invalid configuration:

```javascript
const { checkDrift, parseEnv, loadConfig } = require('env-drift-check');

function bootstrap() {
    // Logic to validate .env against .env.example
    // ... exits if drift is detected
}
```

## 🌟 Benefits
- **Zero-Guess Setup**: No more "what should I put for this variable?"
- **CI/CD Guardrails**: Prevents deployments with missing production secrets.
- **Documentation as Code**: Your `.env.example` and `envwise.config.json` become the living documentation of your infrastructure needs.
