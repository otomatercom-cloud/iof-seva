# WhatsApp relay (Meta Cloud API)

1. Meta Business → WhatsApp → create app, add a phone number, create a **permanent System User token** (whatsapp_business_messaging).
2. Create a message template `iof_case_alert` (category Utility, language en) with body: `IOF Seva: {{1}}` and get it approved.
3. Run on the server (pm2): `RELAY_TOKEN=<random> WA_TOKEN=<meta token> WA_PHONE_ID=<phone number id> node relay.mjs` (listens on 127.0.0.1:3020).
4. Odoo → Settings → Technical → System Parameters: `otm_iof_seva.whatsapp_url` = `http://127.0.0.1:3020`, `otm_iof_seva.whatsapp_token` = the RELAY_TOKEN.
5. Enable WhatsApp on an alert event and give a user a WhatsApp number (Settings → My alerts). Outbox rows are retried 3 times.
Never commit tokens. No victim data is ever sent (only the alert text).
