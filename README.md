# Restaurant Employee App

Expo + React Native app for restaurant waiter and hookah service-call staff, Android and iOS.

## Run
1. Use Node.js 20.19.x or newer supported by Expo SDK 54. Run `npm install` (without `--force` or `--legacy-peer-deps`).
2. Run `npx expo install --check`, `npx expo-doctor`, and `npm run typecheck` before starting the app.
3. When changing dependencies, commit the regenerated `package-lock.json` alongside `package.json` after a successful local install. Do not use `npm ci` until the lockfile is synchronized.
4. Set EXPO_PUBLIC_API_BASE_URL to the real backend URL ending in /api/v1.
5. Run npm start. All runtime builds use the live API, including local development. Mock fixtures are for automated tests only.

## Checks
npm run check:architecture
npm run typecheck
npm run test
npm run check:config

See docs/MOBILE_FOUNDATION.md and AGENTS.md for security restrictions, API handoff, and remaining slices. **Runtime mock mode is removed.**

## Push registration
The notification opt-in button registers an Expo device with the authenticated backend employee; Android channels match `waiter_calls`/`hookah_calls`. EAS project ID, FCM/APNs credentials, worker and a new native development build are required. See `docs/NOTIFICATIONS_HANDOFF.md`.
