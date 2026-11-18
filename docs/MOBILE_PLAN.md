# Employee Mobile — React Native + Expo (Android + iOS)
## Scope
Username/password, secure persistent auth/refresh, one branch and one department, shift start/end, call feed, foreground realtime and background Expo Push, distinct waiter/hookah sounds where platform allows. No accept/complete actions.

## Architecture
Expo Router, `src/features/{auth,shift,calls,notifications,profile}`, `src/shared/{api,types,ui,lib,config}`, `src/mocks`. TanStack Query for server state, SecureStore for credentials, typed API adapter, stateful in-memory mock adapter. Do not assume browser MSW works in native.

## Implementation
1. App shell, tokens, localization/RTL, secure session and protected routes.
2. Mock API adapter + scenario toggles (dev only); deterministic seeded fixtures.
3. Shift start/end, auto-end handling and owner-forced-end refresh.
4. Call history/list, branch/department routing, realtime reconnect + fetch catch-up.
5. Push registration, permission handling, notification channels/categories, custom sounds and fallback.
6. Offline/error states, device testing Android/iOS, background delivery limitations documented.
7. Contract tests and swap to live backend via config.

## Security and reliability
Never embed production push keys or user passwords. Handle revoked session, expired subscription, inactive shift, stale push token, offline reconnect. Notification means call created, not acknowledged.
