# ADR-0006: Quality gates: lint, typecheck, and tests before deploy

- **Status:** Accepted
- **Date:** 2026-06-05 (commits `63ad35c`, `363ee8c`, `a23f028`, `ae84816`)
- **Deciders:** Teo Parashkevov

## Context

The site deploys automatically on every push to the production branch. With no checks in front of that, a typo in a component or a broken migration would go straight to production.

## Decision

The `nextjs-site` package has these gates. CI enforces them in the `quality` job, which `build-and-deploy` depends on:

| Gate | Command | Blocking in CI |
| --- | --- | --- |
| ESLint 9 (flat config, `eslint.config.mjs`) | `npm run lint` | yes (on errors; warnings pass) |
| TypeScript strict mode | `npm run typecheck` | yes |
| Jest 30 + Testing Library, 50% global coverage threshold | `npm test -- --coverage` | yes |
| Prettier (`.prettierrc`) | `npm run format:check` | **no** (`continue-on-error`) |
| Content validation (`scripts/validate-content.ts`) | `npm run validate` | **no** (`continue-on-error`) |

Tests live in `nextjs-site/__tests__/`, mirroring the source tree (`components/`, `lib/...`).

## Alternatives considered

- **Vitest instead of Jest.** It would be faster and ESM-native, but Jest with `ts-jest` was already set up. The long `transformIgnorePatterns` list in `jest.config.js` is the price paid for Jest with ESM-only unified packages.
- **Pre-commit hooks (husky/lint-staged).** Not adopted. CI is the single enforcement point.

## Consequences

- Coverage is currently about 54% of statements (149 tests), only just above the threshold. New code without tests can push it below 50% and block deploys.
- Prettier is not enforced, and 27 files are currently unformatted. Making formatting blocking first requires a one-off `npm run format` commit.
- Tests that format dates are timezone-sensitive: they pass in UTC (CI) and fail in other timezones. See [known issues](../docs/handbook/known-issues.md).
- The gates only run where a CI runner executes the workflow. Under the current workflow triggers, that excludes pushes to `development` and `feature/*` (see ADR-0008).
