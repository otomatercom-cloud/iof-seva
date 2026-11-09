import { NextResponse } from "next/server";
import { ODOO_URL, OdooError, callApi, sameOrigin, sessionId, tooBig } from "@/lib/server/odoo";


/** GET is public (the website); POST needs a President session. */
export async function GET() {
  try {
    const r = await fetch(`${ODOO_URL}/iof/site`, { cache: "no-store" });
    return NextResponse.json(await r.json());
  } catch { return NextResponse.json({}); }
}

export async function POST(req: Request) {
  if (!sameOrigin(req)) return NextResponse.json({ error: "Forbidden." }, { status: 403 });
  if (tooBig(req)) return NextResponse.json({ error: "Content too large." }, { status: 413 });
  const sid = await sessionId();
  if (!sid) return NextResponse.json({ error: "Please sign in again." }, { status: 401 });
  try {
    await callApi(sid, "otm.iof.site.content", "save_content", [await req.json()]);
    return NextResponse.json({ ok: true });
  } catch (e) {
    const err = e as OdooError;
    return NextResponse.json({ error: err.message }, { status: err.status ?? 400 });
  }
}
