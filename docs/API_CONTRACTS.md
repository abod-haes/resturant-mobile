# API Contract — v1 (Draft)
Base path: `/api/v1`. JSON envelope: `{data,meta?}`; errors: `{error:{code,message,details?},requestId}`. All IDs UUID strings, dates ISO-8601 UTC, money integer minor units plus currency. Tenant authorization is enforced server-side.

## Authentication
- POST /auth/login {username,password} -> {accessToken,user,expiresAt}; refresh token secure rotating credential
- POST /auth/refresh -> refreshed session; POST /auth/logout
- GET /auth/me -> {id,role,restaurantId?,branchId?}
- Employee account is assigned one branch and department; owner one restaurant.

## Platform
- GET/POST /admin/restaurants; GET/PATCH /admin/restaurants/:id
- GET/POST/PATCH /admin/plans; POST /admin/subscriptions/:id/activate; POST /admin/subscriptions/:id/renew
- GET/PATCH /admin/contact-methods; GET /admin/audit-logs

## Owner
- GET/POST/PATCH /owner/branches; GET/PATCH /owner/settings
- GET/POST/PATCH /owner/branches/:branchId/categories
- GET/POST/PATCH /owner/branches/:branchId/products
- POST /owner/branches/:branchId/menu/copy-from {sourceBranchId,includeTemplate}
- GET/POST/PATCH /owner/branches/:branchId/tables
- POST /owner/tables/:tableId/qr/rotate; POST /owner/tables/:tableId/qr/disable; GET /owner/branches/:branchId/qr/print
- GET/POST/PATCH /owner/employees; POST /owner/employees/:id/reset-password; POST /owner/employees/:id/end-shift
- GET /owner/calls?branchId=&type=&from=&to=&cursor=&limit=
- GET /owner/call-analytics; GET /owner/alerts
- PATCH /owner/branches/:branchId/call-settings {enabled,waiterEnabled,hookahEnabled,routingMode?}
- GET /owner/subscription

## Public
- GET /public/menu/:slug -> public menu (NO call credentials)
- GET /public/t/:qrToken -> {restaurant,branch,table,menu,callSettings}
- POST /public/t/:qrToken/sessions -> {sessionToken,expiresAt,firstCallNeedsConfirmation}
- POST /public/calls {sessionToken,type,idempotencyKey} -> {id,createdAt,deliveryState,ownerAlerted}
  - Server validates subscription, table, QR, session, branch, enabled buttons, 10-second cooldown per table/type.
  - `deliveryState` indicates queued/no-staff, not actual employee acknowledgement.
  - No GPS in V1. A static QR/session is not proof of physical presence.

## Employee
- POST /employee/shifts/start; POST /employee/shifts/end; GET /employee/shifts/current
- GET /employee/calls?cursor=&limit=
- POST /employee/devices {expoPushToken,platform}
- DELETE /employee/devices/:id

## Events
- Realtime `call.created`, `owner.alert.created`, `shift.updated`, `menu.updated`
- Event envelope {eventId,eventType,occurredAt,branchId,payload}; reconnect uses paginated GET as source of truth.

## Shared errors
UNAUTHORIZED, FORBIDDEN, NOT_FOUND, VALIDATION_ERROR, SUBSCRIPTION_INACTIVE, QR_REVOKED, TABLE_DISABLED, CALLS_DISABLED, CALL_TYPE_DISABLED, SESSION_EXPIRED, COOLDOWN_ACTIVE (retryAfterSeconds), RATE_LIMITED, NO_STAFF_AVAILABLE (call may still be recorded), INTERNAL_ERROR.

## Contract change protocol
1. Update backend canonical contract and OpenAPI schema first.
2. Increment contract version, add changelog and examples; preserve backward compatibility or coordinate breaking release.
3. Update shared fixtures and MSW/Expo mock adapters in all consumer repos in same change set.
4. Run schema and fixture validation, contract tests, then client CI.
5. Notify all three client owners; never silently rename fields or alter semantics.
