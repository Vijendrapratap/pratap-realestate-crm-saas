# Pratap AI Real Estate CRM SaaS

> One AI workspace for real-estate brokerages. Leads, WhatsApp, voice calls, and CRM all sync behind a single chat interface.

The user types in plain language. The AI reads the CRM, drafts follow-ups, ranks property matches, and proposes actions. WhatsApp sends and voice calls are approval-gated. Twenty CRM is the source of truth. wacrm helper code drives WhatsApp messages. Dograh handles voice. Nothing fragmented — one workspace, one timeline, one approval queue.

---

## 30-second mental model

```
              ┌────────────────────────────┐
              │   What the user sees       │
              │                            │
              │   • Marketing landing      │
              │   • 6-step onboarding      │
              │   • Chat workspace         │  ←── ONE primary surface
              │   • CRM dashboard          │       (everything else is
              │   • Activity timeline      │        plumbing)
              │   • WhatsApp page          │
              │   • Voice page             │
              └─────────────┬──────────────┘
                            │
              ┌─────────────▼──────────────┐
              │  Pratap orchestrator       │
              │  (this Next.js repo)       │
              │                            │
              │  • AI agent + MCP server   │
              │  • Webhook receivers       │
              │  • Audit + approval queue  │
              │  • Tenant config vault     │
              └──┬──────────┬────────┬─────┘
                 │          │        │
       ┌─────────▼──┐  ┌────▼────┐  ┌▼──────────┐
       │ Twenty CRM │  │WhatsApp │  │  Dograh   │
       │  (truth)   │  │ (Meta)  │  │  (voice)  │
       └────────────┘  └─────────┘  └───────────┘
```

**Twenty holds every lead, property, activity, and task.** WhatsApp and voice are *channels* the orchestrator talks to, then writes back to Twenty as timeline events. The chat surface reads from Twenty through typed tools, never from the channels directly.

---

## Why this shape

Three open-source projects influenced the architecture. The decision for each was studied against "build it ourselves":

| Service | Role | Why we use it | What we don't take |
|---|---|---|---|
| **Twenty** | Source of truth for leads, properties, activities, tasks | Multi-tenant CRM with REST + GraphQL + native MCP, schema-per-workspace in one Postgres, outbound webhooks with HMAC | We don't fork it. We run one instance, workspace per customer. |
| **wacrm** | WhatsApp helper code | The `meta-api.ts` named-arg helpers prevent swapped-credential bugs, plus HMAC verify and phone utils | We don't deploy wacrm. It's single-tenant by design. We ported the helpers. |
| **Dograh** | Voice calls (Hindi/English) | Multi-tenant via `organization_id`, pluggable telephony (Twilio, Plivo, Telnyx, Vonage), ships its own LLM/STT/TTS stack via Pipecat | We don't rebuild Pipecat. We deploy Dograh, call REST, poll for results. |

Full study: [docs/sync-architecture.md](./docs/sync-architecture.md) and [docs/source-repo-analysis.md](./docs/source-repo-analysis.md).

---

## How a chat turn flows

```
  User types in /dashboard
        │
        ▼
  POST /api/agent  {message, leadId, tenantId}
        │
        ▼
  ┌─────────────────────────────────────────────┐
  │ Agent runner                                │
  │                                             │
  │  AI key set?  ── yes ─► AI SDK + OpenRouter │
  │                          + 14 typed tools   │
  │  AI key set?  ── no  ─► deterministic       │
  │                          intent router      │
  └─────────────────────────────────────────────┘
        │
        ▼
  Tool calls fan out to:
   • TwentyClient (read leads, write activities)
   • DograhClient (place call, fetch transcript)
   • Meta Cloud API direct (send WhatsApp)
        │
        ▼
  Every call records an AgentDecision row:
   • proposed / approved / rejected / executed
   • outcome: success / failure
        │
        ▼
  Server streams text back, then a
  __META__ frame with structured data
  (tool calls, property matches)
        │
        ▼
  Dashboard appends text as chunks arrive,
  then renders match cards and "proposed
  CRM updates" panel
```

