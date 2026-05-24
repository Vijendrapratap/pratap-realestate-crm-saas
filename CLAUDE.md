@AGENTS.md

# Pratap AI Real Estate CRM SaaS

Vertical SaaS CRM for Indian real estate brokerages/developers: Twenty-style CRM workspace, lead lifecycle automation, Hindi/English AI voice qualification, WhatsApp/SMS follow-ups, analytics, and property inventory matching.

## Commands

- `pnpm dev` — Start local development server
- `pnpm lint` — Run ESLint
- `pnpm typecheck` — Run TypeScript check
- `pnpm build` — Production build
- `pnpm check` — Lint + typecheck + build

## Git Identity / Deployment Guardrail

This repo deploys from GitHub to Vercel. Before committing or pushing, Claude Code must verify:

```bash
git config user.name "Vijendrapratap"
git config user.email "44225657+Vijendrapratap@users.noreply.github.com"
```

Never commit as `mrpratap`, `AI Bot`, `bot@example.com`, `pratap@example.com`, or any generic agent identity. If a bad author is created before push, fix it with `git commit --amend --reset-author` after setting the correct identity.

## Current Stack

Next.js App Router + React 19 + TypeScript + Tailwind CSS v4 + pnpm.

## Product Source of Truth

- `docs/proposal-requirements-summary.md` — extracted proposal requirements.
- `docs/blueprint.md` — refined architecture and build order.
- `docs/source-repo-analysis.md` — Twenty/wacrm/Dograh findings and integration strategy.
- `docs/crm-inbound-integration.md` — current inbound lead pipeline slice and WhatsApp/voice add-on guardrails.
- `src/lib/crm-data.ts` — current domain types and mock data.

## Architecture Rules

1. Build as a multi-tenant SaaS from the start: tenant/org should be present in future DB schema.
2. Keep provider integrations modular: telephony, WhatsApp/SMS, STT/TTS, LLM, and n8n should be swappable.
3. Every CRM action should eventually write an immutable activity event.
4. Pipeline stages: New, Contacted, Cold, Warm, Hot, Negotiation, Closed Won, Closed Lost.
5. UI should feel like a premium B2B CRM: dense, clear, fast, and Twenty-inspired, with Pratap brand palette.
6. Do not commit secrets. Use `.env.example` for required variables.

## Near-Term Build Order

1. Convert current homepage prototype into route-based dashboard sections with a shared app shell.
2. Add tenant-aware domain model and Supabase/Postgres schema.
3. Add activity timeline foundation before implementing mutating lead actions.
4. Add lead profile page, stage movement, tasks, and activity timeline.
5. Add inventory page and explainable matching service.
6. Add WhatsApp/SMS provider abstraction based on the wacrm named-argument helper pattern.
7. Add n8n/source lead ingestion endpoints with dedupe and assignment rules.
8. Add voice provider interface and call session model, keeping Dograh/self-hosted voice optional.
9. Add guided onboarding/configuration and Hermes-assisted approval workflows.
