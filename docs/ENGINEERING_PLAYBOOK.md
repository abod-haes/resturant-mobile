# Engineering playbook — Senior-level, enforceable conventions

## Architectural decision
Use the smallest structure that protects boundaries. Follow official Feature-Sliced Design dependency direction for React/Expo, NestJS feature modules for backend, workspace package exports for the two dashboards. No microservices or blanket "clean architecture" boilerplate. Introduce a layer only if it has meaningful logic or multiple implementations.

## Before any agent edits
1. Read AGENTS.md, docs/ARCHITECTURE.md, docs/API_CONTRACTS.md, docs/RBAC_MATRIX.md, docs/TEST_STRATEGY.md and the specific feature's code/tests.
2. Identify the owning module, data flow, consumers, permission scope and existing shared primitives. Inspect neighboring implementation before creating anything.
3. Write a concise impact plan in the PR description: files, behavior, contract impact, tests, rollback.
4. Avoid unrelated changes. If blocked by a missing contract, record the gap; do not invent server behavior.

## Source organization
- App/route entrypoints only compose providers/routes/screens.
- Pages compose features; features implement user capabilities; entities own reusable domain representations; shared owns generic UI, transport and utilities.
- Import only from lower layers. No cross-feature deep imports, no shared -> feature, no app -> app. Prefer public index.ts exports.
- Co-locate UI, hooks/model, schemas, API adapters and tests for one feature. Do not create empty folders or unnecessary interfaces.
- Shared UI primitives must be business-agnostic, accessible and themeable. Business components belong to their feature.
- Domain models, API DTOs, view models and persistence records are distinct when their semantics differ; mapping at boundaries.
- API transport and errors in one typed adapter; React Query for remote state, component state for ephemeral UI. No duplicated caches or global stores by default.
- Backend domain has no NestJS/ORM/HTTP dependencies. Use cases depend on ports. Infrastructure implements ports. Controllers are thin. Transactions enforce invariants.

## Code review checklist
- Clear names, cohesive functions, no implicit side effects or magic constants.
- No `any`, `@ts-ignore`, unchecked casts, `eslint-disable` without rationale, swallowing errors, or disabling tests.
- No circular imports, deep imports into sibling features, or business rules in JSX.
- No direct fetch/axios in UI. No DB calls from controllers. No duplicated permission logic.
- No token/password/PII logging, client-only authorization, trusting client tenant ID, or secrets in repo.
- No hardcoded currencies, timezone assumptions or locale-dependent business logic. All amounts minor units, dates UTC at API boundaries.
- Explicit async cancellation/cleanup, no unbounded polling, stable query keys, proper cache invalidation, pagination 20 default and max 100.
- Error/loading/empty/unauthorized/offline states, Arabic RTL and accessibility for every interactive screen.
- Tests for behavior and failure modes; run architecture check, strict TS, lint, tests, build. Report failures honestly.
- Contract changes are versioned and coordinated; fixtures are independent at runtime but schemas must agree.

## Pull request definition of done
Architecture gate passes; no unintended dependency; no security regression; documented user-visible behavior; tests and deployment smoke checks recorded; no unrelated formatting churn.

## Sources / rationale
- https://feature-sliced.design/docs/reference
- https://feature-sliced.design/docs/get-started/overview
- https://nx.dev/docs/features/enforce-module-boundaries
- https://docs.nestjs.com/modules
- https://docs.expo.dev/router/introduction/
