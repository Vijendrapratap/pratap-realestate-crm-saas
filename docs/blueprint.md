# Pratap AI Real Estate CRM SaaS — Blueprint

> Source brief: `Pratap_AI_RealEstate_Proposal_1.docx`  
> Repo: `/home/pratap/agents/pratap-realestate-crm-saas`  
> Reference analysis: `docs/source-repo-analysis.md`  
> Archetype: vertical SaaS CRM for Indian real estate brokerages and developers

## 1. Project Overview

Build a premium, AI-centric real estate sales platform where the central AI Sales Agent talks to internal users, takes CRM requests, updates records, queues approvals, and uses WhatsApp/voice as communication channels. The platform helps brokerages and developers capture every lead, qualify prospects through Hindi/English AI voice calls, follow up automatically, manage agent pipelines, track manager analytics, and match buyer requirements to property inventory.

The product should feel like an AI operating layer on top of a focused vertical CRM: explicit real estate objects, tenant-aware SaaS schema, modular provider integrations, audited agent actions, and a guided onboarding/configuration flow.

## 2. Product Goals

- Replace spreadsheet-first lead handling with an AI Sales Agent backed by a CRM source of truth.
- Let sales users talk to the AI Sales Agent to update leads, create callbacks, ask for stale/hot opportunities, and prepare follow-ups.
- Give agents a clear workspace for calls, WhatsApp, tasks, stages, notes, and inventory recommendations.
- Give managers visibility into leakage: stale leads, missed callbacks, slow response, weak source ROI, underperforming agents.
- Automate first response and follow-up without removing human oversight for high-value actions.
- Make every AI/automation action auditable through an immutable activity timeline.
- Keep infrastructure simple enough for a founder-led MVP while leaving room to integrate or self-host deeper systems later.

## 3. Success Metrics

- Speed-to-lead under 60 seconds for inbound digital leads.
- 100% of leads have source, owner, stage, next action, and latest activity.
- Every call, message, assignment, note, task, stage change, and property send creates an activity event.
- Inventory shortlist generated in under 5 seconds with human-readable match reasons.
- Managers can identify top 5 leaked/stale opportunities in under 30 seconds.

## 4. Recommended Stack

- **Framework:** Next.js 16 App Router + TypeScript — already scaffolded; supports app UI and API routes in one repo.
- **Styling:** Tailwind CSS v4 — fast CRM UI iteration with Pratap brand palette.
- **Database:** Supabase Postgres — managed Postgres, auth option, realtime, RLS, low ops.
- **Auth:** Supabase Auth for simplest initial ops, or Clerk if organization/team UX becomes more important than reducing vendors.
- **ORM / DB access:** Drizzle or direct typed Supabase queries for V1; avoid heavy abstraction until schema stabilizes.
- **Automation glue:** n8n for external lead-source ingestion and low-code workflow glue.
- **Messaging:** WhatsApp Business Cloud API + SMS abstraction, borrowing helper patterns from wacrm.
- **Voice:** Provider interface first; start with hosted voice provider for MVP; design to support Dograh/self-host later.
- **Agents:** Central AI Sales Agent for user chat, CRM record updates, task creation, draft generation, approval queueing, onboarding, campaign drafting, manager analysis, transcript QA, and inventory copy. Agent writes must go through audited API actions and permission checks.
- **Deployment:** Vercel for app, Supabase for DB/auth/realtime, n8n Cloud or small self-hosted n8n, provider-managed WhatsApp/voice services.

## 5. Source Repo Lessons

### Twenty

Use Twenty as the CRM architecture/design reference, not the V1 codebase. Borrow workspace/settings/activity/API-key concepts and dense CRM UX. Avoid forking now because the monorepo, generic metadata engine, NestJS/GraphQL backend, Redis workers, and object model are heavier than needed for a vertical MVP.

### wacrm

Use wacrm as the closest implementation reference. It matches our stack direction: Next.js, Supabase, Tailwind, WhatsApp CRM, conversations, messages, templates, broadcasts, automations, and flow runs. Adapt its WhatsApp helper style, schema ideas, realtime publications, and service-role execution queues, but convert user-scoped data to tenant-scoped data.

### Dograh

Use Dograh as the voice architecture reference. Borrow organization-scoped telephony configs, workflow/campaign/call session concepts, transcripts/recordings, retry/circuit-breaker thinking, and provider abstraction. Do not embed its full FastAPI/Redis/MinIO stack in V1 unless voice volume or control requirements justify it.

## 6. High-Level Architecture

```text
Lead Sources
  Meta Ads / Google / 99acres / MagicBricks / Website / Walk-in / CSV / Sheets
        │
        ▼
Central AI Sales Agent
  Normalize requests, answer users, dedupe, route, draft, queue approvals, audit actions
        │
        ▼
CRM Core
  Tenants → Users/Roles → Leads → Activities → Tasks → Pipeline → Inventory
        │
        ├── WhatsApp/SMS Engine
        │     Conversations, messages, templates, broadcasts, delivery/read/reply status
        │
        ├── Voice Qualification Engine
        │     Provider adapter, call sessions, transcripts, outcomes, recordings, cost
        │
        ├── Inventory Matching
        │     Lead requirements → ranked property shortlist → explainable reasons
        │
        └── Hermes/Subagent Layer
              Onboarding, campaign drafting, manager reports, transcript QA, shortlist copy
```

