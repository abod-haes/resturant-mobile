# Phase 3 — Employee calls virtualized feed and shift hooks

Source of truth: backend GET /employee/calls supports cursor (opaque), limit and type=waiter|hookah. Employee history is scoped by server to authenticated recipient/branch; UI filters do not change server RBAC.

Architecture:
- src/features/shifts/useCurrentShift.ts: employee-specific TanStack Query shift state.
- src/features/shifts/useShiftActions.ts: start/end mutation, 409 refetch, validated success toast, errors and refresh. Exposed through shifts/index.ts.
- src/features/calls/model.ts: strict CallFilter, 20-item page, opaque next cursor gate, stable duplicate removal.
- src/features/calls/useEmployeeCalls.ts: server-side filter and separate query keys, abort signal, on-demand fetchNextPage, reset first page on pull-to-refresh.
- src/features/calls/CallsFilter.tsx: accessible controlled custom chips with all/waiter/hookah options; 44px targets, wrapping RTL layout and theme support.
- src/features/calls/EmployeeHomeScreen.tsx: composition-only virtualized FlatList; filters and shift in header, loading/empty/error in empty view, load more/alerts/notification settings in footer.

Behavior: default all types; selecting a filter resets scroll to top and uses a separate server-side cache. OnEndReached is only armed by an actual drag to prevent eager page draining on first render. Explicit 'عرض المزيد' remains available for short displays and accessibility. Pull-to-refresh resets only selected cursor chain and refreshes shift, not every previously fetched page. Display count is loaded items only, not fake total.

Remaining: employee call DTO lacks table label, floor and area. Mock approximates historical outbox routing; it cannot substitute for recipient-scoped live staging verification. Physical Android/iOS small/large layout, large font, iOS VoiceOver / Android TalkBack, offline and native build are NOT RUN. SSE/Push are a later phase.

QA gates: npm run api:check, api:generate, check:architecture, typecheck, test, check:config; no lint script or native EAS production build configured.

Rollback: revert PR for phase 3. No backend API or DTO change.
