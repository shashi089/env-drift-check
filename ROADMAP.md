# env-drift-check — Adoption Roadmap

> Last updated: 2026-06-30

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
| ⬜ | **VS Code extension** | Inline squiggles on `.env` entries that fail schema rules (separate project) |

---

## Phase 3 — Platform Ready `v0.5.x`

**Goal:** Support infrastructure-level workflows. Attract DevOps and platform engineers.

| Status | Feature | Notes |
|---|---|---|
| ⬜ | **Kubernetes ConfigMap generator** | `gen-configmap`: splits `.env` into a K8s `ConfigMap` (safe) + `Secret` (sensitive) |
| ⬜ | **Docker Compose env validation** | Parse `docker-compose.yml` and validate `environment:` blocks against schema |
| ⬜ | **GitHub Actions marketplace action** | `uses: shashi089/env-drift-check@v1` — star counts, one-click CI adoption |
| ⬜ | **Config inheritance / extends** | `"extends": ".env.base.config.json"` with per-environment overrides |
| ⬜ | **Monorepo support** | Recursively validate env files across `packages/*`, aggregate results |
| ⬜ | **Secret manager integrations** | Read from Doppler, AWS SSM, or Vault to validate live secrets without exposing them |

---

## Phase 4 — Stable Release `v1.0`

**Goal:** API stability, polished docs, production confidence.

| Status | Item |
|---|---|
| ⬜ | API stability guarantee — no breaking changes in `Rule`, `Config`, `DriftResult` interfaces |
| ⬜ | Full migration guide from `dotenv-safe` and `envalid` |
| ⬜ | Dedicated docs site (VitePress or Starlight) |
| ⬜ | `CHANGELOG.md` with semantic versioning from this point |
| ⬜ | Published GitHub Actions action on the marketplace |
| ⬜ | Python / Go / Ruby codebase scanner support |

---

## Competitive Position

| Feature | `dotenv-safe` | `envalid` | **`env-drift-check`** |
|---|:---:|:---:|:---:|
| Missing key detection | ✅ | ✅ | ✅ |
| Schema / type validation | ❌ | ✅ | ✅ |
| Interactive CLI fix | ❌ | ❌ | ✅ |
| Zero code changes needed | ❌ | ❌ | ✅ |
| Codebase scanner | ❌ | ❌ | ✅ |
| Formatting preservation | ❌ | ❌ | ✅ |
| `diff` two env files | ❌ | ❌ | ✅ |
| Git safety audit | ❌ | ❌ | ✅ |
| Entropy-based secret check | ❌ | ❌ | ✅ |
| Framework prefix awareness | ❌ | ❌ | ✅ |
| K8s ConfigMap generation | ❌ | ❌ | Planned v0.5 |

---

## Version Timeline

```
v0.2.3  ──  v0.3.x  ──────────  v0.4.x  ──────────  v0.5.x  ──  v1.0
 done      COMPLETE ✅          COMPLETE ✅           Platform    Stable
           Foundation           Differentiation      (next)
           & Trust
```

---

## Contributing

Want to help ship Phase 2 or 3? Check the [issues](https://github.com/shashi089/env-drift-check/issues) or open a discussion. Features are tagged by phase.
