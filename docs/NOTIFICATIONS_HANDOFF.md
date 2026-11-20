# Employee push device integration (2026-11-20)

## Implemented in the Expo client
- Native Android channels `waiter_calls` and `hookah_calls` match the backend's Expo push payload channelId exactly. Custom bundled `waiter.wav` and `hookah.wav` are mapped by Expo config and require a new native build.
- The opt-in **Activate notifications on this device** action requests OS permission, gets an EAS project-scoped Expo push token, and registers it as EMPLOYEE using `POST /api/v1/employee/devices`. It never shows, logs, or persists the raw push token.
- Typed GET/POST/DELETE device APIs validate redacted server responses; in-memory mock uses deterministic idempotency, ownership and quota. Real devices require proper Expo EAS project ID, push credentials and an active backend push worker.
- Foreground/tapped notifications use schema parsing and branch restriction; both the `callId`-based backend Expo payload and `eventId` SSE-shaped events can trigger authenticated GET calls/shift reconciliation. Deduplication is bounded.
- Real native SSE stream is **not** connected; app resume and notification delivery trigger GET fallback. Push ticket acceptance never means the employee received or acknowledged a call.

## Backend / deployment prerequisites
Deploy backend v1.9+, configure `PUSH_TOKEN_ENCRYPTION_KEY`, start the separate push worker with `PUSH_DISPATCH_ENABLED=true`, verify EAS FCM/APNs credentials, EAS project ID and app package/bundle identifiers. API and worker must use the same database/encryption key. Backend stores token encrypted and handles Expo tickets and receipts.

## Remaining production tests
Verify iOS and Android physical devices (foreground/background/terminated state), OS permission denied, mute/sound channels, token refresh, log out or account change registration lifecycle, worker receipts and network egress. Implement authenticated, resumable SSE when the React Native stream transport is validated; do not send bearer tokens in URLs.
