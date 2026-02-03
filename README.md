# env-drift-check: Automatic .env Sync & Validation

[![npm version](https://img.shields.io/npm/v/env-drift-check.svg)](https://www.npmjs.com/package/env-drift-check)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

> **Stop copy-pasting `.env` files.** Onboard developers in seconds with interactive prompts, smart schema validation, and drift detection.

**env-drift-check** is the ultimate CLI tool for managing environment variables in Node.js projects. It ensures your local `.env` file is always in sync with `.env.example`, preventing runtime errors caused by missing keys. Perfect for teams and CI/CD pipelines.

![env-drift-check demo](https://github.com/shashi089/env-drift-check/raw/main/assets/env-drift-check.png)

##  Why use this?

| Feature | Other Tools | **env-drift-check** |
| :--- | :--- | :--- |
| **Missing Keys** | Crash & Exit  |  **Interactive Setup Wizard**  |
| **Validation** | Basic Existence Check | **Rich Types** (Email, URL, Regex, Number)  |
| **Onboarding** | Manual (Read docs → Copy → Paste) | **Automated** (Run command → Fill prompts)  |
| **Drift Detection** | Static | **Real-time** comparison with `.env.example` |

##  Features

- **Interactive Mode**: Automatically detects missing keys and prompts you to fill them in via CLI.
- **Smart Schema Validation**: Enforce types like `email`, `url`, `number`, `boolean`, `enum`, and custom `regex`.
- **Drift Detection**: Instantly compare your local environment against the team's `.env.example`.
- **CI/CD Ready**: Use strict mode to fail builds if environment variables are missing or invalid.
- **Zero Config**: Works out of the box, or add `envwise.config.json` for advanced validation rules.

## Installation

Install globally or as a dev dependency:

```bash
npm install -g env-drift-check
# OR
npm install --save-dev env-drift-check
```

## Usage

### 1. Basic Check
Check if your `.env` is missing any keys defined in `.env.example`. This is great for a quick status check.

```bash
npx env-drift-check
```

### 2. Interactive Setup (Recommended)
The **interactive mode** is the star feature. If missing keys are found, it launches a wizard to help you fill them in without leaving your terminal.

```bash
npx env-drift-check --interactive
# OR
npx env-drift-check -i
```

![Interactive update](https://github.com/shashi089/env-drift-check/raw/main/assets/env-drift-check-i-update.png)

Once completed, your `.env` file is automatically updated!

![Interactive success](https://github.com/shashi089/env-drift-check/raw/main/assets/env-drift-check-i-final.png)

### 3. CI/CD Mode (Strict)
Ensure no broken code hits production. Use strict mode in your build pipeline to fail if environment variables are missing.

```bash
npx env-drift-check --strict
```

## Configuration

Create a `envwise.config.json` file in your root directory to define validation rules and defaults. This acts as a schema for your environment variables.

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
    },
    "API_KEY": {
      "type": "regex",
      "regex": "^[A-Z0-9]{32}$",
      "description": "32-character alphanumeric API key"
    }
  }
}
```

### Validation Types

| Type | Options | Description |
| :--- | :--- | :--- |
| `string` | `min`, `max` | Validate string length. |
| `number` | `min`, `max` | Validate numeric ranges. |
| `boolean` | `mustBeFalseIn` | Ensure flags (like debug mode) are off in prod. |
| `enum` | `values` (array) | Restrict to a set of allowed values. |
| `email` | - | Validate standard email formats. |
| `url` | - | Validate URL structure. |
| `regex` | `regex` (string) | Custom pattern matching for keys, secrets, etc. |

## Contributing

We welcome contributions! Please follow these steps:

1. Fork the repository.
2. Create your feature branch (`git checkout -b feature/amazing-feature`).
3. Commit your changes (`git commit -m 'Add some amazing feature'`).
4. Push to the branch (`git push origin feature/amazing-feature`).
5. Open a Pull Request.

##  License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
