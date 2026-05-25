# Sync Architecture: Twenty + WhatsApp + Voice + AI

> Companion to [blueprint.md](./blueprint.md) and [source-repo-analysis.md](./source-repo-analysis.md). Grounded in code reads of `twentyhq/twenty`, `ArnasDon/wacrm`, and `dograh-hq/dograh` at the local clones under `/home/pratap/repo-analysis/`.

## TL;DR

| Layer | Role | Deployment shape |
|---|---|---|
| **Twenty CRM** | Source of truth. Holds leads, properties, activities, tasks, opportunities. | Self-host **one** instance, workspace-per-customer (Twenty does schema-per-workspace). |
| **WhatsApp** | Channel. Send/receive messages, templates, broadcasts. | **Do not deploy wacrm.** Extract its helpers (`meta-api.ts`, encryption, phone utils) into our orchestrator. |
| **Voice (Dograh)** | Channel. Outbound qualification calls, transcripts, retries. | Deploy Dograh as a service, **one instance**, org-per-customer. Call REST + poll. |
| **Pratap orchestrator** (this repo) | The only UI users see. AI agent, sync glue, onboarding, audit, approvals. | Vercel-hosted Next.js. |

Three services. One UI. One source of truth. Sync is event-driven through our orchestrator.

## 1. Why this shape

Each of the three open-source projects was studied for whether to **deploy whole** or **borrow patterns**.

### Twenty → deploy whole, no fork
- Production MCP server exists at `packages/twenty-server/src/engine/api/mcp/` (POST `/mcp`, JSON-RPC 2.0, workspace-aware tool execution, `McpAuthGuard` + `WorkspaceAuthGuard`).
- REST + GraphQL APIs scoped by workspace API key.
- Metadata API can create custom objects (`Property`, `SiteVisit`) and fields dynamically via `/metadata/createObject`.
- Outbound webhooks on `{object}.created|updated|deleted` with HMAC-SHA256 signature.
- TimelineActivity is a first-class entity — external services can append timeline events via `POST /rest/timelineActivities`.
- Multi-tenant via schema-per-workspace in a single Postgres. One Docker Compose deployment serves many customers.

**Decision:** Twenty is the spine. We don't fork it. We talk to it via its API + MCP, and we let advanced customers open Twenty's own UI directly.

### wacrm → don't deploy, extract helpers
- wacrm is **single-tenant by design**. Every table is scoped via `user_id` + Supabase RLS. Making it multi-tenant means rewriting the data layer.
- It has **no external API** for sending — `/api/whatsapp/send` and `/api/whatsapp/broadcast` require browser session auth. Service-to-service calls aren't supported.
- The crown jewels are at `src/lib/whatsapp/meta-api.ts`: named-arg helpers (`sendTextMessage`, `sendTemplateMessage`, interactive lists/buttons), pre-network validation, GCM-encrypted credentials, Meta v21.0.
- wacrm also ships flows + automations + broadcasts engines. **Twenty (activities + tasks) and our orchestrator (rules) already cover that** — keeping two automation engines causes drift.

**Decision:** Copy `meta-api.ts` + phone utils + crypto helpers into our orchestrator. Build our own `/api/whatsapp/webhook` and `/api/whatsapp/send`. Drop wacrm's flows engine.

### Dograh → deploy whole, call via REST
- Multi-tenant ready: every model has `organization_id`. Telephony configs, phone numbers, workflows, runs — all org-scoped.
- Pluggable provider layer (Twilio, Plivo, Telnyx, Vonage, Cloudonix, Vobiz, ARI) via a clean `TelephonyProvider` base class.
- Ships its own LLM/STT/TTS stack via Pipecat (Deepgram, ElevenLabs, OpenAI, Cartesia, etc.). Heavy but battle-tested.
- REST API for `initiate-call`, workflows, campaigns, recordings, transcripts. **No outbound webhooks to external CRM** — results land in `WorkflowRun.gathered_context`; we poll.

**Decision:** Don't try to rebuild Pipecat. Deploy one Dograh, create a Dograh `Organization` per customer, store the Twilio (or other) credentials in Dograh's `TelephonyConfigurationModel`. Our orchestrator triggers calls via Dograh REST and polls for results.

## 2. Data flow

