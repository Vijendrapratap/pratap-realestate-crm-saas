# Source Repo Analysis & Integration Strategy

This document captures the findings from inspecting three open-source products as references for the Pratap AI Real Estate CRM SaaS:

- `twentyhq/twenty` cloned at `/home/pratap/repo-analysis/twenty`, commit `3bda05ea` — open-source CRM foundation.
- `ArnasDon/wacrm` cloned at `/home/pratap/repo-analysis/wacrm`, commit `4239955` — WhatsApp-first CRM template.
- `dograh-hq/dograh` cloned at `/home/pratap/repo-analysis/dograh`, commit `3892b58` — open-source voice agent platform.

## Executive Decision

Do **not** fork Twenty or Dograh for V1.

The fastest, lowest-complexity path is:

1. Keep this repo as the main product: **Next.js 16 + TypeScript + Tailwind v4**.
2. Use **Twenty as the design and CRM architecture reference**, not as the runtime dependency.
3. Reuse **wacrm patterns directly** for WhatsApp inbox, templates, broadcasts, automations, Supabase schema style, and real-time updates.
4. Treat **Dograh as the reference/source for the voice subsystem**, but hide it behind a provider abstraction so V1 can start with a simpler hosted provider and later self-host Dograh if economics or data-control require it.
5. Add a Hermes/subagent layer as a supervised automation layer for onboarding, campaign setup, reporting, and manager-facing analysis — not as core transactional infrastructure.

## Why This Direction

### Twenty

**What it gives us:**

- Mature CRM mental model: workspace/tenant, object metadata, views, fields, records, activity timeline, API keys, settings, GraphQL/NestJS backend, React CRM frontend.
- Strong UI patterns for clean B2B CRM: dense lists, object views, settings pages, API key management, multi-workspace concepts.
- Robust monorepo conventions, background workers, metadata-driven customization, and enterprise CRM depth.

**Why not fork for V1:**

- Operationally heavy: Nx monorepo, Yarn 4, Node 24, NestJS, GraphQL, TypeORM, Redis, BullMQ, PostgreSQL, optional ClickHouse.
- CRM object metadata is powerful but overkill before the real estate product loops are validated.
- Vertical workflows need opinionated real-estate objects and automation, not full generic CRM extensibility on day one.

**What to borrow:**

- Workspace/tenant language.
- Settings/API key page structure.
- Activity timeline as a first-class concept.
- Configurable views later, after V1 product-market fit.
- Record/event architecture: every lead action becomes an immutable activity.

### wacrm

**What it gives us:**

- Next.js 16, React 19, Supabase, Tailwind v4 — closely matches this repo.
- WhatsApp Business Cloud API helpers with named-argument functions to prevent swapped credential bugs.
- Supabase schema examples for contacts, conversations, messages, templates, pipelines, deals, broadcasts, automations, and stateful conversational flows.
- Real-time update pattern through Supabase publications for `messages`, `conversations`, and `flow_runs`.
- Practical WhatsApp CRM modules: shared inbox, templates, broadcasts, flow builder, automations, import, tags, custom fields.

**What to adapt directly:**

- `contacts` → `leads`/`contacts` split or combined lead-contact entity.
- `conversations` + `messages` → WhatsApp/SMS communication timeline.
- `pipelines`, `pipeline_stages`, `deals` → real estate lead lifecycle and opportunity pipeline.
- `message_templates`, `broadcasts`, `broadcast_recipients` → follow-up and campaign engine.
- `automations`, `automation_steps`, `automation_pending_executions` → outcome-based follow-up workflows.
- `flows`, `flow_nodes`, `flow_runs`, `flow_run_events` → WhatsApp chatbot/qualification flows.
- Partial indexes and service-role-only execution queues for safe server-side automation.

**Needed changes for Pratap CRM:**

- Replace user-scoped schema with organization/tenant-scoped schema.
- Add real-estate-specific fields: budget, property type, location, lead source, project, inventory match requirements, site visit, broker/developer teams.
- Add activity timeline unifying WhatsApp messages, voice calls, notes, stage changes, assignments, tasks, and inventory sends.
- Add Indian market defaults: phone normalization, Hindi/English templates, WhatsApp-first workflows, source ROI by portal/ad platform.

### Dograh

**What it gives us:**

