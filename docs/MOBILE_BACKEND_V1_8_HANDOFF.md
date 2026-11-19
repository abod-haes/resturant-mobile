# Employee mobile — backend v1.8 DTO alignment

Canonical source: resturant-back/docs/API_CONTRACTS.md and generated Swagger /api/docs-json.
The employee auth and shift/call endpoints are implemented in backend source, not smoke-tested on staging.

## Live response shape
- GET /employee/shifts/current returns {data:Shift|null}.
- POST /employee/shifts/start returns HTTP 201 {data:Shift}; POST /employee/shifts/end returns HTTP 200 {data:Shift}.
- Shift fields: id, userId, branchId, department, startedAt, autoEndAt, endedAt.
- GET /employee/calls?cursor=&limit=20&type= returns {data:CallHistory[],meta:{hasMore,nextCursor}}.
- CallHistory fields: id, branchId, tableId, type, deliveryState, recipientsCount, ownerAlerted, createdAt.
- Cursor is opaque, default 20/max 100. Do not infer a real table label or physical delivery from identifiers or queued state.
- Backend filters calls to recipient call_outbox records, not the current client shift.

## Known blockers
- Employee call history does not supply displayable table label, floor or area; backend needs an employee-safe location contract to make the calls screen operationally useful.
- Device registration, push delivery and realtime are absent from backend v1.8. Notification preparation is not delivery.
- Existing fixture routingMode strings predate backend v1.8; mock approximates assignment until versioned fixtures are updated.
- Staging employee sign-in, role/tenant tests, shift, pagination, error cases and native push tests remain NOT RUN.
- Lint and native EAS builds are not configured as CI gates.