```
                          ┌─────────────────────────┐
                          │   User chat / sidebar   │  ◄── only surface users see
                          └────────────┬────────────┘
                                       │
                          ┌────────────▼────────────┐
                          │   Pratap orchestrator   │
                          │   /api/agent            │
                          │   /api/ingest/leads     │
                          │   /api/whatsapp/*       │
                          │   /api/calls/*          │
                          │   /api/webhooks/*       │
                          │   /api/onboarding/*     │
                          └──┬───────────┬──────────┘
                             │           │           
              ┌──────────────┘           └─────────────┐
              │                                        │
   ┌──────────▼───────────┐  ┌────────────────┐  ┌────▼───────────────┐
   │ Twenty CRM           │  │ WhatsApp Cloud │  │ Dograh voice       │
   │ (1 self-host)        │  │ (Meta, direct) │  │ (1 self-host)      │
   │                      │  │                │  │                    │
   │ • workspace/customer │  │                │  │ • org per customer │
   │ • leads, props, acts │  │                │  │ • per-org Twilio   │
   │ • REST/GraphQL/MCP   │  │                │  │ • REST + poll      │
   │ • outbound webhooks  │  │                │  │                    │
   └──────────────────────┘  └────────────────┘  └────────────────────┘
```

### Write paths (orchestrator → outside)

| Action | Path |
|---|---|
| Create lead from web/Meta/portal | `/api/ingest/leads` → write to Twenty (`Person` + `Opportunity` + `TimelineActivity`) |
| Move stage / update fields | `/api/leads/:id/stage` → Twenty REST (audited) |
| Send WhatsApp | `/api/whatsapp/send` → `meta-api.ts` helper directly to Meta Cloud; then append `TimelineActivity` to Twenty |
| Start qualification call | `/api/calls/start` → Dograh `POST /api/v1/telephony/initiate-call` |
| Match properties | Orchestrator queries Twenty's `Property` object; agent ranks; writes match record |

### Read paths (outside → orchestrator)

| Event | Path |
|---|---|
| WhatsApp inbound message | Meta → `/api/webhooks/whatsapp` → verify HMAC → resolve tenant by `phone_number_id` → upsert lead in Twenty + append `TimelineActivity` |
| Twenty record changed (manual edit by user in Twenty UI) | Twenty webhook → `/api/webhooks/twenty` → invalidate cache, optionally notify chat |
| Voice call completed | Orchestrator polls Dograh `GET /api/v1/workflow-runs/:id` after `initiate-call`; on completion writes transcript + disposition to Twenty activity |

## 3. The AI layer (Hermes-style, improves over time)

The agent talks to one place — our orchestrator — through **MCP tools** we expose. The tools fan out to Twenty / WhatsApp / Dograh.

### MCP tools the orchestrator exposes

```
search_leads(query, filters)       → reads Twenty
get_lead(id)                       → reads Twenty
update_lead(id, fields)            → writes Twenty (audited, permission-checked)
move_stage(id, stage)              → writes Twenty
add_note(lead_id, text)            → writes Twenty
search_properties(requirements)    → reads Twenty
draft_whatsapp(lead_id, intent)    → returns draft, does NOT send
send_whatsapp(lead_id, template,   → requires approval row first; calls meta-api.ts
              vars, approval_id)
draft_call_script(lead_id, intent) → returns draft
start_call(lead_id, workflow_id,   → requires approval row first; calls Dograh
           approval_id)
read_conversation(lead_id)         → reads WhatsApp messages stored in Twenty
read_transcript(call_id)           → reads from Dograh + cached in Twenty
```

### Why MCP, not CLI
- **MCP is request/response with typed schemas** — agents can call tools in a loop without parsing stdout.
- Twenty already speaks MCP natively; our own MCP server makes the rest match.
- Any future client (Claude Desktop, Cursor, internal agent) gets the same surface for free.
- CLI is for humans. Our agent isn't a human.