- Voice agent platform with FastAPI backend, Next.js UI, PostgreSQL, Redis/ARQ background jobs, MinIO/S3 audio storage, telephony provider abstraction, campaign orchestration, workflow builder, transcripts/recordings, and organization-scoped resources.
- Provider patterns for Twilio/ARI/Plivo/Vobiz-like telephony.
- Strong tenant-isolation rule: always validate `organization_id` for scoped resources.
- Campaign/event orchestration with Redis pub/sub, retries, circuit breakers, and batch processing.
- Workflow definitions, workflow runs, recordings, phone numbers, telephony configurations, API keys, and organization configurations.

**Why not embed immediately:**

- It adds Python/FastAPI, Redis, workers, object storage, Docker, telephony networking, and workflow-runtime complexity.
- For a founder-led MVP, voice should be a modular capability, not a hard dependency for the CRM core.

**What to adapt:**

- Voice provider abstraction: `VoiceProvider`, `CallSession`, `CallOutcome`, `Transcript`, `Recording`.
- Organization-scoped telephony credentials and phone numbers.
- Campaign batch model for outbound qualification calls.
- Retry/circuit-breaker patterns for failed calls.
- Post-call event webhook: call completed → transcript stored → outcome classified → lead stage/task/follow-up updated.

## Target Product Architecture

```text
Lead Sources
  Meta Ads / Google / Portals / Forms / CSV / Walk-ins
        │
        ▼
Ingestion Layer
  Next.js API routes + n8n workflows + dedupe/routing rules
        │
        ▼
CRM Core
  Tenant → Users/Roles → Leads → Activities → Tasks → Pipeline → Inventory
        │
        ├── WhatsApp/SMS Engine
        │     Templates, broadcasts, shared inbox, flow runs, delivery/read/reply status
        │
        ├── Voice Qualification Engine
        │     Provider adapter: hosted provider now, Dograh/self-host later
        │     Call sessions, transcripts, outcomes, recordings
        │
        ├── Inventory Matching
        │     Buyer requirements → ranked property shortlist → explainable match reasons
        │
        └── Hermes/Subagent Layer
              Onboarding assistant, manager analyst, campaign builder, quality auditor
```

## Data Model Refinement

V1 should use explicit vertical entities, not generic CRM metadata tables.

Core entities:

- `tenants`: brokerage/developer/customer account.
- `users`: tenant members.
- `roles`: owner, manager, agent, viewer.
- `leads`: prospect record with source, phone, email, requirement, budget, stage, owner, score, status.
- `lead_requirements`: structured requirement fields for property matching.
- `activities`: append-only timeline events for every lead action.
- `tasks`: callbacks, site visits, follow-ups, manager approvals.
- `properties`: inventory units/projects with price, location, size, availability.
- `property_matches`: lead-property ranked match results and explanations.
- `conversations`: communication thread by lead/channel.
- `messages`: WhatsApp/SMS messages, delivery status, template metadata.
- `message_templates`: approved WhatsApp/SMS templates by language/outcome.
- `broadcasts` and `broadcast_recipients`: campaign sends and recipient status.
- `automations`, `automation_steps`, `automation_runs`: follow-up logic and execution history.
- `call_sessions`: voice call attempt, provider, outcome, transcript, recording, duration, cost.
- `provider_configs`: tenant-scoped credentials for WhatsApp, SMS, voice, LLM, STT/TTS, n8n.
- `onboarding_profiles`: tenant setup choices captured during guided onboarding.

Important rule: every table that stores customer data must include `tenant_id` and every server action/API route must validate tenant access before reading or writing.

## Hermes/Subagent Layer

Hermes should not replace deterministic CRM logic. It should orchestrate human-supervised, higher-level work:

1. **Onboarding Agent**
   - Asks brokerage/developer setup questions.
   - Converts answers into pipeline stages, lead sources, templates, routing rules, call scripts, and follow-up sequences.
   - Produces a reviewable setup draft before activation.

2. **Campaign Builder Agent**
   - Creates campaign plans for cold leads, portal leads, missed-call leads, and old inventory.
   - Drafts WhatsApp templates and voice call prompts.
   - Requires manager approval before external messaging/calling.

3. **Manager Analyst Agent**
   - Summarizes leakage: unassigned leads, stale hot leads, missed callbacks, slow response times.
   - Produces daily manager briefing and recommended actions.

