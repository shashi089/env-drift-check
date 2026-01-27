# env-drift-check

[![npm version](https://img.shields.io/npm/v/env-drift-check.svg)](https://www.npmjs.com/package/env-drift-check)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

> **Stop copy-pasting `.env` files.** Onboard developers in seconds with interactive prompts and smart validation.

**env-drift-check** is a powerful CLI tool that ensures your environment variables are always in sync with your code. Unlike other tools that just fail when keys are missing, we help you **fix them interactively**.

##  Why use this?

| Feature | Other Tools | **env-drift-check** |
| :--- | :--- | :--- |
| **Missing Keys** |  Crash & Exit | 🛠 **Interactive Setup Wizard** |
| **Validation** | Basic Existence Check | **Rich Types** (Email, URL, Regex) |
| **Onboarding** | Manual (Read docs → Copy → Paste) | **Automated** (Run command → Fill prompts) |

##  Features

- **Interactive Mode**: Automatically prompts users to fill in missing variables.
- **Smart Validation**: enforce types like `email`, `url`, `number`, `boolean`, and `regex`.
- **Drift Detection**: Compares your `.env` against `.env.example`.
- **Zero Config**: Works out of the box, or add `envwise.config.json` for superpowers.

## Installation

```bash
npm install -g env-drift-check
# OR
npx env-drift-check
```

## 🛠 Usage

### 1. Basic Check
Check if your `.env` is missing any keys defined in `.env.example`:

```bash
npx env-drift-check
```

### 2. Interactive Setup (Recommended)
Automatically prompt the user to fill in missing keys:

```bash
npx env-drift-check --interactive
# OR
npx env-drift-check -i
```

### 3. CI/CD Mode (Strict)
Fail the build if drift is detected (great for pipelines):

```bash
npx env-drift-check --strict
```

## Configuration

Create a `envwise.config.json` to define validation rules.

```json
{
  "baseEnv": ".env.example",
  "rules": {
    "PORT": {
      "type": "number",
      "min": 3000,
      "max": 9000
    },
    "DATABASE_URL": {
      "type": "url",
      "description": "Connection string for MongoDB"
    },
    "ADMIN_EMAIL": {
      "type": "email",
      "required": true
    },
    "FEATURE_FLAG": {
      "type": "boolean",
      "mustBeFalseIn": "production"
    },
    "API_KEY": {
      "type": "regex",
      "regex": "^[A-Z0-9]{32}$",
      "description": "32-character alphanumeric key"
    }
  }
}
```

### Validation Types

| Type | Options | Description |
| :--- | :--- | :--- |
| `string` | `min`, `max` | String length validation |
| `number` | `min`, `max` | Numeric range validation |
| `boolean` | `mustBeFalseIn` | True/False check |
| `enum` | `values` (array) | Must be one of the allowlist |
| `email` | - | Valid email format |
| `url` | - | Valid URL format |
| `regex` | `regex` (string) | Custom pattern matching |

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

##  License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
