# env-drift-check — Roadmap

> Last updated: 2026-07-17

---

## v0.3.x ✅

- Test suite (47 vitest tests — parser, validator, drift checker)
- `audit` command — gitignore, tracking, and history checks for leaked `.env` files
- `diff` command — side-by-side comparison of two `.env` files
- Destructuring detection (`const { X } = process.env`) and Vite (`import.meta.env.X`) in scanner
- Shannon entropy scoring for secret strength (replaces word blocklist)
- `scan --fix` — appends missing keys to `.env.example`; creates file if it doesn't exist
- GitHub Actions workflow example + Husky/lint-staged pre-commit docs

---

## v0.4.x ✅

- Framework prefix awareness — warns when `NEXT_PUBLIC_`, `VITE_`, or `REACT_APP_` prefixed vars look like secrets
- `requiredIf` — key is required only when another key matches a specific value
- `default` values in schema — keys with a default are never reported missing
- `mustBeTrueIn` — counterpart to `mustBeFalseIn` for production feature flag enforcement
- `--watch` mode — re-validates on file save with 300 ms debounce
- `--format sarif` — SARIF 2.1.0 output for GitHub Security tab (rule IDs EDC001–EDC005)
- `envwise.config.js` support — dynamic configs with comments

---

## v0.5.0 ✅

- `gen-configmap` — splits `.env` into a Kubernetes ConfigMap (safe keys) + Secret (sensitive keys)
- `validate-compose` — validates `environment:` blocks per service in `docker-compose.yml`
- GitHub Actions marketplace action (`action.yml`) — `uses: shashi089/env-drift-check@v1`
- Config inheritance via `extends` — deep-merge with circular reference detection
- `monorepo` command — per-package config, aggregate pass/fail summary

---

## v1.0

- [ ] API stability — no breaking changes in `Rule`, `Config`, `DriftResult`
- [ ] Migration guide from `dotenv-safe`, `envalid`, `dotenv-linter`, `dotenvx`
- [ ] Dedicated docs site

---

PRs and issues welcome — see [issues](https://github.com/shashi089/env-drift-check/issues) for tagged work items.
