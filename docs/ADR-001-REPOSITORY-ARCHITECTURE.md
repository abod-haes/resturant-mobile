# Architecture Decision Record ADR-001 — repository boundaries
Date: 2026-11-18. Status: Approved.
- `resturant-back`: NestJS + PostgreSQL API, authoritative OpenAPI and contracts.
- `retuarant-dash`: ONE React + Vite application for BOTH Super Admin and Restaurant Owner; share UI, auth framework, API client and design tokens, but isolate routes and permissions.
- `resturant-customer`: separate React + Vite application for customer QR and public menu.
- `resturant-mobile`: React Native + Expo employee application.
- `resturant-dash-admin`: legacy/reference repo; superseded by unified dashboard. No automatic deletion.
- No Next.js in approved architecture. Previous Next.js plans are superseded.
- Mock fixtures must track backend contract; all client repos use same shapes, with typed mock/live adapters.
- Current mock fixtures are starter examples, NOT complete executable mock handlers.
