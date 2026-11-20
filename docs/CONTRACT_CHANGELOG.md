## v1.9 device registration and v1.2 mock seed — 2026-11-20
EmployeeApi adds typed `listDevices/registerDevice/unregisterDevice` with Zod-validated backend responses, ownership-scope mock semantics, max-five devices and redaction. Notification opt-in obtains Expo token and registers it; no token is stored in persisted application state or returned. The native Android channel names now exactly match backend Expo Push channel IDs `waiter_calls` and `hookah_calls`. Push payloads using `callId` (no `eventId`) are recognized for branch-scoped refetch. Shared mock-only fixture follows v1.2.0 demo seed. The backend is authoritative; Expo tickets are not handset delivery. No SSE transport was implemented in this change.

# Contract changelog

## v1.0.0-draft — 2026-11-18
- Initial shared API shapes for platform admin, restaurant owner, public QR/menu, employee shifts and calls.
- Any field/endpoint change must update contract, fixtures, mock handlers, tests and all affected clients.
