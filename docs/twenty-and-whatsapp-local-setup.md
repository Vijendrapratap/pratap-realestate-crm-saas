# Twenty + WhatsApp Local Setup

## Twenty local install

Twenty is installed as a separate local self-hosted CRM so we can study and demo it without mixing its monorepo into this real-estate SaaS codebase.

- Install directory: `/home/pratap/apps/twenty-selfhost`
- Local URL: `http://localhost:3001`
- Health check: `http://localhost:3001/healthz`
- Docker compose project: `twenty`
- Persistent Docker volumes:
  - `twenty_db-data`
  - `twenty_server-local-data`

### Commands

```bash
cd /home/pratap/apps/twenty-selfhost

docker compose --env-file .env up -d
docker compose --env-file .env ps
docker compose --env-file .env logs -f server
docker compose --env-file .env logs -f worker
docker compose --env-file .env down
```

### Login / demo notes

The local instance is running with seeded CRM data. The UI shows standard Twenty objects:

- Companies
- People
- Opportunities
- Tasks
- Notes
- Dashboards
- Workflows
- Settings / data model customization

Twenty's useful product lessons for our real-estate CRM:

- Use a clean spreadsheet-like table for leads, companies, projects, and properties.
- Support custom fields and views, but keep V1 opinionated for real estate.
- Keep pipeline/opportunity board concepts, adapted into Indian real-estate lead stages.
- Use Settings for tenant configuration: team, roles, lead sources, WhatsApp, templates, stages, inventory.
- Borrow API-key/webhook patterns for integrations.

## WhatsApp connection plan

Twenty does not provide a native WhatsApp CRM/inbox. For WhatsApp-first real-estate workflows, use a dedicated Meta WhatsApp Cloud API integration in this SaaS, borrowing patterns from the local `wacrm` reference repo.

### Required Meta WhatsApp credentials

From Meta Business / WhatsApp Cloud API, collect:

- `META_APP_ID`
- `META_APP_SECRET`
- `META_ACCESS_TOKEN` — ideally a permanent system-user token with WhatsApp permissions
- `META_WABA_ID` — WhatsApp Business Account ID
- `META_PHONE_NUMBER_ID` — phone number ID used for sending messages
- `WHATSAPP_VERIFY_TOKEN` — random token we generate and paste into Meta webhook settings
- Public webhook URL — local development needs ngrok/cloudflared; production needs the deployed app URL

Never commit real values. Put them only in `.env.local` / deployment secrets.

### Webhook endpoint target

For this Next.js app, reserve:

- `GET /api/whatsapp/webhook` — Meta webhook verification challenge
- `POST /api/whatsapp/webhook` — inbound messages, delivery/read statuses, reactions, button replies

Example production callback URL:

```text
https://crm.pratapai.com/api/whatsapp/webhook
```

Example local callback URL using a tunnel:

```text
https://<tunnel-domain>/api/whatsapp/webhook
```

### First implementation scope

1. Verify the configured phone number ID against Meta Graph API.
2. Store tenant WhatsApp config encrypted.
3. Receive inbound messages and attach them to leads/contacts.
4. Send approved template messages for first-touch follow-ups.
5. Send free-form messages only inside Meta's 24-hour customer-service window.
6. Record every send/receive/status event in an immutable activity timeline.
7. Add human approval before any AI-generated outbound campaign.

### Local connection test command

After credentials are in `.env.local`, verify phone metadata with:

```bash
curl -sS \
  -H "Authorization: Bearer $META_ACCESS_TOKEN" \
  "https://graph.facebook.com/v21.0/$META_PHONE_NUMBER_ID?fields=id,display_phone_number,verified_name,quality_rating"
```

Expected result: JSON containing `id`, `display_phone_number`, and optionally `verified_name` / `quality_rating`.

### Recommended product decision

Keep Twenty as a reference/demo CRM. Do not embed it directly for V1. Build our real-estate SaaS with a WhatsApp-native workflow inspired by `wacrm`, while borrowing Twenty's UX patterns for objects, fields, list views, pipeline views, settings, API keys, and webhooks.
