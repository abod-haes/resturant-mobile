# Phase 4 — Authenticated employee realtime SSE, push reconciliation and device management

## Backend contract verified (main, API_CONTRACTS v1.9)
- GET /api/v1/employee/events?after=0 uses Bearer header, Last-Event-ID cursor, heartbeat, 5-minute server close and 2-second replay checks; event data includes eventId, eventType, occurredAt, branchId, payload.
- SSE IDs are restaurant-scoped monotonically increasing decimal sequences, NEVER JWTs and NEVER placed in URLs. The client receives only employee-allowed scoped events.
- Push is sent by a separate optional worker (PUSH_DISPATCH_ENABLED=true on WORKER only) with encrypted device token storage and Expo receipts; an accepted ticket/receipt does not establish phone delivery or reading.

## Mobile implementation
- Expo SDK 54 expo/fetch streaming Response.body uses TextDecoderStream; this is distinct from RN's conventional non-streaming fetch. No separate EventSource native module.
- One shared stream port per authenticated employee: bearer token in Authorization header, Last-Event-ID from previous event, 401 rotates via existing SessionProvider single-flight, 403 stops and routes mandatory password update, capped backoff+jitter for connection failures, abort on background/offline/logout, re-open on foreground/online.
- Only foreground SSE; background notifications are the OS responsibility. Every fresh stream connection, app return and reconnect triggers authoritative REST query invalidation, with bounded batching for large event replays.
- SSE and Push use one shared employee event routing/dedup set (prefer callId), branch check, bounded set; SSE is NEVER an audible or OS-generated alert to avoid duplicates.
- App GET /employee/devices lists active devices, POST registers current Expo token with permission and channel setup, DELETE removes selected device after explicit native confirmation. The device token is never displayed, persisted in JS storage, or logged.
- Existing Expo Android channels waiter_calls/hookah_calls and native waiter.wav/hookah.wav remain configured.

## Limitations / manual QA
- Physical Android+iOS development builds with EAS Project ID, APNs/FCM credentials, real staff shift, exact sound file/channel/permission verification: NOT RUN.
- Expo SDK 54 streaming/chunk decoding and keepalive need physical device and deployed staging validation beyond CI simulation.
- SSE cursor is in memory per authenticated session and reconciles with REST after app restart; it is not persisted across accounts.
- Logout revokes JWT session but backend documentation does not guarantee revocation of all registered push devices on logout; employees can explicitly remove devices. Consider server-side device revocation tied to logout/disabled employee.
- Server response has no readable table label/floor/area in employee calls, remains a backend contract gap.
- No native production build or E2E evidence; CI only checks architecture, TS, contract snapshot, unit tests and Expo config.

Rollback: revert Phase 4 PR. No backend API change.