4. **Call QA Agent**
   - Reviews transcripts for qualification quality, objection patterns, agent handoff failures.
   - Flags bad scripts and improves prompts.

5. **Inventory Match Agent**
   - Explains why a shortlist fits a buyer.
   - Drafts personalized WhatsApp copy using approved inventory facts only.

Safety boundary: agents may draft and recommend; production workflows must own final writes, message sends, and calls through audited API actions.

## Customer Onboarding & Configuration Model

Every new customer should go through a guided setup that writes structured configuration:

1. **Company profile**
   - Brokerage/developer name, cities, property types, team size, languages.

2. **Lead sources**
   - Meta, Google, portals, walk-ins, referral, CSV, website forms, Sheets.

3. **Pipeline defaults**
   - New, Contacted, Cold, Warm, Hot, Negotiation, Closed Won, Closed Lost.
   - Optional custom stages later.

4. **Assignment rules**
   - Round-robin, source-based, location-based, budget-based, project-based.

5. **WhatsApp setup**
   - Phone number, WABA, templates, languages, opt-in policy, default follow-up windows.

6. **Voice setup**
   - Provider choice, caller ID, call windows, retry rules, Hindi/English scripts, handoff rules.

7. **Inventory setup**
   - CSV import or manual entry, project/unit fields, availability statuses, pricing bands.

8. **Manager reporting**
   - SLA thresholds, daily report time, Telegram/WhatsApp/email delivery preference.

Configuration should be stored as typed rows where possible, with JSON only for provider-specific or workflow-builder payloads.

## Product Packaging

Recommended packages for founder-led sales:

### Starter Brokerage

- 5 users.
- Lead capture, pipeline, tasks, inventory basics.
- WhatsApp templates and manual follow-up.
- Basic analytics.

### Growth Brokerage

- 20 users.
- Shared inbox, broadcasts, automations, source ROI, inventory matching.
- AI voice qualification with usage-based calling.
- Manager daily briefing.

### Developer/Enterprise

- Multi-project inventory, routing rules, multiple teams/locations.
- Dedicated number/provider configuration.
- Advanced reports, API keys/webhooks, custom onboarding.
- Optional self-hosted voice stack or private deployment.

## Implementation Recommendation

### Phase 1 — CRM + WhatsApp Core

- Tenant-aware schema.
- Auth and roles.
- Lead CRUD, pipeline, tasks, activities.
- WhatsApp templates, conversations, message timeline.
- Lead ingestion webhook and CSV import.
- Manager dashboard.

### Phase 2 — Automation + Voice

- Follow-up automations based on lead stage/outcome.
- Voice call provider adapter and call session model.
- Hosted voice provider first; Dograh-compatible interface second.
- Call transcript/outcome classification and stage/task updates.

### Phase 3 — Inventory + Agents

- Property inventory and matching engine.
- Hermes onboarding/campaign/analyst agents.
- Approval queues for AI-generated templates/scripts/campaigns.
- Advanced reporting and source ROI.

## Build vs Borrow Matrix

- **Build in this repo:** tenant CRM, lead pipeline, inventory matching, dashboards, onboarding, business rules.
- **Borrow patterns/code from wacrm:** WhatsApp API helpers, schema shape, shared inbox UX, automations/flows, broadcasts.
- **Borrow architecture from Twenty:** clean CRM UX, workspace/settings/API mental model, metadata extensibility later.
- **Integrate/adapt Dograh:** voice provider abstraction, call sessions, campaign orchestration, transcripts/recordings, telephony configuration.
- **Use n8n:** non-core ingestion workflows and external system glue.
- **Use Hermes/subagents:** setup, analysis, drafting, QA, and founder/manager workflows with human approval.

## Near-Term Next Steps

1. Convert current single-page prototype into route-based app shell.
2. Add Supabase/Postgres schema with `tenant_id` on all core tables.
3. Implement `activities` first so every later workflow writes to the timeline.
4. Add WhatsApp provider abstraction using wacrm named-parameter helper style.
5. Add lead ingestion endpoint for n8n/Meta/Google/portal payloads.
6. Add onboarding configuration screens and store generated defaults.
7. Add voice provider interface and `call_sessions` without committing to a specific provider.
