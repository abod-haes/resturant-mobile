# Employee Expo — Auth v1.3 integration (2026-11-19)

## Backend contract
Canonical: abod-haes/resturant-back/docs/AUTH_DASHBOARD_HANDOFF.md, backend generated Swagger at /api/docs-json.
- POST /auth/login: {username,password,client:"mobile"} -> {data:{accessToken,expiresAt,user,refreshToken}}.
- POST /auth/refresh: {refreshToken} -> rotated accessToken + refreshToken.
- POST /auth/logout: {refreshToken} -> {data:{loggedOut:true}}.
- GET /auth/me: bearer -> {data:{id,role,restaurantId,branchId,department,mustChangePassword}}.
- POST /auth/change-password: bearer {currentPassword,newPassword}, changes revoke all sessions.

## Security
Only the rotating refresh credential is stored in expo-secure-store; access JWT stays in memory.
On launch, use refresh and overwrite the stored credential before enabling business navigation.
Single-flight renewal prevents accidental refresh-token reuse from concurrent 401 responses.
Refresh 401 clears local credentials and navigates to login. Transient network/server errors preserve the refresh credential for a retry.
Mandatory change-password gate blocks access to shift/calls screens; after change the user must sign in again.
Only role EMPLOYEE is accepted by the mobile client; server must enforce it on protected employee endpoints.
In mock mode any non-empty password authenticates known fixtures: strictly for local dev, never a production authentication mechanism.

## Limitations / handoff
Auth backend is implemented but staging access/actual device network tests are not yet verified.
Employee endpoints remain draft; no real shifts/calls integration until contract handoff.
Push device registration, Expo notifications, WebSocket realtime and audio remain separate upcoming slices.
Legacy persisted access-only credential is erased (users reauthenticate once).
CI must report strict TS, boundaries, unit tests, Expo config. Physical iOS/Android and auth staging integration are NOT RUN until configured.
