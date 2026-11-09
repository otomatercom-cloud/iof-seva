import { NextResponse } from "next/server";
import { ODOO_URL, SID, sessionId } from "@/lib/server/odoo";

export async function POST() {
  const sid = await sessionId();
  if (sid) await fetch(`${ODOO_URL}/web/session/destroy`, { method: "POST", headers: { "Content-Type": "application/json", Cookie: `session_id=${sid}` }, body: JSON.stringify({ jsonrpc: "2.0", method: "call", params: {} }) }).catch(() => {});
  const res = NextResponse.json({ ok: true });
  res.cookies.delete(SID);
  return res;
}
