# Restaurant Employee App

Expo + React Native app for restaurant waiter and hookah service-call staff, Android and iOS.

## Run
1. Use Node 20; npm install.
2. Set EXPO_PUBLIC_API_MODE=mock (default) for the local demo.
3. npm run start. Demo usernames come from mocks/fixtures.json (for example waiter.demo and hookah.demo). Any non-empty password works **only in mock mode**.
4. To point at a staging backend, set EXPO_PUBLIC_API_MODE=live and EXPO_PUBLIC_API_BASE_URL to the base ending in /api/v1. The real employee endpoints are not available yet.

## Checks
npm run check:architecture
npm run typecheck
npm run test
npm run check:config

See docs/MOBILE_FOUNDATION.md and AGENTS.md for security restrictions, API handoff, and remaining slices. **Never ship in mock mode.**
