# env-drift-check

<div align="center">

**A combined environment drift detector + schema validator for multi-environment setups.**

[![npm version](https://img.shields.io/npm/v/env-drift-check.svg?style=flat-square)](https://npmjs.org/package/env-drift-check)
[![npm downloads](https://img.shields.io/npm/dm/env-drift-check.svg?style=flat-square)](https://npm-stat.com/charts.html?package=env-drift-check)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg?style=flat-square)](https://opensource.org/licenses/MIT)
[![CI Status](https://img.shields.io/badge/build-passing-brightgreen?style=flat-square)](#)

*Say goodbye to "It works on my machine" and hello to bulletproof environment variables.*

[Installation](#installation) • [Features](#features) • [Quick Start](#quick-start) • [Configuration](#configuration) • [Usage](#usage) • [Roadmap](#roadmap)

</div>

<div align="center">
  <img src="https://github.com/shashi089/env-drift-check/raw/main/assets/env-drift-check.png" alt="env-drift-check demo" />
</div>

---

## 💡 The Problem It Solves

Managing `.env` files across a team of developers or multiple deployment environments (development, staging, production) is notoriously error-prone. 

- **Missing variables** lead to unexpected runtime crashes.
- **Incorrect data types** (e.g., passing a string `"false"` instead of a proper boolean) cause silent logical bugs.
- **Onboarding new developers** often involves insecurely sharing `.env` files over Slack, or fighting with an outdated `.env.example`.

**env-drift-check** bridges this gap. It provides real-time drift detection to ensure your local environments match the blueprint, an interactive CLI to fix missing variables instantly, and a robust schema validator to enforce types and formats.

---

## 🏗 Architecture & Flow

```mermaid
graph TD
    A[Developers / CI] -->|Run env-drift-check| B(Engine)
    
    subgraph Validation Process
    B -->|1. Parse| C{.env.example}
    B -->|2. Parse| D[Target .env]
    B -->|3. Load Rules| E[envwise.config.json]
    
    C --> F{Drift Detector}
    D --> F
    
    F -->|Detect Mismatches| G{Compare Keys & Values}
    E -->|Schema Validation| G
    end

    G -->|Interactive Mode| H[Prompt UI: Auto-fix]
    H -->|Update| D
    
    G -->|Strict Mode| I[CI/CD Exit Code 1]
    G -->|Report| J[Terminal Output]
```

---

## 🚀 Features

- 🔍 **Environment Drift Detection**: Compares your local `.env` against the base `.env.example` to find missing or extra keys.
- 🛡️ **Extensive Schema Validation**: Enforce `string`, `number`, `boolean`, `enum`, `email`, `url`, and custom `regex` validations via `envwise.config.json`.
- 🪄 **Interactive Auto-fix**: A beautiful CLI wizard that prompts you for missing variables and writes them back to your `.env` file automatically.
- 🔄 **Multi-Environment Support**: Validate all `.env*` files in your project with the `--all` flag.
- 🚦 **CI/CD Ready**: Use `--strict` mode to fail the build if variables are missing or invalid, ensuring safe deployments.

### How Does It Compare?

| Feature | `dotenv-safe` | `envalid` | **`env-drift-check`** |
| :--- | :---: | :---: | :---: |
| **Missing Keys Detection** | ✅ | ✅ | ✅ |
| **CLI Interactive Mode** | ❌ | ❌ | ✅ |
| **Schema Validation (Config)** | ❌ | ✅ (Code) | ✅ (JSON) |
| **Cross-Env File Check** | ❌ | ❌ | ✅ |
| **No Code Integration Needed**| ❌ | ❌ | ✅ |

*(env-drift-check works purely as a CLI tooling step, meaning you don't need to change your application's actual code to validate environment variables!)*

---

## 📦 Installation

Install `env-drift-check` as a development dependency:

```bash
npm install --save-dev env-drift-check
```

Or run it directly using `npx` without installing:

```bash
npx env-drift-check init
```

---

## ⚡ Quick Start

### 1. Initialize the Project

Bootstrap your repository with a default configuration and `.env.example`:

```bash
npx env-drift-check init
```
*Output:*
```text
✅ Created envwise.config.json
✅ Created .env.example

Setup complete! Run 'npx env-drift-check -i' to sync your .env file.
```

### 2. Run an Interactive Check

If you just cloned a repo, check for missing environment variables and fill them in right from the terminal:

```bash
npx env-drift-check -i
```

![Interactive update](https://github.com/shashi089/env-drift-check/raw/main/assets/env-drift-check-i-update.png)

Once completed, your `.env` file is automatically updated!

![Interactive success](https://github.com/shashi089/env-drift-check/raw/main/assets/env-drift-check-i-final.png)

---

## ⚙️ Configuration (`envwise.config.json`)

To unlock the full power of the schema validator, define rules in an `envwise.config.json` file at the root of your project.

### Sample Configuration

```json
{
  "baseEnv": ".env.example",
  "rules": {
    "PORT": { 
      "type": "number", 
      "min": 1024, 
      "max": 65535,
      "description": "The port the HTTP server binds to"
    },
    "NODE_ENV": { 
      "type": "enum", 
      "values": ["development", "production", "test", "staging"] 
    },
    "DEBUG_MODE": { 
      "type": "boolean", 
      "mustBeFalseIn": "production" 
    },
    "DATABASE_URL": { 
      "type": "url",
      "required": true
    },
    "ADMIN_EMAIL": {
      "type": "email"
    },
    "API_KEY": {
      "type": "regex",
      "regex": "^sk_(test|live)_[0-9a-zA-Z]{24}$",
      "description": "Stripe API Key format"
    }
  }
}
```

### Supported Validation Types

| Type | Options | Description |
|---|---|---|
| `string` | `min`, `max` | Enforce string length bounds. |
| `number` | `min`, `max` | Enforce numeric value limits. |
| `boolean` | `mustBeFalseIn` | Ensure value is "true" or "false". Can conditionally reject "true" in specific environments (e.g. production safety). |
| `enum` | `values: []` | Restrict the variable to a specific set of allowed strings. |
| `email` | - | Validates against a standard email regex. |
| `url` | - | Validates standard URI formats. |
| `regex` | `regex` | Custom regular expression validation. |

*(All variables are `required: true` by default unless explicitly specified as `required: false` in their rule).*

---

## 💻 CLI Usage Examples

### Drift Detection Example
Check the default `.env` file against the default `.env.example`:

```bash
npx env-drift-check
```
*Output Detail:*
```text
🚨 1 Mismatched Keys
PORT: Expected 3000, got 8080

❌ 2 Validation Errors
DATABASE_URL: DATABASE_URL must be a valid URL
NODE_ENV: NODE_ENV must be one of: development, production
```

### Multi-Environment Verification
Check all `.env.development`, `.env.test`, `.env.production` files in parallel:

```bash
npx env-drift-check --all
```

### CI/CD Pipeline Integration (Strict Mode)
Run the check in your GitHub Actions, GitLab CI, or pre-commit hook. Using `--strict` ensures the process exits with `code 1` on any error.

```yaml
# .github/workflows/ci.yml
name: CI
on: [push, pull_request]

jobs:
  validate-env:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      # Assuming you have a .env.test you want to validate
      - run: npx env-drift-check .env.test --strict
```

---

## 🌟 Best Practices

1. **Never commit `.env` or `.env.*` files!** Ensure they are in your `.gitignore`.
2. **Always commit `.env.example`** and `envwise.config.json` as the source of truth for your team.
3. **Use the Interactive Mode** (`-i`) locally during development and onboarding.
4. **Use Strict Mode** (`--strict`) in your CI/CD pipeline to catch missing production variables early.
5. **Add it to your `postinstall` or `prepare` script** in `package.json` to auto-prompt new developers:
   ```json
   "scripts": {
     "prepare": "env-drift-check -i"
   }
   ```

---

## 🗺 Roadmap

- [x] Boolean conditional checks (`mustBeFalseIn`)
- [x] Interactive CLI prompts
- [x] Multi-file parsing (`--all`)
- [ ] **JSON Output Mode**: Provide `--format json` for reporting to integrate with other tooling pipelines.
- [ ] **Secret Scanning**: Add basic entropy checks to prevent weak local passwords from entering production variables.
- [ ] **Variable Deprecation**: Support marking keys as deprecated to gracefully remove them across teams.

---

## 🤝 Contributing

Contributions are always welcome! 

1. Fork the project
2. Create your Feature Branch (`git checkout -b feature/AmazingFeature`)
3. Commit your Changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the Branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

---

## 📄 License

Distributed under the MIT License. See `LICENSE` for more information.

> Built with ❤️ for better Developer Experience by [Shashidhar Naik](https://github.com/shashi089)
