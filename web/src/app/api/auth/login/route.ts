import { NextResponse } from "next/server";
import { ODOO_DB, ODOO_URL, SID, clearLimit, limited, sameOrigin } from "@/lib/server/odoo";

export async function POST(req: Request) {
  if (!sameOrigin(req)) return NextResponse.json({ error: "Forbidden." }, { status: 403 });
  const { email, password } = await req.json().catch(() => ({}));
  const ip = (req.headers.get("x-forwarded-for") ?? "").split(",")[0].trim() || "local";
  const key = `login:${ip}:${String(email ?? "").toLowerCase()}`;
  if (limited(key, 8, 15 * 60_000)) return NextResponse.json({ error: "Too many attempts. Try again in 15 minutes." }, { status: 429 });
  if (!email || !password) return NextResponse.json({ error: "Enter e-mail and password." }, { status: 400 });
  let r: Response;
  try {
    r = await fetch(`${ODOO_URL}/web/session/authenticate`, {
      method: "POST", headers: { "Content-Type": "application/json" }, cache: "no-store",
      body: JSON.stringify({ jsonrpc: "2.0", method: "call", params: { db: ODOO_DB, login: email, password } }),
    });
  } catch { return NextResponse.json({ error: "Server not reachable. Try again shortly." }, { status: 502 }); }
  const j = await r.json().catch(() => null);
  const m = /session_id=([^;]+)/.exec(r.headers.get("set-cookie") ?? "");
  if (!j?.result?.uid || !m) return NextResponse.json({ error: "Wrong e-mail or password." }, { status: 401 });
  clearLimit(key);
  const res = NextResponse.json({ ok: true });
  res.cookies.set(SID, m[1], { httpOnly: true, sameSite: "lax", path: "/", secure: process.env.NODE_ENV === "production", maxAge: 60 * 60 * 12 });
  return res;
}