The same 14 tools are exposed by [`/api/mcp`](src/app/api/mcp/route.ts) as a JSON-RPC 2.0 server, so any MCP client (Claude Desktop, Cursor, internal agents) can reach the same surface.

---

## How a lead enters the system

```
                    Inbound channels
   ┌──────────┬──────────┬──────────┬──────────┐
   │ Meta Ads │  n8n     │ 99acres  │ WhatsApp │
   │ webhook  │ scraper  │ parser   │ message  │
   └────┬─────┴────┬─────┴────┬─────┴────┬─────┘
        │          │          │          │
        ▼          ▼          ▼          ▼
   POST /api/ingest/leads      /api/webhooks/whatsapp
                  │                       │
                  ▼                       ▼
        ┌─────────────────────────────────────┐
        │  Pratap orchestrator                │
        │   1. Normalize phone                │
        │   2. Look up by phone (dedup)       │
        │   3. Create Twenty Person record    │
        │   4. Append TimelineActivity        │
        │   5. Apply routing rule + owner     │
        │   6. Record AgentDecision           │
        └─────────────────────────────────────┘
                  │
                  ▼
              Twenty CRM
              (the only place data lives)
                  │
                  ▼
           Sidebar lead list updates
           on next workspace refresh
```

There's no duplicate database. Twenty owns the record. The orchestrator is a stateless API layer plus an audit log.

---

## What ships in the box (today)

### Surfaces

| URL | What it is |
|---|---|
| `/` | Minimal landing — single CTA |
| `/onboarding` | 6-step wizard (brokerage → sources → WhatsApp → voice → AI → approvals) |
| `/dashboard` | AI chat workspace (default tab) |
| `/dashboard/crm` | CRM dashboard — stats, pipeline, leads table, inventory |
| `/dashboard/activity` | Combined timeline: CRM activities + agent decisions |
| `/dashboard/whatsapp` | Connection status + recent WhatsApp activity |
| `/dashboard/voice` | Connection status + recent calls |

### API + backend

| Route | Purpose |
|---|---|
| `POST /api/agent` | Chat with the AI agent, streamed |
| `GET /api/agent` | Tool surface + connectivity + recent decisions |
| `POST /api/mcp` | JSON-RPC 2.0 MCP server (initialize, tools/list, tools/call) |
| `POST /api/ingest/leads` | n8n / Meta / portal webhook entrypoint |
| `POST /api/webhooks/whatsapp` | Meta WhatsApp Cloud webhook (HMAC-verified) |
| `POST /api/webhooks/twenty` | Twenty outbound webhook receiver |
| `POST /api/calls/start` | Trigger Dograh outbound call |
| `POST /api/onboarding` | Save brokerage profile |
| `GET /api/crm` | Lists for sidebar, dashboards, sections |
| `GET /api/health` | Healthcheck |

### The 14 AI tools

Defined once in [src/lib/agent/tools.ts](src/lib/agent/tools.ts), used by both the chat agent and the MCP server.

