# Employee mobile Phase 2 — Dynamic Feedback & Errors

Scope:
- Safe typed error normalization from backend code/status/requestId/retryAfterSeconds and allowlisted validation field names.
- Localized AR/EN error copy with no raw server messages, user secrets, validation strings or stack traces.
- Reusable AppErrorNotice inline/screen, FieldError, AppInput error support, OfflineBanner and single-toast provider.
- 429 countdown guards login/password and shift mutations; cooldown is preserved across input changes.
- Shift 409 conflicts re-fetch current status without marking an action successful.
- GET calls show contextual retry notices; push registration reports success only after backend registration.
- 403 PASSWORD_CHANGE_REQUIRED marks authenticated user as requiring password change; Expo Router guard redirects.
- Support requestId displayed as selectable sanitized text. No extra native clipboard library.

Quality: architecture, typecheck, unit, Expo config are CI gates. Manual native accessibility, font-scale, RTL screenshots and staging integration are not claimed.
Limitations: Full app-wide i18n, FlatList, SSE, device management and end-to-end QA belong to later phases.
Backend 96-route contract remains unchanged; no new API fields invented.
