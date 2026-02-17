# env-drift-check: Interactive .env Sync & Validation for Teams

[![npm version](https://img.shields.io/npm/v/env-drift-check.svg)](https://www.npmjs.com/package/env-drift-check)
[![npm downloads](https://img.shields.io/npm/dm/env-drift-check.svg)](https://www.npmjs.com/package/env-drift-check)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

> **Eliminate "It works on my machine" issues.** Synchronize `.env` files across your team with interactive prompts, smart schema validation, and real-time drift detection.

**env-drift-check** is a powerful CLI utility designed to manage environment variables in Node.js applications. It ensures your local `.env` remains in perfect sync with `.env.example`, preventing runtime crashes and streamlining developer onboarding.

![env-drift-check demo](https://github.com/shashi089/env-drift-check/raw/main/assets/env-drift-check.png)

## 🚀 Why Use env-drift-check?

Manually managing environment variables is error-prone. **env-drift-check** automates the process:

| Pain Point | Standard Approach | **env-drift-check** |
| :--- | :--- | :--- |
| **Missing Keys** | Application crashes at runtime | **Interactive Setup Wizard** fills them |
| **Type Safety** | String-only values, no validation | **Rich Validation** (Email, URL, Regex) |
| **Team Onboarding** | "Copy this file from Slack/Docs" | `npx env-drift-check init` & sync |
| **Configuration Drift** | Desync between dev/stage/prod | **Real-time Detection** against template |

### Key Features

- **Interactive Mode**: Automatically detects missing keys and prompts you to fill them in directly via the CLI.
- **Smart Schema Validation**: Enforce strict types including `email`, `url`, `number`, `boolean`, `enum`, and custom `regex`.
- **Zero Config Setup**: Works out of the box. Add an optional `envwise.config.json` for advanced rules.
- **CI/CD Ready**: Use `--strict` mode in your build pipeline to prevent deployments with missing variables.

## 📖 Documentation

- [CLI Usage](./docs/CLI-Usage.md) - Detailed flags and command examples.
- [Configuration](./docs/Configuration.md) - Advanced types and `envwise.config.json` schema.
- [Programmatic API](./docs/API-Reference.md) - Integrating the validation engine into your code.

## Installation

```bash
# Install as a dev dependency (Recommended)
npm install --save-dev env-drift-check

# OR install globally
npm install -g env-drift-check
```

## Usage

### 1. Initialize (New Setup)
Bootstrap your project by creating a configuration and an example environment file.
```bash
npx env-drift-check init
```

### 2. Basic Check
Compare your `.env` against the reference (default: `.env.example`).
```bash
npx env-drift-check
# Specify a custom reference file
npx env-drift-check --base .env.production
```

### 3. Interactive Sync (The "Magic" Feature)
If missing variables are found, launch the interactive wizard to fill them in without leaving your IDE.
```bash
npx env-drift-check --interactive
# OR
npx env-drift-check -i
```

### 4. CI/CD & Strict Mode
Fail your build or test suite if environment variables are out of sync.
```bash
npx env-drift-check --strict
```

---

## 🛠 Advanced Configuration

Define validation rules in `envwise.config.json` to ensure data integrity across environments.

```json
{
  "baseEnv": ".env.example",
  "rules": {
    "PORT": {
      "type": "number",
      "min": 3000,
      "max": 9000,
      "description": "Port the server should listen on"
    },
    "DATABASE_URL": {
      "type": "url",
      "description": "Connection string for MongoDB/PostgreSQL"
    },
    "ADMIN_EMAIL": {
      "type": "email",
      "required": true
    },
    "ENVIRONMENT": {
      "type": "enum",
      "values": ["development", "production", "test"]
    }
  }
}
```

### Supported Validation Types

| Type | Description | Example Rule |
| :--- | :--- | :--- |
| `string` | Length validation | `{ "min": 5, "max": 20 }` |
| `number` | Range validation | `{ "min": 1, "max": 100 }` |
| `boolean` | Flag checks | `{ "mustBeFalseIn": ["production"] }` |
| `enum` | Restricted values | `{ "values": ["v1", "v2"] }` |
| `email` | Standard email format | `type: "email"` |
| `url` | Valid URL/URI structure | `type: "url"` |
| `regex` | Custom pattern matching | `{ "regex": "^sk_live_.*" }` |

## Contributing

We welcome contributions! See the [issues](https://github.com/shashi089/env-drift-check/issues) for planned features or bug reports.

1. Fork the repository.
2. Create your feature branch (`git checkout -b feature/amazing-feature`).
3. Commit your changes (`git commit -m 'Add some amazing feature'`).
4. Push to the branch (`git push origin feature/amazing-feature`).
5. Open a Pull Request.

## License

MIT © [Shashidhar Naik](https://github.com/shashi089)
