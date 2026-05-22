# Pratap AI Real Estate CRM SaaS — Blueprint

> Source brief: `Pratap_AI_RealEstate_Proposal_1.docx`  
> Archetype: SaaS / Web App, inspired by open-source CRM products like Twenty.com  
> Development folder: `/home/pratap/agents/pratap-realestate-crm-saas`

## 1. Project Overview

Build a vertical SaaS CRM for real estate brokerages and developers. The platform centralizes leads from ads, portals, referrals, walk-ins, and spreadsheets; qualifies prospects with Hindi/English AI voice calls; triggers WhatsApp/SMS follow-ups; gives agents a pipeline workspace; gives managers real-time analytics; and matches buyer requirements to property inventory.

### V1 Goals

- Replace spreadsheet-first lead handling with a CRM source of truth.
- Provide a Twenty-style clean CRM workspace customized for real estate.
- Capture lead lifecycle from New → Contacted → Cold/Warm/Hot → Negotiation → Closed Won/Lost.
- Prepare the product for multi-tenant SaaS packaging.
- Keep AI/telephony/messaging provider integrations modular.

### Success Metrics

- Speed-to-lead under 60 seconds for inbound ad leads.
- 100% of leads have source, owner, stage, and next action.
- Every call/message/status change logged to an activity timeline.
- Inventory match shortlist generated in under 5 seconds.

## 2. Recommended Stack

- **Framework:** Next.js App Router + TypeScript — fast SaaS UI and API surface.
- **Styling:** Tailwind CSS v4 — rapid CRM UI iteration.
- **CRM foundation:** Twenty.com patterns as reference; later evaluate fork/integration if we want full object-model extensibility.
- **Database:** PostgreSQL via Supabase — managed, simple, real-time capable.
- **ORM:** Prisma or Drizzle — choose after DB model stabilizes.
- **Auth:** Clerk or Supabase Auth — organizations/teams required for SaaS tenants.
- **Automation:** n8n — lead ingestion, de-duplication, routing, follow-up workflows.
- **Messaging:** WhatsApp Business API + SMS provider abstraction.
- **Voice:** Twilio/local SIP + STT/TTS provider abstraction; Hindi/English flows.
- **Deployment:** Vercel for web app, Supabase for DB, n8n Cloud/self-hosted for workflows.

## 3. Core Modules

1. **Lead Capture & CRM Core**
   - Multi-source ingestion: Meta, Google, property portals, referrals, walk-ins, website forms, Google Sheets.
   - De-duplication by phone/email.
   - Auto-assignment by source, area, budget, round-robin.
   - Lead profile with timeline.

2. **Agent Workspace**
   - Pipeline board and lead list.
   - Guided status update, notes, tasks, reminders.
   - Call/message history and next-best action.

3. **Follow-up Engine**
   - Outcome-based WhatsApp/SMS: interested, callback, no answer, not interested.
   - Nurture sequences that stop when a lead replies/converts.
   - Callback reminders and missed callback escalation.

4. **AI Voice Calling**
   - Hindi + English outbound qualification.
   - Outcome classification.
   - Transcript/recording logging.
   - Human handoff for hot/callback leads.

5. **Management Analytics**
   - Pipeline value, conversion funnel, ageing leads.
   - Agent activity and source ROI.
   - Lead leakage and follow-up SLA dashboards.

6. **Inventory Matching**
   - Property inventory database.
   - Requirement capture: type, location, budget, size, bedrooms, use case.
   - Ranked property shortlist and WhatsApp send-out.
   - Allocation tracking to avoid double-promising.

## 4. Initial Data Model

- **Tenant:** SaaS customer organization.
- **User:** agent, manager, admin.
- **Lead:** prospect/contact with source, requirement, budget, stage, score, owner.
- **Activity:** immutable timeline event: call, message, note, stage change, assignment.
- **Task:** callback, site visit, follow-up, manager approval.
- **Property:** inventory unit with type, location, price, size, availability.
- **Match:** lead-to-property ranking and send-out state.
- **Workflow:** automation sequence definition.
- **MessageTemplate:** WhatsApp/SMS templates per outcome and language.
- **CallSession:** AI/human call metadata, transcript, recording URL, outcome.

## 5. Build Order

1. Scaffold Next.js SaaS shell with Tailwind and project instructions. **Done.**
2. Build static CRM prototype: landing, metrics, pipeline, leads, inventory matching. **Started.**
3. Add domain types and mock data for leads/properties/activities. **Started.**
4. Add app routes: `/dashboard`, `/leads`, `/inventory`, `/automations`, `/analytics`, `/settings`.
5. Add persistent DB schema and seed data.
6. Add tenant-aware auth and role-based navigation.
7. Implement lead CRUD, pipeline stage movement, activity timeline.
8. Implement property inventory CRUD and matching service.
9. Implement n8n webhook endpoints for lead ingestion and follow-up triggers.
10. Implement WhatsApp/SMS provider abstraction and template engine.
11. Implement AI voice call session model and provider abstraction.
12. Add dashboards for pipeline, source ROI, agent activity, ageing leads.
13. Add tests: domain matching, lead ingestion, permissions, E2E happy path.
14. Add deployment docs and environment templates.

## 6. Design System

Use Pratap brand language: black, bronze, bone, champagne, vermilion. Visual style: premium B2B SaaS, Twenty-like object clarity, real estate command center feel, high contrast, rounded panels, dense but readable dashboard components.

## 7. Non-Negotiable Rules

1. Keep the product multi-tenant from the first database schema.
2. Never hard-code provider-specific telephony/WhatsApp logic into UI components.
3. Every lead action must create an activity timeline event.
4. Real estate inventory matching must be explainable: show why a property matched.
5. Do not commit real secrets; use `.env.example` only.
6. Prefer simple managed infrastructure until scale forces complexity.
