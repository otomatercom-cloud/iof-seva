import { NextResponse, type NextRequest } from "next/server";
import { json, sameOrigin } from "@/public/lib/guard";
import { cookieOptions, EDITOR_COOKIE } from "@/public/lib/editor-auth";

export async function POST(req: NextRequest) {
  if (!sameOrigin(req)) return json(403, { ok: false, error: "forbidden" });
  const res = NextResponse.json({ ok: true }, { headers: { "Cache-Control": "no-store" } });
  res.cookies.set(EDITOR_COOKIE, "", cookieOptions(0));
  return res;
}

/** GET clears the cookie too (used when the Odoo session expired) and may only go back to "/" or the login page. */
export async function GET(req: NextRequest) {
  const next = req.nextUrl.searchParams.get("next");
  const res = new NextResponse(null, { status: 303, headers: { Location: next === "/editor/login" ? next : "/", "Cache-Control": "no-store" } });
  res.cookies.set(EDITOR_COOKIE, "", cookieOptions(0));
  return res;
}
