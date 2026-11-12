import "server-only";
import { cookies } from "next/headers";

export const EDITOR_COOKIE = "iof_editor";
export const EDITOR_MAX_AGE = 8 * 3600;

const base = () => (process.env.ODOO_BASE_URL || process.env.ODOO_URL)?.replace(/\/+$/, "") ?? "";

/** Sign in against Odoo; returns the Odoo session id (never the password) or a reason. */
export async function odooLogin(login: string, password: string): Promise<{ sid: string } | { error: "config" | "credentials" | "unreachable" | "forbidden" }> {
  const db = (process.env.ODOO_DATABASE || process.env.ODOO_DB);
  if (!base() || !db) return { error: "config" };
  try {
    const res = await fetch(`${base()}/web/session/authenticate`, {
      method: "POST", cache: "no-store", signal: AbortSignal.timeout(8000),
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ jsonrpc: "2.0", method: "call", params: { db, login, password } }),
    });
    const data = (await res.json().catch(() => null)) as { result?: { uid?: number | false } } | null;
    if (!data?.result?.uid) return { error: "credentials" };
    const sid = /(?:^|[\s,;])session_id=([^;,\s]+)/.exec(res.headers.getSetCookie().join(";"))?.[1];
    if (!sid) return { error: "unreachable" };
    const who = await editorCall("whoami", sid, {});
    if (who.status === 403) return { error: "forbidden" };
    return who.status === 200 ? { sid } : { error: "unreachable" };
  } catch {
    return { error: "unreachable" };
  }
}

export async function editorCall(path: "whoami" | "save" | "image", sid: string, body: unknown): Promise<{ status: number; data: Record<string, unknown> }> {
  try {
    const res = await fetch(`${base()}/api/iof/editor/${path}`, {
      method: "POST", cache: "no-store", signal: AbortSignal.timeout(20000),
      headers: { "Content-Type": "application/json", "X-IOF-Editor": "1", Cookie: `session_id=${sid}` },
      body: JSON.stringify(body),
    });
    return { status: res.status, data: ((await res.json().catch(() => ({}))) as Record<string, unknown>) ?? {} };
  } catch {
    return { status: 502, data: { ok: false, error: "unreachable" } };
  }
}

/** Valid editor session from the cookie, or null. Sessions are always re-checked against Odoo. */
export async function getEditor(): Promise<{ sid: string; name: string } | null> {
  const sid = (await cookies()).get(EDITOR_COOKIE)?.value;
  if (!sid || !/^[\w-]{20,200}$/.test(sid)) return null;
  const who = await editorCall("whoami", sid, {});
  return who.status === 200 && who.data.ok ? { sid, name: String(who.data.name ?? "") } : null;
}

export function cookieOptions(maxAge = EDITOR_MAX_AGE) {
  return { httpOnly: true, sameSite: "strict" as const, secure: process.env.NODE_ENV === "production", path: "/", maxAge };
}
