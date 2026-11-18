# Mock-first development strategy
**Goal:** Build both web dashboards and the employee app while backend is in development. Backend OpenAPI is source of truth; `docs/API_CONTRACTS.md` is the human-readable draft.

## Architecture
- Define domain types and Zod schemas from shared contract; central `ApiClient` interface.
- Implement `HttpApiClient` and `MockApiClient` with identical method signatures.
- For web use MSW to intercept actual HTTP requests, with stateful handlers for CRUD, pagination, filtering, errors, 401 and latency. For Expo use an in-memory typed adapter or compatible fetch interception, NOT browser service workers.
- Select mode with `VITE_API_MODE=mock|live` (Vite), `EXPO_PUBLIC_API_MODE=mock|live` (Expo), and Next `NEXT_PUBLIC_API_MODE` if a separate customer repo is added.
- No mock-only UI logic. No hardcoded business records inside components.

## Coverage checklist
- Admin: create restaurant, plan limits, renewal, grace/expired, contact channels, audit.
- Owner: branch independence, categories, products, images, sold out/hidden, menu copy, tables/QR rotation, employees, routing settings, call history and analytics.
- Employee: login, shift start/end, auto end, branch isolation, live call events, push permission denial, offline reconnect.
- Public customer: QR welcome, general menu without call buttons, first-call confirmation, 4-hour idle session, 10-second cooldown, expired/revoked QR, no staff.
- Every collection supports realistic empty/loading/error/large datasets and pagination. Use deterministic seeded data and fake time controls for cooldown/session tests.

## Synchronization rules
1. API changes start in backend OpenAPI/contract and are documented in CONTRACT_CHANGELOG.
2. Update fixtures and both mock adapters in same coordinated change; validate against schema.
3. Run contract tests across backend, web and mobile; update snapshots only after review.
4. Mark breaking changes and coordinate deployments, never silently change mock field shapes.
5. Mock data must contain NO secrets, actual user information or production tokens.

## Known decisions
- Static table QR is not physical presence proof; no GPS in V1.
- 10s cooldown is scoped to table + call type server-wide; mock should simulate it.
- First-call confirmation is per browser/table visit, expires 4h after inactivity.
- No employee accept/complete actions; successful call means recorded, not read.
- Subscriptions renew only through platform admin; owner sees contact channels.
