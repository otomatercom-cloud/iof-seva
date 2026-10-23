import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

/** Liveness probe for Nginx / uptime monitors. Does not touch Odoo or expose config. */
export function GET() {
  return NextResponse.json({ ok: true }, { headers: { "Cache-Control": "no-store" } });
}
