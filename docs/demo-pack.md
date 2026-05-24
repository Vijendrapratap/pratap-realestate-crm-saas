# Brokerage CRM Demo Pack

This demo now has two surfaces:

1. **Custom real-estate operating dashboard** — `/dashboard`
   - Brokerage-specific leads, inbound queue, pipeline, property matching, agent testing, lead ingest, export, and integration readiness.
   - API-backed through `/api/crm`, `/api/agent`, and `/api/integrations`.

2. **Twenty CRM demo workspace** — self-hosted Twenty with sample CRM data
   - Temporary public URL: `https://lucy-dishes-modular-therapist.trycloudflare.com`
   - Workspace: `Apple`
   - Demo login: `tim@apple.dev`
   - Demo password: `tim@apple.dev`
   - Sample data includes companies, people, opportunities, tasks, notes, and workflows.

## Current agent model status

The current dashboard agent is intentionally a safe deterministic demo agent. It does **not** require or call an external LLM by default, so the demo remains stable and does not consume tokens.

Production connection path:

- Add server-side environment variables: `AI_PROVIDER`, `AI_MODEL`, `AI_PROVIDER_API_KEY`.
- Keep model calls server-side only.
- Give the agent tool permissions gradually: read CRM → draft updates → write internal CRM fields → queue external communications.
- Keep WhatsApp and voice behind approval gates.

## WhatsApp connection path

Recommended provider: WhatsApp Business Cloud API.

Required server-side secrets:

- `WHATSAPP_PHONE_NUMBER_ID`
- `WHATSAPP_WABA_ID`
- `WHATSAPP_ACCESS_TOKEN`
- `WHATSAPP_APP_SECRET`
- `WHATSAPP_VERIFY_TOKEN`

Production flow:

1. Verify Meta Business and WABA.
2. Add/verify phone number.
3. Configure templates.
4. Receive inbound webhooks into a backend endpoint.
5. Let AI draft responses.
6. Require human approval before outbound messages, especially for high-value leads.

## Voice connection path

Recommended first step: hosted voice provider rather than self-hosting telephony.

Required server-side secrets:

- `VOICE_PROVIDER`
- `VOICE_API_KEY`
- `VOICE_FROM_NUMBER`
- `VOICE_WEBHOOK_SECRET`

Production flow:

1. Choose a voice/telephony provider.
2. Buy or verify outbound number.
3. Configure webhook for call status, transcript, and outcome.
4. Write transcript/outcome back to CRM activities.
5. Enforce consent/DND checks before calls.

## Data ownership path

Current state: demo data is static/sample-backed so prospects can click and understand value immediately.

Production state should add:

- tenant database per brokerage or tenant-isolated schema,
- role-based login,
- import/export controls,
- audit log for every AI action,
- credential vault for WhatsApp/voice/model keys,
- delete/export data controls for the brokerage admin.
