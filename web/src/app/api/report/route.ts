import { NextResponse } from "next/server";
import { ODOO_URL } from "@/lib/server/odoo";

const H = () => ({ "Content-Type": "application/json", "X-IOF-Key": process.env.IOF_PUBLIC_KEY ?? "" });

/** Public: form options (issue types, committees) from Odoo. */
export async function GET() {
  try {
    const r = await fetch(`${ODOO_URL}/iof/public-config`, { headers: H(), cache: "no-store" });
    return NextResponse.json(await r.json(), { status: r.status });
  } catch { return NextResponse.json({ issueTypes: [], committees: [] }); }
}

/** Public: submit a report. The visitor's IP is forwarded for the per-IP rate limit. */
export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));
  const ip = (req.headers.get("x-forwarded-for") ?? "").split(",")[0].trim() || req.headers.get("x-real-ip") || "unknown";
  try {
    const r = await fetch(`${ODOO_URL}/iof/public-report`, { method: "POST", headers: H(), body: JSON.stringify({ ...body, ip }), cache: "no-store" });
    return NextResponse.json(await r.json().catch(() => ({ error: "Please call us." })), { status: r.status });
  } catch { return NextResponse.json({ error: "Service unavailable. Please call us." }, { status: 502 }); }
}
