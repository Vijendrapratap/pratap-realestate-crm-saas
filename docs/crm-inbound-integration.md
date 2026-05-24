# CRM Inbound Leads Integration Slice

## Status

Implemented as the current static product slice in:

- `src/lib/crm-data.ts`
- `src/app/page.tsx`

This slice makes the product AI-centric while keeping WhatsApp and voice as configurable channels. The central product surface is the AI Sales Agent: it communicates with internal CRM users, takes requests, updates CRM records, drafts external communication, and queues approvals before WhatsApp sends or voice calls.

## AI-Centric Product Positioning

The platform should be understood as:

**AI Sales Agent + CRM memory + inbound lead pipeline + WhatsApp/voice channels**

The CRM is the durable system of record. The AI Sales Agent is the operating layer users interact with.

### Agent responsibilities

- Talk to sales users in natural language.
- Answer questions about leads, stale pipeline, hot opportunities, callbacks, and owner workload.
- Update lead owner, stage, requirement, budget, next action, notes, and tasks through audited CRM actions.
- Create activity events for every meaningful update.
- Draft WhatsApp follow-ups, property shortlists, call scripts, and manager summaries.
- Queue approvals for external WhatsApp sends, voice calls, discounts, and sensitive actions.
- Read inbound source data, dedupe leads, suggest routing, and explain why.

### Safety model

- Internal CRM updates can be performed by the agent if the user has permission.
- External communication should default to draft/queue/approve.
- No AI voice call should start for DND or unconsented leads.
- Provider-specific WhatsApp/voice code belongs in service adapters, not UI components.

## Workflow Now Represented

**AI Agent → Capture → Dedupe → Route → Pipeline → Activity → Optional WhatsApp / Voice**

1. **Inbound queue**
   - New leads from website, Meta, MagicBricks, Google, portal parsers, walk-ins, referrals, and future WhatsApp sources enter one queue.
   - Each inbound lead shows source, received time, requirement, budget, duplicate risk, routing rule, owner suggestion, and creation status.

2. **CRM lead creation**
   - Accepted inbound leads become tenant-scoped lead records.
   - Lead records include channel, source, capture time, SLA status, stage, score, owner, next action, latest activity, and AI outcome.

3. **Pipeline management**
   - Default stages remain: New, Contacted, Cold, Warm, Hot, Negotiation, Closed Won, Closed Lost.
   - Pipeline UI shows stage counts, lead cards, owner, score, and empty-stage clarity.

4. **Lead detail and activity timeline**
   - Activity examples now cover lead capture, WhatsApp drafts, AI call outcomes, and human notes.
   - External actions remain approval-oriented and auditable.

5. **Optional add-ons**
   - WhatsApp Business Cloud appears as an add-credentials option, not a blocker for CRM completion.
   - Hindi/English voice agent appears as an add-credentials option, starting with hosted provider support and leaving Dograh/self-hosted adapters optional later.
   - n8n remains optional workflow glue; audited CRM API writes should remain the source of truth.

## Product Guardrails

- Do not block the CRM MVP on WhatsApp verification or voice-provider credentials.
- AI may draft WhatsApp messages, property shortlists, call scripts, and follow-ups.
- Agents/managers should approve high-value external sends and any sensitive workflow.
- Do not auto-call DND or unconsented leads.
- Every lead mutation should eventually append an immutable activity event.
- Provider-specific logic should stay out of UI components when real integrations are added.

## Next Implementation Steps

1. Add route-based app shell for `/app`, `/app/agent`, `/app/leads`, `/app/pipeline`, `/app/settings`.
2. Convert `src/lib/crm-data.ts` from mock data into typed service contracts, including `agent_commands`, `agent_actions`, and approval queue contracts.
3. Add tenant-aware Supabase schema/migrations for leads, inbound leads, activities, provider configs, messages, call sessions, agent actions, and approval requests.
4. Add `POST /api/agent/commands` so authenticated users can ask the AI Sales Agent to read/update CRM records through audited tools.
5. Add `POST /api/ingest/leads` with phone/email normalization, dedupe, source mapping, routing rules, and activity creation.
6. Add provider config screens for WhatsApp and voice credentials after the AI agent + CRM core is stable.
