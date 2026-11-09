import "server-only";
import { cookies } from "next/headers";

export const ODOO_URL = (process.env.ODOO_URL ?? "http://127.0.0.1:8069").replace(/\/$/, "");
export const ODOO_DB = process.env.ODOO_DB ?? "iof";
export const SID = "iof_sid";

export const ALLOWED = new Set([
  "bootstrap", "get_case", "list_cases", "export_cases", "stats", "get_document", "register_case", "submit_case", "update_case", "assign", "transfer", "decide_transfer", "change_status",
  "add_timeline", "add_finance", "add_document", "upsert_issue_type", "toggle_issue_type", "toggle_committee", "set_prefix",
  "upsert_user", "toggle_user", "mark_read",
]);

export class OdooError extends Error {
  constructor(message: string, public status = 400) { super(message); }
}

/** Calls a method on the logged-in user's Odoo session. */
export async function callApi(sid: string, model: string, method: string, args: unknown[]) {
  const r = await fetch(`${ODOO_URL}/web/dataset/call_kw/${model}/${method}`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Cookie: `session_id=${sid}` },
    body: JSON.stringify({ jsonrpc: "2.0", method: "call", params: { model, method, args, kwargs: {} } }),
    cache: "no-store",
  });
  const j = await r.json().catch(() => null);
  if (!j) throw new OdooError("Odoo is not reachable.", 502);
  if (j.error) {
    const d = j.error.data ?? {};
    const expired = /session/i.test(d.name ?? "") || j.error.code === 100;
    throw new OdooError(d.message || j.error.message || "Odoo error", expired ? 401 : 400);
  }
  return j.result;
}

export async function sessionId() {
  return (await cookies()).get(SID)?.value ?? null;
}

/** Cross-site request guard: browsers send Origin on POST; it must be this site. (Cookie is also SameSite=Lax.) */
export function sameOrigin(req: Request) {
  const o = req.headers.get("origin");
  if (!o) return true;
  try { return new URL(o).host === (req.headers.get("x-forwarded-host") ?? req.headers.get("host")); } catch { return false; }
}
export const tooBig = (req: Request, mb = 20) => Number(req.headers.get("content-length") ?? 0) > mb * 1024 * 1024;

/** Simple in-memory brute-force limiter (per server process). */
const hits = new Map<string, { n: number; t: number }>();
export function limited(key: string, max: number, windowMs: number) {
  const now = Date.now();
  const h = hits.get(key);
  if (!h || now - h.t > windowMs) { hits.set(key, { n: 1, t: now }); return false; }
  h.n++;
  if (hits.size > 5000) for (const [k, v] of hits) if (now - v.t > windowMs) hits.delete(k);
  return h.n > max;
}
export const clearLimit = (key: string) => hits.delete(key);
