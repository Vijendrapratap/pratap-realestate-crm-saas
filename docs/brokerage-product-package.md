# Brokerage Product Package

This product should be packaged as a brokerage-owned CRM workspace, not only a marketing landing page.

## Operator Journey

1. Open `/dashboard`.
2. Review total leads, inbound queue, pending approvals, activities, and available inventory.
3. Search/filter leads by name, phone, source, owner, location, or stage.
4. Click a lead and ask the AI Sales Agent what to do next.
5. Submit a new lead through the backend ingest form or `/api/crm`.
6. Export JSON for inspection or migration.
7. Approve WhatsApp/voice actions before any external communication happens.

## Live Demo Routes

- `/` — landing page with clear dashboard and raw-data links.
- `/dashboard` — brokerage control room.
- `/api/health` — backend health check.
- `/api/crm` — CRM dataset, filters, and lead-ingest contract.
- `/api/crm?q=Vikram` — query by text.
- `/api/crm?stage=Hot` — filter by stage.
- `/api/agent` — safe demo agent endpoint; proposes CRM actions without sending messages/calls.

## Data Ownership Model

Current deployment uses a demo dataset served by the backend API so the workflow is visible immediately.

Production packaging should add a tenant-owned database:

- Managed Postgres: Neon, Supabase, or Vercel Postgres.
- Tenant table/model: every lead, activity, property, template, message, and call session belongs to one brokerage tenant.
- Admin export: JSON/CSV export from dashboard.
- Provider credentials: each brokerage owns its WhatsApp/voice/source credentials.
- Approval gates: AI drafts and updates CRM; humans approve high-value external sends/calls.

## Minimum Production Tables

- `tenants`
- `users`
- `leads`
- `inbound_leads`
- `activities`
- `properties`
- `agent_commands`
- `approval_queue`
- `integrations`

## Next Build Slice

Replace the demo arrays in `src/lib/crm-data.ts` with database-backed services while keeping the current API contracts stable:

- `GET /api/crm`
- `POST /api/crm`
- `POST /api/agent`

This keeps the dashboard usable while moving from demo data to brokerage-controlled tenant data.
