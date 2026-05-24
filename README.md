# Pratap AI Real Estate CRM SaaS

A simple, founder-friendly CRM operating layer for real-estate brokerages and agencies.

The goal is not to make users learn a generic CRM first. The product should open into a real-estate-ready workspace where leads, WhatsApp conversations, voice-call outcomes, property matches, tasks, notes, and approvals are already organized around the way a brokerage sells property.

## Live Demo Surfaces

- Landing page: `/`
- Founder/operator dashboard: `/dashboard`
- Backend health: `/api/health`
- CRM data backend: `/api/crm`
- AI agent backend: `/api/agent`
- Integration contract backend: `/api/integrations`

The UI should not expose raw JSON as a primary user action. API routes exist for the backend and future integrations, but founder-facing buttons should say things like **WhatsApp setup**, **Voice setup**, **CRM sync**, **Open Twenty**, and **Ask agent**.

## Use Case

Target customer:

- Real-estate brokerage owner
- Real-estate agency/founder
- Developer sales team
- Channel partner team

Core problem:

- Leads arrive from Meta, Google, website forms, portals, walk-ins, WhatsApp, and referrals.
- Teams lose context across spreadsheets, WhatsApp chats, calls, CRM notes, and individual agents.
- Founders need a simple dashboard to know: who is hot, who needs follow-up, what was said, what property was shown, and what action is pending.

Product promise:

> Every lead enters one CRM memory. WhatsApp, voice calls, AI actions, tasks, property matches, approvals, and human notes stay attached to that lead so anyone can retrieve the answer later.

## Product Principles

1. **Simple UI first** — non-technical users should not need to understand APIs, webhooks, MCP, or CRM internals.
2. **CRM is the source of truth** — all channel activity syncs back to the CRM timeline.
3. **Real-estate template by default** — workspace starts with useful fields, views, stages, examples, and workflows.
4. **Approval-gated AI** — AI can draft, summarize, score, and propose; external WhatsApp sends and calls require approval unless an audited automation rule is explicitly enabled.
5. **Tenant/workspace separation** — every brokerage has its own workspace, settings, data, integrations, and permissions.
6. **Provider modularity** — WhatsApp, voice, AI, and automation providers should be replaceable without rewriting the product.

## Founder Dashboard Requirements

The dashboard should have clear controls for:

- Lead search by name, phone, owner, location, project, source, or stage.
- Pipeline view: New, Contacted, Cold, Warm, Hot, Negotiation, Closed Won, Closed Lost.
- Inbound queue with duplicate detection and routing suggestions.
- Property matches with simple explanation.
- AI sales agent test panel.
- WhatsApp setup wizard.
- Voice agent setup wizard.
- CRM sync status.
- Twenty CRM demo/workspace access.
- Export and audit trail.

Avoid primary buttons that say only `Raw API`, `Setup API`, or similar developer terms.

## Open-source Platform Sync Strategy

The product should use the three open-source systems as backend capabilities, not as three separate user experiences.

- **Twenty**: central CRM spine and source of truth. It owns contacts, leads, opportunities, tasks, notes, activities, custom real-estate objects, tenant records, and long-term CRM memory.
- **wacrm**: WhatsApp operations layer. It can manage WhatsApp inbox, templates, replies, and WhatsApp-specific pipeline behavior, but every message, status, owner change, and next action must sync back to the Twenty CRM lead timeline.
- **Dograh**: voice/calling layer. It can manage call workflows, transcripts, dispositions, retries, and voice-agent outcomes, but every call attempt and transcript must sync back to the same CRM lead record.
- **Custom AI backend**: orchestration layer. It normalizes payloads, dedupes leads, routes records, calls AI models, applies permissions, queues approvals, and writes approved actions into CRM.

Frontend rule:

- The user should see one simple AI workspace, not three dashboards.
- Advanced links to Twenty/wacrm/Dograh can exist for admins, but the daily broker experience should be landing page → signup → centered AI command box → quick actions.

Backend rule:

- No duplicate customer database should become the business source of truth.
- Channel systems can store operational records, but canonical lead/contact/deal/activity state must sync into the central CRM.

## WhatsApp Setup UX

Use wacrm-style WhatsApp operations with WhatsApp Business Cloud API or a managed BSP. The owner should not need to understand the WhatsApp backend; the central UI should show conversations, drafts, approvals, and sync status.

The UI should guide the owner through:

1. Choose WhatsApp Business Cloud or managed provider.
2. Add `META_WABA_ID`.
3. Add `META_PHONE_NUMBER_ID`.
4. Add server-side access token.
5. Add app secret and webhook verify token.
6. Send a test message to a sample/internal lead.
7. Confirm inbound replies appear in the Inbox.
8. Enable template library.
9. Enable approval rules before any outbound automation.

Owner controls:

- Approval before send
- Template library
- Opt-out/DND handling
- Conversation owner
- Team inbox assignment
- Cost/activity log
- Human handoff

CRM sync rule:

- Every inbound WhatsApp message becomes an activity on the lead.
- Every outbound draft is stored before approval.
- Every approved send is logged with sender, timestamp, template/message, status, and next action.
- Reply outcomes can update stage, score, callback time, and owner task.

## Voice Agent Setup UX

Start with Dograh or a hosted voice/telephony provider behind the central CRM sync layer. The owner should see call outcomes, transcripts, retries, and approval status inside the AI workspace, while the canonical lead record remains in Twenty.

The UI should guide the owner through:

1. Choose voice provider.
2. Add provider API key.
3. Add from-number.
4. Add webhook secret.
5. Select languages: Hindi, English, Hinglish.
6. Set calling hours.
7. Set retry limits.
8. Configure DND/consent rules.
9. Test on an internal number.
10. Review transcript and outcome in CRM.
11. Enable campaigns only with approval gates.

