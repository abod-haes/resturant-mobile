# Employee notification readiness (2026-11-19)

## In mobile
- Original separate waiter.wav/hookah.wav sounds bundled using Expo Notifications config plugin.
- Android MAX-importance channels restaurant-waiter-v1 and restaurant-hookah-v1 with native OS-controlled sounds.
- Foreground incoming/tapped event listener with Zod validation, cross-branch filtering, max 100 IDs dedupe, query reconciliation.
- App resume triggers call/shift GET reconciliation (no background polling, no call acknowledgement).
- User can request OS permission and generate local Expo push token; this is NOT registered with backend.

## BLOCKED: backend handoff
Backend lists POST /employee/devices {expoPushToken,platform} and DELETE /employee/devices/:id as draft only.
Before enabling registration, settle POST response {data:{id}} vs alternative, upsert policy, token rotation, logout device revocation, shift/account/branch scoping, stale token pruning, FCM/APNs.
Push data must carry {eventId,eventType,branchId,payload}; eventType is call.created or shift.updated. Backend delivery must set Android channelId restaurant-waiter-v1 / restaurant-hookah-v1; on iOS sound waiter.wav / hookah.wav.
Notification received is not proof of employee acknowledgement. No accept/complete actions in v1.

## Manual verification needed
Expo SDK 54 remote push does NOT work in Expo Go on Android; test a development build. A new native build is required for custom sound assets. Test Android/iOS in foreground/background, denied permissions, audio/silent settings, shift lifecycle and revoked devices. Not tested against production push service.
