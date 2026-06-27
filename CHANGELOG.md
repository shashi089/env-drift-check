# Changelog

All notable changes to `env-drift-check` are documented here.

This project follows [Keep a Changelog](https://keepachangelog.com/en/1.0.0/) and [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

## [Unreleased]

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

[Unreleased]: https://github.com/shashi089/env-drift-check/compare/v0.3.0...HEAD
[0.3.0]: https://github.com/shashi089/env-drift-check/compare/v0.2.3...v0.3.0
[0.2.3]: https://github.com/shashi089/env-drift-check/compare/v0.2.1...v0.2.3
[0.2.1]: https://github.com/shashi089/env-drift-check/compare/v0.2.0...v0.2.1
[0.2.0]: https://github.com/shashi089/env-drift-check/compare/v0.1.5...v0.2.0
[0.1.5]: https://github.com/shashi089/env-drift-check/compare/v0.1.4...v0.1.5
[0.1.4]: https://github.com/shashi089/env-drift-check/releases/tag/v0.1.4