Voice campaigns:

- New lead qualification
- No-answer retry
- Site visit reminder
- Re-activation
- Post-visit follow-up
- Payment/booking reminder

CRM sync rule:

- Each call writes transcript, disposition, summary, next action, callback time, lead score change, and owner assignment to the CRM activity timeline.

## Twenty CRM Direction

Twenty is useful because it already has many CRM concepts we should study and reuse:

- Workspaces
- People
- Companies
- Opportunities
- Tasks
- Notes
- Workflows
- Views
- Roles/permissions
- API and integration architecture
- MCP/AI direction
- Workspace-level customization

Current local demo:

- Local Twenty path: `/home/pratap/apps/twenty-selfhost`
- Local URL: `http://localhost:3001`
- Demo workspace: `Apple`
- Demo login: `tim@apple.dev`

Do not put real customer PII in temporary tunnels or local demo workspaces.

## Real Estate Template Needed in Twenty

The generic Twenty workspace should be turned into a real-estate-ready workspace/template.

Recommended real-estate objects/fields:

- Lead / Contact
- Company / Broker partner / Developer
- Property
- Project
- Opportunity / Deal
- Site visit
- Follow-up task
- WhatsApp conversation
- Voice call activity
- Property shortlist
- Requirement profile
- Source campaign
- Owner/agent

Recommended lead fields:

- Name
- Phone
- Email
- Source
- Channel
- Requirement
- Property type
- Budget
- Preferred location
- Purchase timeline
- Language preference
- Stage
- Score
- Assigned owner
- Last contacted
- Next action
- DND/consent status

Recommended stages:

1. New
2. Contacted
3. Cold
4. Warm
5. Hot
6. Site Visit Scheduled
7. Site Visit Done
8. Negotiation
9. Closed Won
10. Closed Lost

Recommended saved views:

- Hot leads today
- New unassigned leads
- No-answer retry queue
- Site visits this week
- Negotiation requiring manager
- WhatsApp replies waiting
- Voice transcripts needing review
- High-budget investors
- Stale leads older than 7 days

## AI and OpenRouter

For the custom Pratap AI backend, OpenRouter is the preferred first AI provider because it is OpenAI-compatible and can use one API key for multiple models.

Environment variables:

```bash
OPENROUTER_API_KEY=
AI_PROVIDER=openrouter
AI_MODEL=openrouter/auto
AI_DAILY_SPEND_LIMIT_USD=
```

Recommended behavior:

- Store the key only server-side.
- Never expose model credentials in browser code.
- Add tenant-level spend limits.
- Add tool permissions per tenant/user role.
- Start in sandbox mode.
- Allow AI to propose CRM changes before enabling direct writes.
- Keep WhatsApp sends and calls approval-gated.

### Can OpenRouter power Twenty AI too?

Likely path:

1. First verify the current self-hosted Twenty version's AI provider settings/hooks.
2. If Twenty supports OpenAI-compatible endpoints directly, configure OpenRouter as the OpenAI-compatible base URL.
3. If Twenty only supports fixed providers, add a thin server-side adapter/proxy that presents an OpenAI-compatible interface and forwards to OpenRouter.
4. Keep the same API key on the backend side, not per browser user.

Practical recommendation:

- Use OpenRouter immediately for this custom SaaS agent.
- Study Twenty AI/MCP/provider hooks before modifying Twenty itself.
- Do not fork deeply until it is clear whether template + API integration is enough.

## Backend Sync Model

All integrations should write through the backend, not directly from the browser.

Preferred flow:

1. Channel event arrives: WhatsApp, voice provider, website form, Meta lead, portal parser, or manual entry.
2. Backend normalizes payload.
3. Backend dedupes by phone/email/source.
4. Backend creates or updates CRM lead.
5. Backend writes activity event.
6. AI reads allowed CRM context.
7. AI proposes next action.
8. Human approves external message/call if required.
9. Backend logs final outcome.

This keeps data organized and queryable.

## Current Status

- Next.js 16 + React 19 + TypeScript + Tailwind CSS v4 prototype.
- Landing page and dashboard are live prototype surfaces.
- Backend API routes exist for CRM data, agent responses, health, and integration contract.
- Demo data represents a real-estate brokerage workflow.
- Twenty is installed separately for study/demo.
- WhatsApp and voice are not sending live messages/calls yet; the product intentionally shows approval-gated setup.

## Commands

```bash
pnpm install
pnpm dev
pnpm lint
pnpm typecheck
pnpm build
pnpm check
```

## Environment Variables

See `.env.example`.

Key groups:

- App URL
- Database/auth
- WhatsApp Business Cloud
- Voice provider
- OpenRouter/AI
- Twenty CRM sync
- n8n/automation

## Production Build Order

1. Persistent multi-tenant database/auth.
2. Real-estate CRM schema and workspace/template.
3. Twenty study: template, workspace customization, API/MCP/AI extension points.
4. WhatsApp Business Cloud setup wizard and webhook.
5. Voice provider setup wizard and webhook.
6. AI agent using OpenRouter with tool permissions.
7. Activity timeline and audit log.
8. Approval queue for WhatsApp/calls.
9. Property inventory and explainable matching.
10. Billing, tenant admin, roles, and exports.

## Non-Negotiables

- No real secrets in the repo.
- Do not expose raw API JSON as a main user path.
- Every lead action creates an activity event.
- Every workspace stays tenant-separated.
- External WhatsApp and voice actions stay approval-gated until explicitly configured.
- CRM remains the source of truth.
