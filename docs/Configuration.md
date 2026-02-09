# Configuration Guide

Define advanced validation rules and defaults in `envwise.config.json`.

## Schema Structure

```json
{
  "baseEnv": ".env.example",
  "rules": {
    "KEY_NAME": {
      "type": "string | number | boolean | enum | email | url | regex",
      "required": boolean,
      "description": "Short explanation",
      "options": "..." 
    }
  }
}
```

## Rule Types

### String
Validates that the value is a string.
- `min`: Minimum length.
- `max`: Maximum length.

### Number
Validates that the value is a number.
- `min`: Minimum value.
- `max`: Maximum value.

### Boolean
Validates that the value is `true` or `false`.
- `mustBeFalseIn`: Array of `NODE_ENV` values where this must be `false` (e.g., `["production"]`).

### Enum
Limits values to a predefined set.
- `values`: Array of allowed strings.

### Email
Validates standard email format.

### URL
Validates standard URL/URI structure.

### Regex
Custom pattern matching.
- `regex`: A string representing the regular expression.

## Example Configuration

```json
{
  "rules": {
    "PORT": {
      "type": "number",
      "min": 1024,
      "max": 65535,
      "description": "Application port"
    },
    "DB_URL": {
      "type": "url",
      "required": true
    },
    "DEBUG": {
      "type": "boolean",
      "mustBeFalseIn": ["production"]
    }
  }
}
```
