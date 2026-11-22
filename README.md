# Restaurant Employee App

Expo + React Native app for restaurant waiter and hookah service-call staff, Android and iOS.

## Run
1. Use Node.js 20.19.x or newer supported by Expo SDK 54. Run `npm install` (without `--force` or `--legacy-peer-deps`).
2. Run `npx expo install --check`, `npx expo-doctor`, and `npm run typecheck` before starting the app.
3. When changing dependencies, commit the regenerated `package-lock.json` alongside `package.json` after a successful local install. Do not use `npm ci` until the lockfile is synchronized.
4. Set EXPO_PUBLIC_API_MODE=mock (default) for the local demo.
5. npm run start. Demo usernames come from mocks/fixtures.json (for example waiter.demo and hookah.demo). Any non-empty password works **only in mock mode**.
6. To point at a staging backend, set EXPO_PUBLIC_API_MODE=live and EXPO_PUBLIC_API_BASE_URL to the base ending in /api/v1. Auth, shifts, calls and employee push-device APIs are implemented in the backend, but deployed staging and device delivery are not verified.

## Checks
npm run check:architecture
npm run typecheck
npm run test
npm run check:config

See docs/MOBILE_FOUNDATION.md and AGENTS.md for security restrictions, API handoff, and remaining slices. **Never ship in mock mode.**

## Push registration
The notification opt-in button registers an Expo device with the authenticated backend employee; Android channels match `waiter_calls`/`hookah_calls`. EAS project ID, FCM/APNs credentials, worker and a new native development build are required. See `docs/NOTIFICATIONS_HANDOFF.md`.
