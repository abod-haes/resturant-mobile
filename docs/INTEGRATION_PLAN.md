# Integration and acceptance test matrix
1. Authentication: expired access, refresh rotation, revoked tokens, role isolation, password reset.
2. Tenancy: owner cannot read/write other restaurant; employee cannot access other branch.
3. Menu: branch independent copy, hidden/sold-out, Arabic search, image failure, large pagination.
4. QR: stable on table rename; rotation revokes old sessions; disabled QR/table/branch rejects calls.
5. Calls: 10s cooldown per table/type across clients; idempotency on retries; 4h idle session; first call confirmation.
6. Notifications: all-branch vs department routing, shift start/end/auto-end, push failure and realtime reconnect.
7. No-staff: call saved, owner alert shown and external notification attempted, accurate customer message.
8. Subscriptions: grace then operational block; contact-only renewal; admin renew restores.
9. Mobile: Android/iOS permission denial, background, offline, stale push token.
10. Ops: backup restore drill, audit integrity, monitoring alert, pilot load tests.