## 7. Core Product Modules

1. **Tenant & Onboarding**
   - Company profile, team setup, roles, locations, property types, language preferences.
   - Guided setup creates default stages, sources, templates, scripts, assignment rules, and report preferences.

2. **Lead Capture & CRM Core**
   - Ingest from Meta, Google, property portals, referrals, walk-ins, website forms, Google Sheets, and CSV.
   - Dedupe by normalized phone/email.
   - Route by source, area, budget, project, or round-robin.
   - Lead profile with complete timeline.

3. **Agent Workspace**
   - Pipeline board, lead list, task list, lead detail, notes, next-best action.
   - Activity timeline combining WhatsApp, SMS, calls, notes, assignments, tasks, and inventory sends.

4. **WhatsApp/SMS Follow-up Engine**
   - Templates by language and outcome.
   - Outcome-based sequences: interested, callback, no answer, not interested, site visit, negotiation.
   - Broadcasts for cold leads, inventory launches, callback reminders, event invites.

5. **AI Voice Qualification**
   - Hindi/English outbound qualification.
   - Call outcome classification.
   - Transcript and recording logging.
   - Retry rules and human handoff for hot/callback leads.

6. **Inventory Matching**
   - Structured property inventory.
   - Lead requirement capture.
   - Ranked property shortlist with explainable fit reasons.
   - WhatsApp-ready shortlist send-out with activity logging.

7. **Management Analytics**
   - Pipeline value, conversion funnel, ageing leads, source ROI, response SLA, agent activity.
   - Daily manager briefing generated by Hermes from real CRM data.

8. **Provider & API Settings**
   - WhatsApp, SMS, voice, LLM/STT/TTS, n8n webhooks, API keys.
   - Tenant-scoped credentials and audit logs.

## 8. Data Model

All customer-owned tables must include `tenant_id` and every read/write must validate tenant access.

### Core Entities

- `tenants`: customer organization.
- `users`: account users.
- `tenant_memberships`: user-to-tenant role mapping.
- `lead_sources`: configured sources and ingestion settings.
- `leads`: primary prospect record.
- `lead_requirements`: structured buyer/renter requirement fields.
- `activities`: immutable timeline events.
- `tasks`: callbacks, site visits, follow-ups, approvals.
- `pipelines` and `pipeline_stages`: configurable lifecycle.
- `properties`: projects/units/inventory.
- `property_matches`: ranked lead-property matches with explanations.
- `conversations`: channel thread tied to lead.
- `messages`: WhatsApp/SMS message records.
- `message_templates`: approved templates.
- `broadcasts` and `broadcast_recipients`: campaign send state.
- `automations`, `automation_steps`, `automation_runs`, `automation_pending_executions`: follow-up workflows.
- `call_sessions`: AI/human voice calls, transcripts, outcomes, recording URLs, duration/cost.
- `provider_configs`: tenant-scoped WhatsApp/SMS/voice/LLM/n8n credentials.
- `onboarding_profiles`: setup answers and generated configuration drafts.
- `approval_requests`: human approval queue for AI-drafted campaigns/templates/scripts.

### Lead Stages

Default stages:

1. New
2. Contacted
3. Cold
4. Warm
5. Hot
6. Negotiation
7. Closed Won
8. Closed Lost

Custom stages can come later. V1 should keep these defaults for clear analytics.

## 9. API Design

Initial route groups:

- `POST /api/ingest/leads` — receive n8n/source lead payloads.
- `GET /api/leads` / `POST /api/leads` — list/create leads.
- `GET /api/leads/:id` / `PATCH /api/leads/:id` — read/update lead.
- `POST /api/leads/:id/activities` — append activity.
- `POST /api/leads/:id/stage` — move stage and write activity.
- `GET /api/properties` / `POST /api/properties` — inventory.
- `POST /api/leads/:id/matches` — generate property matches.
- `POST /api/messages/send` — send WhatsApp/SMS through provider abstraction.
- `POST /api/webhooks/whatsapp` — receive inbound WhatsApp events.
- `POST /api/calls/start` — start qualification call.
- `POST /api/webhooks/voice` — receive call completion/transcript/outcome.
- `GET /api/analytics/manager` — manager dashboard data.
- `POST /api/onboarding/generate-config` — Hermes-assisted setup draft.
- `POST /api/approvals/:id/approve` — approve drafted templates/campaigns/scripts.

## 10. Frontend Route Map

