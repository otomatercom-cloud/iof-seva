import { NextResponse, type NextRequest } from "next/server";
import { clientIp, json, readJson, sameOrigin } from "@/public/lib/guard";
import { rateLimit } from "@/public/lib/rate-limit";
import { cookieOptions, EDITOR_COOKIE, odooLogin } from "@/public/lib/editor-auth";

export async function POST(req: NextRequest) {
  if (!sameOrigin(req)) return json(403, { ok: false, error: "forbidden" });
  const rl = rateLimit(`editor-login:${clientIp(req)}`, 8, 10 * 60_000);
  if (!rl.allowed) return json(429, { ok: false, error: "rate_limited" }, { "Retry-After": String(rl.retryAfterSec) });
  const { body } = await readJson(req, 2_000);
  const login = typeof body?.login === "string" ? body.login.trim() : "";
  const password = typeof body?.password === "string" ? body.password : "";
  if (!login || !password || login.length > 200 || password.length > 200) return json(400, { ok: false, error: "invalid" });
  const r = await odooLogin(login, password);
  if ("error" in r) {
    const status = r.error === "credentials" ? 401 : r.error === "forbidden" ? 403 : r.error === "config" ? 503 : 502;
    return json(status, { ok: false, error: r.error });
  }
  const res = NextResponse.json({ ok: true }, { headers: { "Cache-Control": "no-store" } });
  res.cookies.set(EDITOR_COOKIE, r.sid, cookieOptions());
  return res;
}
