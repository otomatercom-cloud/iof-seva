import { NextResponse } from "next/server";
import { ALLOWED, OdooError, callApi, sessionId } from "@/lib/server/odoo";

/** BFF: the browser only ever calls whitelisted otm.iof.api methods with its own httpOnly session. */
export async function POST(req: Request) {
  const { method, args } = await req.json().catch(() => ({}));
  if (!ALLOWED.has(method) || !Array.isArray(args ?? [])) return NextResponse.json({ error: "Unknown action." }, { status: 400 });
  const sid = await sessionId();
  if (!sid) return NextResponse.json({ error: "Please sign in again." }, { status: 401 });
  try {
    return NextResponse.json({ result: await callApi(sid, "otm.iof.api", method, args ?? []) });
  } catch (e) {
    const err = e as OdooError;
    return NextResponse.json({ error: err.message }, { status: err.status ?? 400 });
  }
}