- `/` — current public/prototype overview.
- `/app` — CRM dashboard home.
- `/app/leads` — lead table and pipeline filters.
- `/app/leads/[id]` — lead profile, timeline, requirements, tasks, messages, calls, matches.
- `/app/pipeline` — Kanban board.
- `/app/inbox` — WhatsApp/SMS conversations.
- `/app/inventory` — property inventory and availability.
- `/app/automations` — follow-up sequences and flow builder.
- `/app/calls` — AI voice campaigns and call sessions.
- `/app/analytics` — manager analytics.
- `/app/onboarding` — guided customer setup.
- `/app/settings` — team, roles, providers, templates, API keys, webhooks.

## 11. Design System

Use Pratap brand language:

- Black: `#0A0A0B`
- Carbon: `#14141A`
- Bronze: `#C9A961`
- Champagne: `#E2C97F`
- Bone: `#F4F1E8`
- Warm gray: `#EAE5D6`
- Vermilion: `#B5413B`

Style: premium B2B SaaS, high contrast, rounded panels, dense information hierarchy, CRM clarity inspired by Twenty, with WhatsApp/voice/real-estate command center cues.

## 12. AI Sales Agent Layer

The product is AI-centric. The AI Sales Agent is the primary operating layer over the CRM, not a side feature.

The AI Sales Agent may:

- Chat with internal sales users and managers.
- Search, summarize, and explain CRM records.
- Update lead fields, owner, stage, tasks, next action, notes, and activity entries through audited API actions.
- Draft WhatsApp templates, call scripts, campaign plans, property shortlist messages, and manager briefings.
- Queue approval requests for external messages, voice calls, discounts, property sends, and sensitive updates.
- Review call transcripts and flag opportunities or script problems.
- Explain property shortlist matches and draft personalized messages.

The AI Sales Agent must not bypass tenant permissions, audit logs, or approval gates. External sends and calls require approval unless the tenant has explicitly configured an audited automation rule.

## 13. Build Order

1. **Completed:** Scaffold Next.js SaaS shell with Tailwind and project instructions.
2. **Completed/Started:** Static CRM prototype on `/` with mock leads, metrics, pipeline, modules, and inventory matches.
3. **Next:** Convert prototype into route-based app shell with navigation and shared layout.
4. Add typed domain model files for tenant, user, lead, activity, task, property, message, call session, automation.
5. Add Supabase schema/migrations with tenant-aware tables and seed data.
6. Add auth and tenant membership model.
7. Implement lead list, detail, stage movement, task creation, and activity timeline.
8. Implement property inventory and explainable matching service.
9. Implement WhatsApp/SMS provider abstraction and template model using wacrm-style named-argument helpers.
10. Implement n8n/source lead ingestion endpoints with dedupe and assignment rules.
11. Implement conversations/messages and inbound WhatsApp webhook.
12. Implement automation model and outcome-based follow-up runner.
13. Implement voice provider interface and `call_sessions` with webhook completion path.
14. Add manager analytics and Hermes daily briefing data endpoint.
15. Add onboarding flow and Hermes-generated configuration draft/approval queue.
16. Add tests for matching, lead ingestion, activity timeline, tenant permissions, provider helpers, and critical user flows.
17. Add deployment docs, `.env.example` updates, and operational runbook.

## 14. Environment Variables

Initial planned variables:

```bash
NEXT_PUBLIC_APP_URL=
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
DATABASE_URL=
N8N_WEBHOOK_SECRET=
WHATSAPP_VERIFY_TOKEN=
WHATSAPP_APP_SECRET=
VOICE_PROVIDER=
VOICE_WEBHOOK_SECRET=
HERMES_API_URL=
HERMES_API_TOKEN=
```

Do not commit real secrets.

## 15. Testing Strategy

- Unit tests for property matching, lead scoring, phone normalization, WhatsApp helper payloads, and automation branching.
- Integration tests for lead ingestion, dedupe, stage movement, activity append, provider webhooks, tenant access checks.
- E2E smoke tests for login, create lead, move stage, add task, send template draft, generate match.
- Build verification: `pnpm lint`, `pnpm typecheck`, `pnpm build`, or `pnpm check`.

## 16. Deployment Strategy

V1 deployment should remain low-ops:

- Vercel: Next.js app.
- Supabase: Postgres/Auth/Realtime.
- n8n Cloud or small managed n8n: ingestion and external glue.
- WhatsApp Business Cloud API: messaging.
- Hosted voice provider first; optional Dograh/self-hosted voice stack later.
- Telegram/email/WhatsApp manager reports after analytics is reliable.

## 17. Non-Negotiable Rules

1. Multi-tenant from the first persistent schema.
2. Every customer-data query must be tenant-scoped.
3. Every lead action must create an immutable activity event.
4. Provider-specific WhatsApp/SMS/voice logic must stay out of UI components.
5. Inventory matching must be explainable.
6. AI-generated external communication requires approval unless the workflow is explicitly configured and audited.
7. Use `.env.example`; never commit real secrets.
8. Prefer managed services and simple architecture until scale forces complexity.
