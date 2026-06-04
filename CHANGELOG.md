# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.2.3] - 2026-06-04

### Added
- **Code Scanner**: Added codebase scanner (`scanCodebase`) and `scan` CLI command to scan source files (JS/TS) for `process.env` references and check them against the `.env.example` file.
- **Template Generator**: Added template generator (`generateExampleFile`) and `gen-example` CLI command to generate or update `.env.example` templates from `.env` files, preserving structure/comments while clearing values.
- **System Environment Fallback**: Added support for checking against system environment variables (`process.env`) via `--system-env` CLI flag or `includeSystemEnv` config option.
- **JSON Output**: Added `-f, --format json` support to output validation results as structured JSON.
- **Deprecation Warnings**: Added deprecation detection and warnings for keys flagged as `deprecated` in configuration rules.
- **Security Check**: Enforced weak password/secret detection and minimum length validation in production via the `checkSecretStrength` rule option.

### Changed
- **Interactive Setup**: Enforced context-specific environment passing (`currentEnv`) during interactive setup prompt validation instead of defaulting to "local".

## [0.2.1] - 2026-05-11

### Fixed
- Restored value mismatch detection (previously suppressed by empty placeholder guard).

## [0.2.0] - 2026-05-11

### Added
- **Modular Engine**: Extracted `envWriter` logic for high-fidelity formatting preservation.
- **Programmatic Usage**: Better library support with refined `index.ts` exports.
- **Demo Project**: Added `examples/demo-app` showcasing professional integration patterns.

## [0.1.5] - 2026-02-09

### Added
- Comprehensive documentation in `docs/` folder.
- JSDoc annotations to core functions for better programmatic usage.
- `CHANGELOG.md` to track version history.
- Improved `README.md` with documentation links.

## [0.1.4] - Previous Version

### Added
- Initial project structure.
- Interactive CLI mode.
- Basic validation rules.
- Support for `envwise.config.json`.
