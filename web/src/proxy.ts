import { NextResponse, type NextRequest } from "next/server";

/** Visitors with the editor cookie see the editable (dynamic) twin of each public page. Everyone else is untouched. */
export function proxy(req: NextRequest) {
  if (!req.cookies.get("iof_editor")?.value || req.method !== "GET") return NextResponse.next();
  const url = req.nextUrl.clone();
  url.pathname = "/ed" + (url.pathname === "/" ? "" : url.pathname);
  return NextResponse.rewrite(url);
}

// Public website pages ONLY. The case portal (/login, /dashboard, /cases ...) is never rewritten.
export const config = {
  matcher: ["/", "/about", "/collaborations", "/contact", "/gallery", "/indians-in-ksa", "/privacy-policy", "/reports",
    "/seva-activities", "/support", "/support/track", "/terms", "/volunteer-registration"],
};
