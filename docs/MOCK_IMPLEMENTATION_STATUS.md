# Stateful Mock API — v1.1.0
All four active repositories have identical normalized seed data at `mocks/fixtures.json`. The three UI repositories have a shared deterministic **in-memory** state engine at `src/shared/mock/engine.ts`. Backend keeps the canonical fixture copy for contract work.

## Implemented
- Normalized restaurants, plans, subscriptions, branches, floors, areas, tables, QR, categories, products, employees, shifts, calls, owner alerts, templates, contact methods.
- Stateful CRUD primitives: `mockDb.list/find/create/patch/archive/listPage` (cursor pagination).
- Scenario control: `mockControl.setScenario(name)`, `reset()`, `snapshot()`, `setState()`.
- Call engine: QR validation, 4-hour idle sessions, branch/table/call-type toggles, subscription/grace validation, atomic-in-process 10-second cooldown per table/type, idempotency key replay, on-shift department/all-staff routing, no-staff owner alert.
- Client adapters: dashboard restaurant create/product update; customer menu/session/call; employee shift/call history.
- Simulated offline, server error, slow network, no staff, revoked QR, disabled table, expired subscription, empty menu, cooldown.

## Not yet implemented (must not be described as complete)
- MSW HTTP handlers intercepting all REST endpoints; currently UI mock adapters call the engine directly.
- All admin/owner CRUD endpoints, media upload, subscription renewal workflows, realtime WebSocket and push notification simulation.
- Cross-app shared runtime: each repository has its own in-memory mock state; changes in one running app do NOT appear in another. A local shared mock server is needed for end-to-end integration.
- Automated tests and verified install/build on Android, iOS and web.
- Auth/role enforcement: mock UI routes are not secure and must never be deployed as production authorization.

## Change control (mandatory)
1. Backend updates OpenAPI + `docs/API_CONTRACTS.md`, documents migration in `docs/CONTRACT_CHANGELOG.md`.
2. Update the canonical fixture and distribute identical JSON to all consumers.
3. Update engine, adapters, scenario expectations and contract tests together.
4. CI must compare fixture hashes and schema versions; no manual drift.
5. Never use mock credentials or mock role guards as production security.

## Developer API
```ts
import { mockControl, mockDb, mockCalls } from "./src/shared/mock/engine";
mockControl.setScenario("no_active_staff");
mockControl.reset();
const page = mockDb.listPage("products", { branchId: "branch-1", limit: 20 });
```
