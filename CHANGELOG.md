# Changelog

All notable changes to `env-drift-check` are documented here.

This project follows [Keep a Changelog](https://keepachangelog.com/en/1.0.0/) and [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

## [Unreleased]

---

## [0.5.0] — 2026-07-15

### Added

- **Kubernetes ConfigMap generator** — `gen-configmap` command splits a `.env` file into a `ConfigMap` YAML (safe keys) and a `Secret` YAML (sensitive keys detected by name pattern). Outputs two files ready to apply with `kubectl`.
- **Docker Compose env validation** — `validate-compose` command parses a `docker-compose.yml` file, extracts all `environment:` blocks, and validates them against the active schema. Reports missing keys and type errors per service.
- **GitHub Actions marketplace action** — `action.yml` in the repo root enables `uses: shashi089/env-drift-check@v1` in any workflow. Composite action with inputs for `command`, `file`, `base`, `strict`, `format`, `system-env`, and `all`. Automatically installs and runs the CLI via `npx`.
- **Config inheritance (`extends`)** — `envwise.config.json` now supports an `"extends"` field pointing to a parent config file. Rules are deep-merged; child rules override parent rules on conflict. Circular reference detection exits with a clear error. Supports both `.json` and `.js` parent configs.
- **Monorepo support** — `monorepo` command expands glob patterns like `packages/*,apps/*`, loads per-package `envwise.config.json` if present (falling back to the root config), runs drift checks for each package, and prints a per-package pass/fail summary. `--strict` exits with code 1 if any package fails. `--format json` emits a machine-readable aggregate report.
- **`loadConfigFrom(dir)`** — New programmatic export that loads config from an arbitrary directory instead of `process.cwd()`. Used internally by the monorepo command; available for library consumers.

### Fixed

- **`scan --fix` with no base file** — Previously `--fix` silently did nothing when `.env.example` didn't exist. Now creates the file from scratch, seeding it with all discovered keys set to empty values and a generated header comment.

---

## [0.4.0] — 2026-06-30

### Added

- **Framework prefix awareness** — Detects Next.js, Vite, and CRA from the project's `package.json`. Warns when a variable with a browser-exposed prefix (`NEXT_PUBLIC_`, `VITE_`, `REACT_APP_`) has a name that suggests it is a secret (matches `SECRET|PASSWORD|PRIVATE|TOKEN|KEY|CREDENTIAL|CERT|SEED`).
- **`requiredIf` conditional rules** — A key can be declared optional by default but required when another variable has a specific value. Example: `"requiredIf": { "AUTH_TYPE": "oauth" }` makes `OAUTH_CLIENT_ID` mandatory only when oauth is selected.
- **`default` values in schema** — A rule can now carry a `"default"` field. Keys with a default are never reported as missing; the default value is passed through the same schema validation as real values.
- **`mustBeTrueIn` enforcement** — Complements the existing `mustBeFalseIn`. Enforces that a boolean variable is `"true"` in a specific environment (e.g., `"mustBeTrueIn": "production"` for mandatory feature flags).
- **`--watch` / `-w` mode** — Watches all relevant files (base env, target envs, config files) and re-runs validation automatically on any save with a 300 ms debounce. Console clears between runs for a clean view.
- **SARIF 2.1.0 output** — `--format sarif` emits a standards-compliant SARIF document. Pipe it into the GitHub Security tab via `upload-sarif` in a GitHub Actions workflow. Rule IDs: `EDC001` (MissingKey), `EDC002` (ValidationError), `EDC003` (ExtraKey), `EDC004` (DeprecationWarning), `EDC005` (ValueMismatch).
- **JS config support** — `envwise.config.js` is now loaded as a fallback when no JSON config is present, enabling dynamic configurations and configs with comments.
- **12 new tests** for framework detection and warning generation (`frameworkChecker.test.ts`); 4 new tests for `default` and `requiredIf` in `driftChecker.test.ts`; 3 new `mustBeTrueIn` tests in `validator.test.ts`. Total: **66 tests**.

### Changed

- `src/types.ts` — `Rule` extended with `requiredIf`, `default`, and `mustBeTrueIn`; `Config` extended with `framework` field.
- `src/engine/driftChecker.ts` — Refactored to support `default`, `requiredIf`, and appended framework warnings.
- `src/index.ts` — Exports `frameworkChecker` and `sarifReporter` for programmatic use.
- `tsconfig.json` — Added `"types": ["node"]` to ensure Node globals are available in test files.
- `vitest` downgraded from 4.x → 2.x for Node 18 LTS compatibility.

---

## [0.3.0] — 2026-06-26

### Added

- **`diff` command** — Side-by-side comparison of two `.env` files showing added (`+`), removed (`-`), and changed (`~`) keys. Fastest way to debug staging vs. production environment mismatches.
- **`audit` command** — Checks every `.env*` file against `.gitignore`, live git tracking, and full git history. Warns when secrets may have been committed in the past.
- **`scan --fix` flag** — Automatically appends keys found in code but missing from `.env.example`, turning the scanner from informational to actionable.
- **Shannon entropy scoring** — Replaced the 10-word weak-secret blocklist with real Shannon entropy math. Secrets scoring below 3.0/5.0 bits per character are flagged with a suggested `openssl rand` fix command.
- **Destructuring detection in scanner** — `const { DB_URL, PORT } = process.env` patterns are now detected.
- **Vite support in scanner** — `import.meta.env.VITE_KEY` references are now detected alongside `process.env.*`.
- **Test suite** — 47 vitest tests covering `envParser` (10), `validator` (27), and `driftChecker` (10).
- **`vitest.config.ts`** — Locks test runner to `.ts` source files to prevent stale compiled artifacts from interfering.
- **GitHub Actions workflow** — Ready-to-use `.github/workflows/env-check.yml` with strict check, codebase scan, and git audit steps.
- **Pre-commit hook docs** — Husky and lint-staged integration guide added to README.
- **`ROADMAP.md`** — Full phased adoption roadmap with competitive positioning table.
- **`test` and `test:watch` scripts** added to `package.json`.
- **Commands reference table** in README listing all CLI commands.
- **Programmatic API reference table** in README listing all exports.

### Fixed

- **`loadConfig.ts` crash on malformed JSON** — `JSON.parse` now wraps in try/catch and prints a clear, actionable error instead of an unhandled exception.
- **Production length check unreachable** — The minimum-length check in `validateSecret` ran after the entropy check. Strings shorter than 8 chars cannot reach entropy ≥ 3.0, so the length check was dead code. Reordered: length check now runs first.
- **`tsconfig.json` test exclusion** — Test files are now excluded from the TypeScript build, preventing `.js` and `.d.ts` artifacts from being emitted into `tests/`.

### Changed

- **`validator.ts` refactored** — Each validation type is now its own pure function (`validateNumber`, `validateString`, `validateBoolean`, `validateUrl`, `validateEnum`, `validateEmail`, `validateRegex`), reducing cognitive complexity from 45 to under 15 per function.
- **`cli.ts` refactored** — Extracted `resolveTargetEnv`, `logCheckHeader`, and `applyInteractiveFix` helpers. Moved `child_process` to a proper top-level import.
- **README rewritten for SEO** — Keyword-rich subtitle, expanded badge row, commands table, API exports table, updated comparison matrix with all new features, links to CHANGELOG and ROADMAP.

---

## [0.2.3] — 2026-06-04

### Added

- **`scan` command** — Scans JS/TS source files for `process.env.KEY` and `process.env['KEY']` references. Reports variables used in code but absent from `.env.example`, and variables in `.env.example` unused in code.
- **`gen-example` command** — Generates or updates `.env.example` from a local `.env`, stripping secret values while preserving comments, blank lines, and formatting. Prompts for confirmation before overwriting.
- **`--system-env` flag** — Falls back to `process.env` as the validation target for container and serverless environments.
- **`--format json` flag** — Serializes check results to structured JSON for CI/CD dashboards, Slack bots, and custom toolchains.
- **Deprecation warnings** — Schema rules support `deprecated: true` or `deprecated: "migration message"` to emit warnings for legacy keys.
- **`checkSecretStrength` rule option** — Enforces weak-password detection and minimum production length. Auto-enabled for keys named `*SECRET*` or `*PASSWORD*`.

### Changed

- **Interactive setup** — `currentEnv` is now correctly passed to validation during interactive prompts instead of defaulting to `"local"`.

---

## [0.2.1] — 2026-05-11

### Fixed

- **Value mismatch detection** — Restored correct comparison between base and target env values (previously suppressed by an empty placeholder guard).

---

## [0.2.0] — 2026-05-11

### Added

- **High-fidelity formatting preservation** — `updateEnvFile` preserves inline comments, blank lines, original spacing, and key order when writing back to `.env`.
- **`examples/demo-app`** — Real-world Express-style app showing fail-fast startup validation and CI/CD integration.
- **Refined programmatic API** — Cleaner `index.ts` exports for library usage.

---

## [0.1.5] — 2026-02-09

### Added

- **`docs/` folder** — Comprehensive documentation.
- **JSDoc annotations** — Core functions annotated for IDE IntelliSense and programmatic usage.
- **`CHANGELOG.md`** — Version history tracking begins.
- Improved README with documentation links.

---

## [0.1.4] — 2026-01-01

### Added

- Initial project structure.
- Interactive CLI mode with missing variable prompts.
- Basic schema validation rules (`string`, `number`, `boolean`, `enum`, `email`, `url`, `regex`).
- `envwise.config.json` configuration support.
- `--strict` mode for CI/CD integration.

---

[Unreleased]: https://github.com/shashi089/env-drift-check/compare/v0.5.0...HEAD
[0.5.0]: https://github.com/shashi089/env-drift-check/compare/v0.4.0...v0.5.0
[0.4.0]: https://github.com/shashi089/env-drift-check/compare/v0.3.0...v0.4.0
[0.3.0]: https://github.com/shashi089/env-drift-check/compare/v0.2.3...v0.3.0
[0.2.3]: https://github.com/shashi089/env-drift-check/compare/v0.2.1...v0.2.3
[0.2.1]: https://github.com/shashi089/env-drift-check/compare/v0.2.0...v0.2.1
[0.2.0]: https://github.com/shashi089/env-drift-check/compare/v0.1.5...v0.2.0
[0.1.5]: https://github.com/shashi089/env-drift-check/compare/v0.1.4...v0.1.5
[0.1.4]: https://github.com/shashi089/env-drift-check/releases/tag/v0.1.4
