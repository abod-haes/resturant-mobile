# Employee mobile — Integration phases 0 and 1

Source of truth: executable backend NestJS Swagger JSON for abod-haes/resturant-back at commit d354b7edd9af01e618a23257544221ac174abf3d.
GitHub Actions run 44753295231, artifact restaurant-openapi-runtime (ID 14635852991) contains restaurant.openapi.json.
Full runtime JSON SHA-256: e43863d066088ef59f09e3bb392d8c1a87fdac34db0bed28e0d12d5baaf921a2.
This repository pins only its 12 auth/employee paths and reachable 19 schemas in contracts/employee.openapi.json (Swagger version 0.12.0).

Commands:
- npm run api:check: validates pinned contracts, required routes, DTO members and redacted push response.
- npm run api:generate: generates the TypeScript declarations from the pinned executable OpenAPI snapshot.
- npm run api:check -- /path/to/restaurant.openapi.json: also detects drift against a full runtime Swagger JSON from the SAME deployed backend revision.
- node scripts/api-contract.mjs update /path/to/restaurant.openapi.json: explicitly update the snapshot after backend review.
Never use handwritten YAML or mock fixtures as the primary source for generated response contracts.
Automated CI only validates the pinned snapshot; it does NOT automatically access future private backend artifacts without cross-repository permissions.

Known upstream Swagger issues: ShiftDto.endedAt and UserDto nullable UUID fields are described as objects instead of runtime strings/null. Some reply types (including SSE) have descriptions but no JSON schemas. Runtime Zod stays strict until backend fixes decorators. CallHistory has no table display label/floor/area.

Transport: single reusable cancellable HttpClient, HTTPS base URL ending /api/v1, timeout, JSON/no-content, redacted user-facing structured errors with requestId/details, 401 single-flight refresh. Public login/refresh/logout do not send bearer. Late 401s cannot rotate twice. Read queries opt into abort signals; React Query uses NetInfo onlineManager, AppState focusManager, and bounded transient-GET retry; no mutation auto retries. Access token in memory and rotating refresh token in SecureStore.

NOT RUN: staging/live integration, real device build, SSE/native push testing, full dynamic feedback UI (phase 2), responsive/FlatList audit (phase 3/5), cross-repo automatic contract drift check.
