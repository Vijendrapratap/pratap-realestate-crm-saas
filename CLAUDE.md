@AGENTS.md

# Pratap AI Real Estate CRM SaaS

Vertical SaaS CRM for Indian real estate brokerages/developers: Twenty-style CRM workspace, lead lifecycle automation, Hindi/English AI voice qualification, WhatsApp/SMS follow-ups, analytics, and property inventory matching.

## Commands

- `pnpm dev` — Start local development server
- `pnpm lint` — Run ESLint
- `pnpm typecheck` — Run TypeScript check
- `pnpm build` — Production build
- `pnpm check` — Lint + typecheck + build

## Current Stack

Next.js App Router + React 19 + TypeScript + Tailwind CSS v4 + pnpm.

## Product Source of Truth

- `docs/proposal-requirements-summary.md` — extracted proposal requirements.
- `docs/blueprint.md` — architecture and build order.
- `src/lib/crm-data.ts` — current domain types and mock data.

## Architecture Rules

1. Build as a multi-tenant SaaS from the start: tenant/org should be present in future DB schema.
2. Keep provider integrations modular: telephony, WhatsApp/SMS, STT/TTS, LLM, and n8n should be swappable.
3. Every CRM action should eventually write an immutable activity event.
4. Pipeline stages: New, Contacted, Cold, Warm, Hot, Negotiation, Closed Won, Closed Lost.
5. UI should feel like a premium B2B CRM: dense, clear, fast, and Twenty-inspired, with Pratap brand palette.
6. Do not commit secrets. Use `.env.example` for required variables.

## Near-Term Build Order

1. Expand current homepage prototype into route-based dashboard sections.
2. Add real navigation and app shell.
3. Add lead profile page and activity timeline.
4. Add inventory page and matching explanation UI.
5. Add database schema, auth, and tenant model.
6. Add webhook endpoints for n8n lead ingestion.
