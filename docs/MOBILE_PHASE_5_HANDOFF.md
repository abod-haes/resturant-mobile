# Employee mobile Phase 5 — Responsive layout, RTL, dark/light and accessibility

## Scope & architecture
- Shared pure `resolveAppLayout(width,fontScale)` drives compact/narrow layouts and padding; the runtime hook `useAppLayout` (separate file) reads React Native window width and font scale. System Text/TextInput scaling stays enabled for meaningful text. **Do not scale fontSize twice, cap it, or use `adjustsFontSizeToFit`.** The decorative non-informational R mark is the only font-scaling exception.
- `colorPalettes` is the single light/dark source. Light `muted` was darkened to meet minimum 4.5:1 text contrast on surface, surfaceAlt and background. CI tests all representative semantic text/background pairs.
- `typeScale`, `spacing`, `radius` and `layoutTokens` provide reusable customization without literal values scattered across features.
- Shared `AppScreen` owns both safe-area and the OfflineBanner for every route, preventing a root-level double top inset while offline. Root navigator owns providers only.
- Themed `AppCard`, `AppButton`, `AppInput`, `AppErrorNotice`, `FieldError`, `Feedback`, `AppToast` respond to system text scaling, wrap labels, avoid fixed-height text containers, and expose accessibility labels/state and announcements.
- Call feed, filters and shift status use header roles, wrapped rows, and 48px minimum filter targets; on narrow/large-text layouts account header and device rows become stacked instead of squeezing.
- Arabic UI stays RTL with right-aligned text and row-reverse; credential entry explicitly uses LTR caret/direction to match the backend's Latin username. Global `I18nManager.forceRTL` is deliberately avoided because it requires a native reload and can double-reverse existing rows. Full runtime locale switching is out of this phase.
- Toasts are not automatically dismissed while the system screen reader is active and otherwise have length-dependent readable duration, with manual dismiss always available.

## Automated verification
- Run `npm run api:check`, `npm run api:generate`, `npm run check:architecture`, `npm run typecheck`, `npm run lint`, `npm run test`, and `npm run check:config` in GitHub Actions.
- `tests/responsive-theme.test.ts` checks 320/390/430/900dp and 2x system font behavior, invalid dimensions and WCAG AA >= 4.5:1 text-pair ratios on light/dark.
- Expo SDK 54 standard ESLint flat config and lint gate were introduced; `eslint-config-expo ~10.0.0` is dev-only.

## Device QA matrix — NOT RUN (requires native hardware/deployment)
| Scenario | Expected evidence |
| --- | --- |
| Android 320 x 568 / 360 x 780 / 390 x 844 | Form fields and every action visible, no horizontal overflow, keyboard scroll |
| iPhone 375/393 x 852 and large-screen iPhone | Correct Safe Area above content and below toast, keyboard avoidance |
| iPad landscape/portrait (where app orientation allows) | Max content width 760, max form width 560, no stretched cards |
| System font scale 1x/1.5x/2x/3x | All text expands, buttons and filter chips wrap, no clipped IDs or headings |
| Dark/light device theme | Readable muted, disabled, warning, success, primary, error components |
| RTL and Latin username/password | Caret and label direction correct, stable selection/focus |
| VoiceOver and TalkBack | Header navigation, meaningful labels for per-device removal, error/status announcements, dismissible toasts |
| Online/offline while viewing each route | A single offline banner inside device insets, query updates after reconnect |
| Empty/error/429/shift-conflict/cursor next page | Correct states and no accidental duplicate operations |

## Limits and release readiness
- No emulator, Android/iOS native build, real-device screenshots, TalkBack/VoiceOver session, push sound, or staging E2E was run. Passing TS/lint/unit tests must not be called physical UI verification.
- Backend employee call DTO still has only tableId, not display label/floor/area.
- Portrait orientation is declared in existing Expo config; tablet landscape is not implied by supportsTablet. Do not claim landscape QA without changing config and running builds.
- No backend contract, RBAC or authenticated transport change. Rollback: revert this PR.

Completion status: **code & CI ready after all checks pass, device and staging acceptance NOT COMPLETE**.
