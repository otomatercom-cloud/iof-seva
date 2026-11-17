// IOF Seva -> Meta WhatsApp Cloud API relay. No dependencies (Node 18+).
// Odoo outbox POSTs {to,text,event,caseId} with "Authorization: Bearer <RELAY_TOKEN>".
// We send an approved TEMPLATE (business-initiated messages need one) with the text as {{1}}.
import http from "node:http";
import { timingSafeEqual } from "node:crypto";

const { RELAY_TOKEN, WA_TOKEN, WA_PHONE_ID, WA_TEMPLATE = "iof_case_alert", WA_LANG = "en", PORT = "3020", GRAPH = "https://graph.facebook.com/v21.0" } = process.env;
if (!RELAY_TOKEN || !WA_TOKEN || !WA_PHONE_ID) { console.error("Set RELAY_TOKEN, WA_TOKEN, WA_PHONE_ID"); process.exit(1); }

const same = (a, b) => { const x = Buffer.from(a), y = Buffer.from(b); return x.length === y.length && timingSafeEqual(x, y); };

http.createServer(async (req, res) => {
  const out = (c, o) => { res.writeHead(c, { "content-type": "application/json" }); res.end(JSON.stringify(o)); };
  if (req.method !== "POST") return out(405, { error: "POST only" });
  if (!same((req.headers.authorization || "").replace(/^Bearer /, ""), RELAY_TOKEN)) return out(401, { error: "bad token" });
  let body = ""; for await (const c of req) { body += c; if (body.length > 20000) return out(413, { error: "too large" }); }
  let m; try { m = JSON.parse(body); } catch { return out(400, { error: "bad json" }); }
  const to = String(m.to || "").replace(/\D/g, "");
  if (to.length < 8) return out(400, { error: "bad number" });
  const text = String(m.text || "").replace(/[\n\t]+/g, " ").slice(0, 900);
  const r = await fetch(`${GRAPH}/${WA_PHONE_ID}/messages`, {
    method: "POST", headers: { authorization: `Bearer ${WA_TOKEN}`, "content-type": "application/json" },
    body: JSON.stringify({ messaging_product: "whatsapp", to, type: "template",
      template: { name: WA_TEMPLATE, language: { code: WA_LANG }, components: [{ type: "body", parameters: [{ type: "text", text }] }] } }),
  }).catch((e) => ({ ok: false, status: 502, text: async () => String(e) }));
  const t = await r.text();
  if (!r.ok) { console.error("Meta error", r.status, t.slice(0, 300)); return out(502, { error: "meta", status: r.status }); }
  out(200, { ok: true });
}).listen(Number(PORT), "127.0.0.1", () => console.log("relay on", PORT));