(CLI is still useful for ops scripts — backfill, audit, manual fixes — but not as the AI's contact path.)

### How the AI improves over time

Every agent action produces an `AgentDecision` record in Twenty:

```
AgentDecision {
  workspace_id, lead_id, prompt, proposed_action,
  approved_by, approved_at, edited_before_approval (jsonb diff),
  rejected, outcome (after the fact: lead_won/lead_lost/no_response)
}
```

The agent uses these as **few-shot context** on the next similar lead:
- Edits before approval → templates to update.
- Repeated rejections → suggestion drops in the ranker.
- Outcome correlation → re-weights scoring (Hot/Warm thresholds, source ROI).

No fine-tuning needed at first. A weekly batch job recomputes:
- per-tenant lead-scoring weights,
- per-source response-success rates,
- per-template approval/edit rate.

Stored back as tenant config rows, read at agent call time. This is the "learns from behaviour" loop without a custom model.

## 4. Onboarding: one form, three services provisioned

A single multi-step wizard at `/onboarding`. Each step writes to one row of `onboarding_profiles` and either provisions or queues provisioning.

| Step | Asked of user | Provisioned by backend |
|---|---|---|
| 1. Brokerage | Name, city, languages, team size | Create Twenty **workspace** + API key (Twenty supports `IS_MULTIWORKSPACE_ENABLED=true`); seed real-estate template (Property, SiteVisit, Requirement custom objects, default pipeline stages) via Twenty Metadata API |
| 2. Lead sources | Meta / Google / portals / Sheets / CSV | Create Twenty `LeadSource` records; show webhook URLs the user can paste into Meta / n8n |
| 3. WhatsApp (optional) | Meta App ID, App Secret, Phone Number ID, WABA ID, Access Token, Verify Token | Encrypt + store in our orchestrator's `tenant_provider_configs`. Verify with one Meta API roundtrip. No wacrm involved. |
| 4. Voice (optional) | Twilio (or other) SID/Token, from-number, calling hours, language | Create Dograh `Organization` for tenant, `TelephonyConfigurationModel`, an `APIKeyModel`. Upload a default `WorkflowModel` (qualification template). |
| 5. AI provider | OpenRouter / direct key, or "use platform-managed" | Store key in orchestrator vault. Set spend cap. |
| 6. Approval defaults | Who approves outbound sends, calling hours, DND defaults | Write into tenant policy rows. |

Each step is independently completable. WhatsApp and Voice are explicitly **skippable** — a brokerage can use the chat + Twenty CRM with no channels connected.

## 5. Optional direct CRM access

Twenty is the customer's CRM. They own it.

- Every workspace gets its Twenty URL (e.g. `crm.pratap.ai/workspace-id` or a subdomain) and an admin API key.
- A "Open in CRM" button in our chat header deep-links to the lead in Twenty.
- Power users (managers, ops) can edit Twenty directly. The orchestrator's outbound-webhook handler at `/api/webhooks/twenty` will see those edits and update the chat sidebar.
- This is the "advanced mode" — most users never need it.

## 6. What it looks like in code (concrete next steps)

In priority order:

1. **`lib/twenty/client.ts`** — typed REST client (`createLead`, `updateLead`, `addTimelineActivity`, `searchLeads`, `listProperties`) using workspace API key from tenant config. Drop most of the in-memory `src/lib/crm-data.ts`.
2. **`lib/whatsapp/meta-api.ts`** — port from wacrm (`sendTextMessage`, `sendTemplateMessage`, interactive sends, media). GCM-encrypt creds at rest.
3. **`app/api/webhooks/whatsapp/route.ts`** — HMAC verify, resolve tenant by `phone_number_id`, upsert into Twenty, append `TimelineActivity`.
4. **`app/api/ingest/leads/route.ts`** — n8n / Meta Lead Ads / website forms enter here. Dedup by normalized phone, write to Twenty.
5. **`lib/dograh/client.ts`** — typed wrapper for `initiate-call`, `get-workflow-run`, poll loop.
6. **`app/api/mcp/route.ts`** — our MCP server exposing the tools listed in §3.
7. **`app/api/agent/route.ts`** — replace the current `.find()`-over-array stub with an LLM call that uses the MCP tools through AI SDK + tool calling.
8. **`app/onboarding/page.tsx` + `app/api/onboarding/*`** — the six-step wizard above.
9. **`lib/audit/agent-decision.ts`** — write `AgentDecision` rows on every agent action; weekly batch recomputes tenant weights.

## 7. Stability + simple UI guardrails

- One UI surface (`/dashboard`) for the customer. Settings, integrations, audit log live behind a small gear icon, not on the main page.
- Twenty is hidden by default. Users only see it if they click "Open in CRM" on a record.
- Every external action (WhatsApp send, call placed) goes through an `approval_requests` row. Even AI-proposed internal updates can be auto-approved per tenant policy, but the row exists for audit.
- Cron jobs (queue drains, polling Dograh, weekly weight recompute) live in `app/api/cron/*` and stay invisible to the user.
- All provider creds encrypted at rest, decrypted only inside server functions, never sent to the browser.

## 8. What we are explicitly NOT building

- Our own voice stack (Pipecat is plenty).
- Our own CRM object engine (Twenty's metadata API is plenty).
- Our own automation/flow builder for v1 (Twenty workflows + our orchestrator's rules cover real-estate needs).
- wacrm's flows engine (duplicate of above).
- Multi-CRM support. Twenty is the only CRM we sync to. If a customer wants HubSpot, that's a later integration, not the core path.
