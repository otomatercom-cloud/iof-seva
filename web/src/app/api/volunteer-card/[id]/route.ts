import { NextResponse } from "next/server";
import { ODOO_URL, OdooError, callApi, sessionId } from "@/lib/server/odoo";

/** Streams a volunteer's ID card PDF using the signed-in user's own Odoo session. */
export async function GET(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  if (!/^\d{1,10}$/.test(id)) return NextResponse.json({ error: "Bad request." }, { status: 400 });
  const sid = await sessionId();
  if (!sid) return NextResponse.json({ error: "Please sign in again." }, { status: 401 });
  try {
    const ref = (await callApi(sid, "otm.iof.api", "volunteer_card_ref", [Number(id)])) as { reportName: string; memberId: number };
    if (!/^[\w.]+$/.test(ref.reportName)) throw new OdooError("Invalid report.", 400);
    const r = await fetch(`${ODOO_URL}/report/pdf/${ref.reportName}/${ref.memberId}`, { headers: { Cookie: `session_id=${sid}` }, cache: "no-store" });
    if (!r.ok || !(r.headers.get("content-type") ?? "").includes("pdf")) return NextResponse.json({ error: "Could not create the card PDF." }, { status: 502 });
    return new NextResponse(r.body, { headers: { "Content-Type": "application/pdf", "Content-Disposition": `inline; filename="iof-id-card-${id}.pdf"`, "Cache-Control": "private, no-store" } });
  } catch (e) {
    const err = e as OdooError;
    return NextResponse.json({ error: err.message }, { status: err.status ?? 400 });
  }
}