| Tool | Approval? |
|---|---|
| `search_leads` | — |
| `get_lead` | — |
| `find_lead_by_phone` | — |
| `create_lead` (dedupes by phone) | — |
| `update_lead` | — |
| `move_stage` | — |
| `add_note` | — |
| `search_properties` | — |
| `match_properties_for_lead` (cross-record reasoning) | — |
| `draft_whatsapp` (returns text, doesn't send) | — |
| `send_whatsapp` | **yes** |
| `draft_call_script` | — |
| `start_call` | **yes** |
| `list_recent_decisions` | — |

Every tool call writes an `AgentDecision` row: prompt → proposed action → status (proposed / auto_approved / approved / rejected / executed) → outcome. The agent reads its own approval/rejection stats from prior decisions on every new query — that's the "learns over time" loop.

---

## Live vs mock — what's currently connected

```
                    Live? (env-driven)
   ┌──────────────────────────────────────┐
   │ Twenty CRM     ●     mock by default │
   │                       (TWENTY_API_KEY)│
   │                                      │
   │ WhatsApp       ●     mock by default │
   │                       (META_*)        │
   │                                      │
   │ Dograh voice   ●     mock by default │
   │                       (DOGRAH_*)      │
   │                                      │
   │ AI provider    ●     LIVE in dev     │
   │                       (OpenRouter)    │
   └──────────────────────────────────────┘
```

Each integration has a typed client with a `mock` mode that returns deterministic demo data. Setting the relevant env vars in [.env.local](.env.example) flips the client to `live` — the agent code path doesn't change. This lets the chat + CRM + onboarding work end-to-end without any external service running.

To run with a real Twenty:

```bash
# Stand up Twenty locally (one-time)
mkdir -p /tmp/twenty-stack
cp /home/pratap/repo-analysis/twenty/packages/twenty-docker/docker-compose.yml /tmp/twenty-stack/
# Pick a free host port (3000 is our app), generate keys, then:
cd /tmp/twenty-stack && docker compose up -d

# Sign up in the browser, get an API key, then in .env.local:
#   TWENTY_SERVER_URL=http://localhost:3002
#   TWENTY_API_KEY=<your key>

pnpm dev
```

---

## How the AI agent improves over time

```
   User asks something
        ▼
   Agent loads its system prompt
        │
        │  ← buildSystemPrompt() injects:
        │      Learned from this workspace (last N decisions):
        │        search_leads: 5 proposed, 100% approved
        │        send_whatsapp: 3 proposed, 67% approved, 33% rejected
        │        If a tool has a high rejection rate here,
        │        propose alternatives or ask before using it.
        │
        ▼
   Agent makes tool calls
        ▼
   Each tool call writes an AgentDecision row
        ▼
   Next query reads from those decisions
```

No fine-tuning, no vector DB needed for this loop. The agent reads its own approval history from the same Postgres that holds leads, computes per-tool stats with a SQL aggregate, and feeds them into its system prompt as RAG context.

When message bodies + call transcripts grow large enough to warrant semantic search, we add **pgvector inside Twenty's Postgres** — not a separate vector DB. See [docs/sync-architecture.md](./docs/sync-architecture.md) for the path.

---

## Tech stack

- **Frontend + API**: Next.js 16 (App Router) + React 19 + TypeScript + Tailwind CSS v4
- **AI**: Vercel AI SDK v6 + OpenRouter (model defaults to `anthropic/claude-haiku-4.5`)
- **CRM**: Twenty (self-hosted, one instance, workspace-per-tenant)
- **Voice**: Dograh (self-hosted) over REST
- **WhatsApp**: Meta WhatsApp Cloud API direct (helpers ported from wacrm)
- **MCP**: JSON-RPC 2.0 over HTTP, Bearer-token auth
- **Package manager**: pnpm
- **Deploy target**: Vercel

---

## Local development

```bash
pnpm install
pnpm dev        # Next.js dev server at http://localhost:3000
pnpm lint       # ESLint
pnpm typecheck  # tsc --noEmit
pnpm build      # Production build
pnpm check      # lint + typecheck + build
```

Minimum env for AI-enabled chat (full list in [.env.example](.env.example)):

```bash
# AI provider (chat works without this in deterministic fallback mode):
OPENROUTER_API_KEY=sk-or-...
AI_PROVIDER=openrouter
AI_MODEL=anthropic/claude-haiku-4.5

# Add for live Twenty:
TWENTY_SERVER_URL=http://localhost:3002
TWENTY_API_KEY=...

# Add for live WhatsApp:
META_APP_ID=...
META_APP_SECRET=...
META_ACCESS_TOKEN=...
META_WABA_ID=...
META_PHONE_NUMBER_ID=...
WHATSAPP_VERIFY_TOKEN=...

# Add for live voice:
DOGRAH_API_URL=...
DOGRAH_API_KEY=...
DOGRAH_ORG_ID=...
```

`.env.local` is gitignored. Never commit secrets.

---

## Repo layout

```
src/
├── app/
│   ├── page.tsx                  # Landing
│   ├── onboarding/page.tsx       # 6-step wizard
│   ├── dashboard/
│   │   ├── layout.tsx            # Shared sidebar (nav + leads list)
│   │   ├── sidebar.tsx           # Chat / CRM / Activity / WhatsApp / Voice
│   │   ├── workspace-context.tsx # Tenant + leads context
│   │   ├── page.tsx              # Chat (default)
│   │   ├── crm/page.tsx          # CRM dashboard
│   │   ├── activity/page.tsx     # Timeline
│   │   ├── whatsapp/page.tsx     # Status + activity
│   │   └── voice/page.tsx        # Status + calls
│   └── api/
│       ├── agent/route.ts        # Chat agent, streams via SSE
│       ├── mcp/route.ts          # JSON-RPC 2.0 MCP server
│       ├── crm/route.ts          # Sidebar + dashboards data
│       ├── ingest/leads/route.ts # n8n / Meta / portal entrypoint
│       ├── webhooks/
│       │   ├── whatsapp/route.ts # Meta Cloud HMAC-verified
│       │   └── twenty/route.ts   # Twenty outbound webhooks
│       ├── calls/start/route.ts  # Trigger Dograh call
│       ├── onboarding/route.ts   # Save profile
│       └── health/route.ts
├── lib/
│   ├── tenant/config.ts          # Env → tenant config + connectivity
│   ├── twenty/{client,types}.ts  # Twenty REST + mock fallback
│   ├── whatsapp/meta-api.ts      # Ported from wacrm: send + HMAC + parse
│   ├── dograh/client.ts          # Dograh REST + poll
│   ├── audit/decisions.ts        # AgentDecision log + signals
│   ├── onboarding/profile.ts     # Profile shape + save/list
│   ├── agent/
│   │   ├── tools.ts              # 14 typed tools (shared)
│   │   ├── runner.ts             # Dispatcher: AI vs deterministic
│   │   └── ai-runner.ts          # AI SDK + OpenRouter + streaming
│   └── crm-data.ts               # Demo dataset (mock-mode source)
docs/
├── blueprint.md
├── sync-architecture.md          # Full architectural rationale
├── source-repo-analysis.md       # Twenty/wacrm/Dograh deep dives
└── ...
```

---

## Product principles

1. **Simple UI first.** Non-technical users should not need to understand APIs, webhooks, MCP, or CRM internals. One chat surface, one CTA per page.
2. **CRM is the source of truth.** All channel activity syncs back to Twenty's timeline. No parallel databases.
3. **Approval-gated AI.** AI can read, draft, summarize, and propose. External WhatsApp sends and voice calls require approval unless a tenant policy explicitly auto-approves.
4. **Tenant separation.** Each brokerage gets its own Twenty workspace, its own credentials, its own audit log.
5. **Provider modularity.** WhatsApp, voice, AI, and automation providers should be replaceable without rewriting the product. Every external dependency hides behind a typed client.
6. **Mock-by-default.** Every integration has a `mock` mode so the product works offline. Flipping to `live` is a config change, not a code change.

---

## Next steps

In priority order:

1. **Stand up Twenty locally** for the demo brokerage and run the full agent → CRM round-trip live (rather than against mock data).
2. **Wire onboarding provisioning** — the wizard collects data but doesn't yet call Twenty Metadata API to create the workspace + real-estate template objects.
3. **Enable pgvector inside Twenty's Postgres** once message bodies + transcripts justify semantic search.
4. **Tool-call streaming** in the chat — show "calling search_leads…" / "found 2 hot leads" as the model works, not just the final text.
5. **Deploy** to Vercel (the architecture is Vercel-native — Next.js App Router, Fluid Compute friendly).
