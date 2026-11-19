> Historical foundation note (before backend v1.3 and v1.8). For current integration readiness see docs/AUTH_MOBILE_HANDOFF.md, docs/MOBILE_BACKEND_V1_8_HANDOFF.md, and docs/NOTIFICATIONS_HANDOFF.md.

# Employee app foundation — 2026-11-19

## Implemented
- Feature-first Expo Router shell with session-aware protected screens.
- Dark/light tokens and customizable accessible Button/Card/Input/Feedback primitives.
- Arabic RTL-oriented login, shift and cursor-paginated call-history UI.
- SecureStore access-token persistence and restore; 401 invalidates locally, offline restore retains token for retry.
- Typed mock/live EmployeeApi boundary with runtime Zod validation of live envelopes and typed errors.
- Independent stateful mock users from fixtures, department/branch scoped calls, shifts, offline scenarios.
- Unit tests for mock authentication, employee scope, shifts, and pagination.

## IMPORTANT: mock vs production
EXPO_PUBLIC_API_MODE defaults to mock for development. Mock login deliberately accepts any non-empty password for a known fixture username. **Mock mode provides no authentication/security and must NEVER be deployed as a production employee application.**
Set EXPO_PUBLIC_API_MODE=live and EXPO_PUBLIC_API_BASE_URL=https://YOUR-STAGING-HOST/api/v1 for staging. Credentials must be stored in SecureStore and never logs. Live mode has NO silent fallback to mock on failures.

## Contract blockers
- Backend currently exposes health endpoints, NOT real auth/shifts/calls. Live adapter is NOT integrated or tested against a server.
- Backend must finalize the refresh-token transport and rotation, expiry and revocation semantics for native apps BEFORE adding background refresh. Until then, stored access token is revalidated with GET /auth/me on launch; expired/401 results in sign-in.
- Backend must finalize actual shift DTO, employee profile name/department, and calls response fields including table/area/floor and cursor meta; adapter schemas are draft assumptions, not evidence of availability.
- Push registration / permission / background notification categories, distinct sounds, realtime reconnection/backfill, automatic/forced shift end remain for subsequent slices.
- Android package/application ID remains a placeholder; production signing and iOS bundle ID require confirmed identifiers and EAS configuration.

## Engineering quality
Run npm install, npm run check:architecture, npm run typecheck, npm run test, npm run check:config.
Use Expo Go/dev-client for manual device checks; no device/build verification has been performed in this change. Report PASS/FAIL/NOT RUN for each gate.
