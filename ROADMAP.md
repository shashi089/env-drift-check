# env-drift-check — Adoption Roadmap

> Last updated: 2026-07-10

This document tracks the strategic roadmap for growing `env-drift-check` into the go-to environment configuration validation tool for modern development teams.

---

## Current State — v0.2.3 ✅

All original roadmap items are delivered. The tool covers:
- Environment drift detection
- Schema validation (7 types)
- Interactive CLI wizard
- Codebase scanner (`process.env` references)
- `.env.example` template generator
- JSON output for CI/CD
- Secret strength checks
- Deprecation warnings
- Multi-environment file support
- High-fidelity formatting preservation

---

## Phase 1 — Foundation & Trust `v0.3.x` ✅ COMPLETE

**Goal:** Make it safe enough for teams to depend on. Unlock CI/CD adoption.

| Status | Feature | Notes |
|---|---|---|
| ✅ | **Test suite (vitest)** | 47 tests across parser, validator, drift checker |
| ✅ | **`audit` command** | Checks `.gitignore`, git tracking, and git history for leaked `.env` files |
| ✅ | **`diff` command** | Side-by-side comparison of two `.env` files |
| ✅ | **Destructuring + Vite scanner** | Catches `const { X } = process.env` and `import.meta.env.VITE_X` |
| ✅ | **Shannon entropy scoring** | Replaces 10-word blocklist with real entropy math |
| ✅ | **`scan --fix` flag** | Auto-appends missing keys to `.env.example` |
| ✅ | **`loadConfig` error handling** | Clear error message on malformed `envwise.config.json` |
| ✅ | **GitHub Actions workflow example** | `.github/workflows/env-check.yml` + full README section |
| ✅ | **Pre-commit hook docs** | Husky + lint-staged integration guide in README |

---

## Phase 2 — Differentiation `v0.4.x` ✅ COMPLETE

**Goal:** Features no other tool has. Own the "modern full-stack env management" category.

| Status | Feature | Notes |
|---|---|---|
| ✅ | **Framework prefix awareness** | Detects Next.js / Vite / CRA from `package.json`; warns when `NEXT_PUBLIC_` leaks a server secret |
| ✅ | **Cross-variable conditional rules** | `"requiredIf": { "AUTH_TYPE": "oauth" }` — rules that depend on other variables |
| ✅ | **`default` values in schema** | `"PORT": { "type": "number", "default": "3000" }` — enables fail-safe library usage |
| ✅ | **`mustBeTrueIn` complement** | Mirror of `mustBeFalseIn` for enforcing feature flags in production |
| ✅ | **`--watch` mode** | Re-validates on every `.env` or `envwise.config.json` save (300 ms debounce) |
| ✅ | **SARIF output** | `--format sarif` → pipes results into GitHub Security tab (rule IDs EDC001–EDC005) |
| ✅ | **JS config support** | `envwise.config.js` loaded alongside JSON for dynamic configs |

---

## Patch — `v0.4.1` (next)

**Goal:** Small fixes and improvements on top of v0.4.0.

> Items to be confirmed before release.

---

## Phase 3 — Platform Ready `v0.5.0` ✅ COMPLETE

**Goal:** Support infrastructure-level workflows. Attract DevOps and platform engineers.

| Status | Feature | Notes |
|---|---|---|
| ✅ | **Kubernetes ConfigMap generator** | `gen-configmap`: splits `.env` into a K8s `ConfigMap` (safe) + `Secret` (sensitive) |
| ✅ | **Docker Compose env validation** | Parse `docker-compose.yml` and validate `environment:` blocks against schema |
| ✅ | **GitHub Actions marketplace action** | `uses: shashi089/env-drift-check@v1` — composite action with inputs for all commands and flags |
| ✅ | **Config inheritance / extends** | `"extends": ".env.base.config.json"` with per-environment overrides |
| ✅ | **Monorepo support** | Recursively validate env files across `packages/*`, aggregate results |

---

## Phase 4 — Stable Release `v1.0`

**Goal:** API stability, polished docs, production confidence.

| Status | Item |
|---|---|
| ⬜ | API stability guarantee — no breaking changes in `Rule`, `Config`, `DriftResult` interfaces |
| ⬜ | Full migration guide from `dotenv-safe`, `envalid`, `dotenv-linter`, and `dotenvx` |
| ⬜ | Dedicated docs site (VitePress or Starlight) |
| ⬜ | `CHANGELOG.md` with semantic versioning from this point |

---

## Competitive Position

| Feature | `dotenv-safe` | `envalid` | `dotenv-linter` | `dotenvx` | **`env-drift-check`** |
|---|:---:|:---:|:---:|:---:|:---:|
| Missing key detection | ✅ | ✅ | ✅ | ⚠️ basic | ✅ |
| Runtime library | ✅ | ✅ | ❌ | ✅ | ⚠️ secondary |
| CI/CD friendly | ✅ | ✅ | ✅ | ✅ | ✅ |
| Encryption | ❌ | ❌ | ❌ | ✅ | ❌ |
| Standalone CLI | ❌ | ❌ | ✅ | ✅ | ✅ |
| Schema validation (no code changes) | ❌ | ❌ | ❌ | ❌ | ✅ |
| Interactive fix wizard | ❌ | ❌ | ❌ | ❌ | ✅ |
| Codebase scanner | ❌ | ❌ | ❌ | ❌ | ✅ |
| Entropy-based secret scoring | ❌ | ❌ | ❌ | ❌ | ✅ |
| Git safety audit | ❌ | ❌ | ❌ | ❌ | ✅ |
| Environment diff | ❌ | ❌ | ✅ | ❌ | ✅ |
| Framework prefix safety | ❌ | ❌ | ❌ | ❌ | ✅ |
| Docker / Kubernetes support | ❌ | ❌ | ❌ | ❌ | ✅ |

---

## Version Timeline

```
v0.3.x  ──  v0.4.0  ──  v0.4.1  ──  v0.5.0  ──  v1.0
COMPLETE ✅  COMPLETE ✅   next        COMPLETE ✅  Stable
Foundation  Differentiation  (patch)   Platform
& Trust     complete                   Ready
```

---

## Contributing

Want to help ship Phase 3? Check the [issues](https://github.com/shashi089/env-drift-check/issues) or open a discussion. Features are tagged by phase.
